// POST /api/payments/initialize — Initialize payment for existing match
import { NextRequest } from "next/server";
import { getServerUser, createAdminClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import { initializePaystackTransaction, generatePaymentReference } from "@/lib/paystack";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/utils";
import { CONNECTION_FEE_KOBO, APP_URL } from "@/constants";
import { z } from "zod";

const schema = z.object({ match_id: uuidSchema });

export async function POST(request: NextRequest) {
  const rl = withRateLimit(request, "api/payments/init", { max: 10, windowMs: 300_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid match ID.", 400);

  const { match_id } = parsed.data;
  const adminClient = createAdminClient();

  // Verify match belongs to this user
  const { data: match } = await adminClient
    .from("matches")
    .select("id, initiator_user_id, partner_user_id, status")
    .eq("id", match_id)
    .or(`initiator_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
    .single();

  if (!match) return errorResponse("Match not found.", 404);
  if (match.status === "both_paid" || match.status === "completed") {
    return errorResponse("Payment already completed for this match.", 400);
  }

  // Check if user already paid
  const { data: existingPayment } = await adminClient
    .from("payments")
    .select("id, status")
    .eq("match_id", match_id)
    .eq("user_id", user.id)
    .single();

  if (existingPayment?.status === "success") {
    return errorResponse("You have already paid for this connection.", 400, "ALREADY_PAID");
  }

  const reference = generatePaymentReference(user.id);
  const callbackUrl = `${APP_URL}/payment/callback?reference=${reference}&match_id=${match_id}`;

  let paystackData;
  try {
    paystackData = await initializePaystackTransaction({
      email: user.email!,
      amountKobo: CONNECTION_FEE_KOBO,
      reference,
      metadata: { match_id, user_id: user.id, type: "connection_fee" },
      callbackUrl,
    });
  } catch {
    return errorResponse("Failed to initialize payment. Please try again.", 500);
  }

  // Upsert payment record
  await adminClient.from("payments").upsert({
    match_id,
    user_id: user.id,
    paystack_reference: reference,
    paystack_access_code: paystackData.data.access_code,
    amount_kobo: CONNECTION_FEE_KOBO,
    currency: "NGN",
    status: "pending",
  }, { onConflict: "match_id,user_id", ignoreDuplicates: false });

  logger.security.paymentInit(user.id, match_id, reference);

  return successResponse({
    payment_url: paystackData.data.authorization_url,
    reference,
    match_id,
  });
}
