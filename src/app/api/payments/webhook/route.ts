import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, verifyPayment } from "@/lib/flutterwave";

export async function POST(req: NextRequest) {
  try {
    const headerHash = req.headers.get("verif-hash");
    if (!verifyWebhookSignature(headerHash)) {
      console.warn("[webhook] Invalid verif-hash — rejecting");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const eventType: string = payload.event ?? "";

    if (eventType !== "charge.completed") {
      return NextResponse.json({ received: true });
    }

    const txData = payload.data as Record<string, unknown> | undefined;
    if (!txData) {
      return NextResponse.json(
        { error: "No data in payload" },
        { status: 400 }
      );
    }

    const flw_transaction_id = txData.id as number;
    const tx_ref = txData.tx_ref as string;
    const webhookStatus = txData.status as string;
    const amount_ngn = txData.amount as number;

    if (webhookStatus !== "successful") {
      return NextResponse.json({ received: true });
    }

    const amount_kobo = Math.round(amount_ngn * 100);
    const verification = await verifyPayment(flw_transaction_id, amount_kobo);

    if (!verification.verified) {
      console.warn("[webhook] Re-verification failed for tx_ref:", tx_ref);
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("id, match_id, user_id, status, amount_kobo")
      .eq("paystack_reference", tx_ref)
      .single();

    if (findError || !payment) {
      console.warn("[webhook] Payment record not found for tx_ref:", tx_ref);
      return NextResponse.json({ received: true });
    }

    if (payment.status === "success") {
      return NextResponse.json({ received: true });
    }

    if (payment.amount_kobo !== amount_kobo) {
      console.error("[webhook] Amount mismatch", {
        stored_kobo: payment.amount_kobo,
        received_kobo: amount_kobo,
        tx_ref,
      });
      return NextResponse.json({ received: true });
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "success",
        verified_at: now,
        webhook_processed: true,
        gateway_response: JSON.stringify(verification.raw),
        channel: (verification.raw?.payment_type as string) ?? null,
        updated_at: now,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("[webhook] Failed to update payment:", updateError);
      return NextResponse.json(
        { error: "DB update failed" },
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
      console.error("[webhook] Match not found:", payment.match_id);
      return NextResponse.json({ received: true });
    }

    const isInitiator = match.initiator_user_id === payment.user_id;
    const matchUpdate: Record<string, unknown> = { updated_at: now };

    if (isInitiator) {
      matchUpdate.initiator_paid_at = now;
    } else {
      matchUpdate.partner_paid_at = now;
    }

    const otherAlreadyPaid = isInitiator
      ? !!match.partner_paid_at
      : !!match.initiator_paid_at;

    if (otherAlreadyPaid) {
      matchUpdate.both_paid_at = now;
      matchUpdate.completed_at = now;
      matchUpdate.status = "completed";
      matchUpdate.initiator_contact_revealed = true;
      matchUpdate.partner_contact_revealed = true;
      console.info("[webhook] Both paid — contacts revealed:", payment.match_id);
    }

    await supabase
      .from("matches")
      .update(matchUpdate)
      .eq("id", payment.match_id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
