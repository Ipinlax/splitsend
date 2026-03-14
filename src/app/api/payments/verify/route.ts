// POST /api/payments/verify
// SECURITY: All payment verification happens server-side.
// Never trust frontend payment success — always verify with Paystack API.
import { NextRequest } from "next/server";
import { getServerUser, createAdminClient } from "@/lib/supabase/server";
import { verifyPaymentSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/utils";
import { CONNECTION_FEE_KOBO } from "@/constants";

export async function POST(request: NextRequest) {
  const rl = withRateLimit(request, "api/payments/verify", { max: 10, windowMs: 60_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid verification data.", 400, "VALIDATION_ERROR");

  const { reference, match_id } = parsed.data;
  const adminClient = createAdminClient();

  // Find the payment record — must belong to this user
  const { data: paymentRecord } = await adminClient
    .from("payments")
    .select("id, status, amount_kobo, user_id, match_id, webhook_processed")
    .eq("paystack_reference", reference)
    .eq("user_id", user.id)
    .eq("match_id", match_id)
    .single();

  if (!paymentRecord) {
    logger.warn("Payment record not found", { reference, userId: user.id });
    return errorResponse("Payment record not found.", 404, "NOT_FOUND");
  }

  // Prevent re-processing already verified payment
  if (paymentRecord.status === "success") {
    logger.warn("Duplicate payment verify attempt", { reference, userId: user.id });
    return successResponse({ already_verified: true, status: "success" });
  }

  // Verify with Paystack server-side
  let paystackResult;
  try {
    paystackResult = await verifyPaystackTransaction(reference);
  } catch (err) {
    logger.error("Paystack verification error", { reference, userId: user.id });
    return errorResponse("Payment verification failed. Please contact support.", 500);
  }

  const txData = paystackResult.data;

  // Validate amount — prevent partial payment exploits
  if (txData.amount < CONNECTION_FEE_KOBO) {
    logger.warn("Underpayment detected", { reference, expected: CONNECTION_FEE_KOBO, received: txData.amount });
    await adminClient.from("payments").update({ status: "failed", gateway_response: "Underpayment" })
      .eq("id", paymentRecord.id);
    return errorResponse("Payment amount does not match the required fee.", 400, "UNDERPAYMENT");
  }

  const paymentStatus = txData.status === "success" ? "success" : txData.status === "abandoned" ? "abandoned" : "failed";

  // Update payment record
  await adminClient.from("payments").update({
    status: paymentStatus,
    verified_at: new Date().toISOString(),
    gateway_response: txData.gateway_response,
    channel: txData.channel,
    ip_address: txData.ip_address,
    webhook_processed: true,
  }).eq("id", paymentRecord.id);

  if (paymentStatus !== "success") {
    return successResponse({ status: paymentStatus, message: "Payment was not successful." });
  }

  logger.security.paymentVerified(user.id, match_id, reference, paymentStatus);

  // Update match status and check if both have paid
  const { data: match } = await adminClient
    .from("matches")
    .select("id, initiator_user_id, partner_user_id, status")
    .eq("id", match_id)
    .single();

  if (!match) return errorResponse("Match not found.", 404);

  const isInitiator = match.initiator_user_id === user.id;

  // Check if the other party has also paid
  const otherUserId = isInitiator ? match.partner_user_id : match.initiator_user_id;
  const { data: otherPayment } = await adminClient
    .from("payments")
    .select("id, status")
    .eq("match_id", match_id)
    .eq("user_id", otherUserId)
    .eq("status", "success")
    .single();

  const bothPaid = !!otherPayment;
  const now = new Date().toISOString();

  if (bothPaid) {
    // Both paid — reveal contacts and update match status
    await adminClient.from("matches").update({
      status: "both_paid",
      both_paid_at: now,
      initiator_contact_revealed: true,
      partner_contact_revealed: true,
      ...(isInitiator ? { initiator_paid_at: now } : { partner_paid_at: now }),
    }).eq("id", match_id);

    // Notify both users
    await adminClient.from("notifications").insert([
      {
        user_id: match.initiator_user_id,
        type: "contact_revealed",
        title: "Contact details revealed!",
        message: "Both users have paid. You can now see each other's contact details.",
        metadata: { match_id },
      },
      {
        user_id: match.partner_user_id,
        type: "contact_revealed",
        title: "Contact details revealed!",
        message: "Both users have paid. You can now see each other's contact details.",
        metadata: { match_id },
      },
    ]);

    // Update BOTH requests to matched status
    const { data: matchDetails } = await adminClient
      .from("matches")
      .select("initiator_request_id, partner_request_id")
      .eq("id", match_id)
      .single();

    if (matchDetails) {
      await adminClient.from("requests").update({ status: "matched" })
        .in("id", [matchDetails.initiator_request_id, matchDetails.partner_request_id]);
    }

    logger.security.contactRevealed(match_id, user.id);
    return successResponse({ status: "success", both_paid: true, contact_revealed: true });
  } else {
    // Only this user paid — update status
    const newStatus = isInitiator ? "initiator_paid" : "partner_paid";
    await adminClient.from("matches").update({
      status: newStatus,
      ...(isInitiator ? { initiator_paid_at: now } : { partner_paid_at: now }),
    }).eq("id", match_id);

    // Notify the other user
    await adminClient.from("notifications").insert({
      user_id: otherUserId,
      type: "payment_received",
      title: "Payment received",
      message: "Your match has paid the connection fee. Pay yours to reveal contact details.",
      metadata: { match_id },
    });

    return successResponse({ status: "success", both_paid: false, contact_revealed: false });
  }
}
