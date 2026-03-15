import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rateLimit";
import { verifyPayment } from "@/lib/flutterwave";

export async function GET(req: NextRequest) {
  const rateLimitResponse = withRateLimit(req, "payment-verify");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const transaction_id = searchParams.get("transaction_id");
    const tx_ref = searchParams.get("tx_ref");
    const status = searchParams.get("status");

    if (status === "cancelled" || status === "failed") {
      return NextResponse.json(
        { verified: false, message: "Payment was not completed" },
        { status: 200 }
      );
    }

    if (!transaction_id || !tx_ref) {
      return NextResponse.json(
        { error: "Missing transaction_id or tx_ref" },
        { status: 400 }
      );
    }

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, match_id, user_id, amount_kobo, status")
      .eq("paystack_reference", tx_ref)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    if (payment.status === "success") {
      const { data: match } = await supabase
        .from("matches")
        .select("id, both_paid_at")
        .eq("id", payment.match_id)
        .single();

      return NextResponse.json({
        verified: true,
        already_verified: true,
        match_id: payment.match_id,
        contacts_revealed: !!(match?.both_paid_at),
      });
    }

    const verification = await verifyPayment(
      transaction_id,
      payment.amount_kobo
    );

    if (!verification.success) {
      return NextResponse.json(
        { error: "Verification request failed" },
        { status: 502 }
      );
    }

    const now = new Date().toISOString();

    if (!verification.verified) {
      console.warn(
        "[payment/verify] Verification failed for tx_ref:", tx_ref,
        { flw_status: verification.status, amount: verification.amount_ngn }
      );

      await supabase
        .from("payments")
        .update({
          status: "failed",
          gateway_response: JSON.stringify(
            verification.raw ?? { status: verification.status }
          ),
          updated_at: now,
        })
        .eq("id", payment.id);

      return NextResponse.json(
        { verified: false, message: "Payment could not be verified" },
        { status: 200 }
      );
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "success",
        verified_at: now,
        gateway_response: JSON.stringify(verification.raw),
        channel: (verification.raw?.payment_type as string) ?? null,
        updated_at: now,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("[payment/verify] Failed to update payment:", updateError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        "id, initiator_user_id, partner_user_id, initiator_paid_at, partner_paid_at, status"
      )
      .eq("id", payment.match_id)
      .single();

    if (matchError || !match) {
      console.error("[payment/verify] Match not found:", payment.match_id);
      return NextResponse.json({
        verified: true,
        match_id: payment.match_id,
        contacts_revealed: false,
      });
    }

    const isInitiator = match.initiator_user_id === user.id;
    const matchUpdate: Record<string, unknown> = { updated_at: now };

    if (isInitiator) {
      matchUpdate.initiator_paid_at = now;
    } else {
      matchUpdate.partner_paid_at = now;
    }

    const otherAlreadyPaid = isInitiator
      ? !!match.partner_paid_at
      : !!match.initiator_paid_at;

    let contactsRevealed = false;

    if (otherAlreadyPaid) {
      matchUpdate.both_paid_at = now;
      matchUpdate.completed_at = now;
      matchUpdate.status = "completed";
      matchUpdate.initiator_contact_revealed = true;
      matchUpdate.partner_contact_revealed = true;
      contactsRevealed = true;
    }

    await supabase
      .from("matches")
      .update(matchUpdate)
      .eq("id", payment.match_id);

    return NextResponse.json({
      verified: true,
      match_id: payment.match_id,
      contacts_revealed: contactsRevealed,
    });
  } catch (err) {
    console.error("[payment/verify] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
