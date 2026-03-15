import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rateLimit";
import { initializePayment } from "@/lib/flutterwave";
import { z } from "zod";

const schema = z.object({
  match_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = withRateLimit(req, "payment-init");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { match_id } = parsed.data;

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, is_suspended")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_suspended) {
      return NextResponse.json(
        { error: "Account is suspended" },
        { status: 403 }
      );
    }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, initiator_user_id, partner_user_id, status")
      .eq("id", match_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const isParticipant =
      match.initiator_user_id === user.id ||
      match.partner_user_id === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { error: "Match already completed" },
        { status: 400 }
      );
    }

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("match_id", match_id)
      .eq("user_id", user.id)
      .single();

    if (existingPayment?.status === "success") {
      return NextResponse.json(
        { error: "You have already paid for this match" },
        { status: 400 }
      );
    }

    const amount_kobo = parseInt(process.env.CONNECTION_FEE_KOBO ?? "200000");
    const amount_ngn = amount_kobo / 100;

    const tx_ref = `splitsend-${match_id}-${user.id}-${Date.now()}`;
    const redirect_url = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`;

    const result = await initializePayment({
      tx_ref,
      amount_ngn,
      email: user.email!,
      full_name: profile.full_name ?? "SplitSend User",
      redirect_url,
      description: `SplitSend connect fee — Match ${match_id.slice(0, 8)}`,
    });

    if (!result.success || !result.payment_url) {
      console.error("[payment/initialize] Flutterwave error:", result.error);
      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 502 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;

    const { error: upsertError } = await supabase
      .from("payments")
      .upsert(
        {
          match_id,
          user_id: user.id,
          amount_kobo,
          currency: "NGN",
          status: "pending",
          paystack_reference: tx_ref,
          paystack_access_code: result.payment_url,
          ip_address: ip,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" }
      );

    if (upsertError) {
      console.error("[payment/initialize] DB upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ payment_url: result.payment_url });
  } catch (err) {
    console.error("[payment/initialize] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
