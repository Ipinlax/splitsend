// GET /api/matches — Get user's matches with contact details (if both paid)
import { NextRequest } from "next/server";
import { getServerUser, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const rl = withRateLimit(request, "api/matches", { max: 20, windowMs: 60_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  const adminClient = createAdminClient();

  const { data: matches, error } = await adminClient
    .from("matches")
    .select(`
      id, status,
      initiator_user_id, partner_user_id,
      initiator_contact_revealed, partner_contact_revealed,
      initiator_paid_at, partner_paid_at, both_paid_at, completed_at, created_at,
      initiator_request:requests!initiator_request_id(
        id, first_name, profession, request_category,
        state, city, courier_preference, destination_country, preferred_send_date, notes
      ),
      partner_request:requests!partner_request_id(
        id, first_name, profession, request_category,
        state, city, courier_preference, destination_country, preferred_send_date, notes
      )
    `)
    .or(`initiator_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch matches", { userId: user.id, error: error.message });
    return errorResponse("Failed to load matches.", 500);
  }

  // For each match where both paid, fetch partner contact details
  const enrichedMatches = await Promise.all(
    (matches ?? []).map(async (match) => {
      const isInitiator = match.initiator_user_id === user.id;
      const partnerUserId = isInitiator ? match.partner_user_id : match.initiator_user_id;
      const partnerRequestId = isInitiator
        ? (match.partner_request as any)?.id
        : (match.initiator_request as any)?.id;

      let partnerContact = null;

      // Only reveal contact if both have paid (server-side check)
      if (match.status === "both_paid" || match.status === "completed") {
        // Verify payment status in DB — never trust match status alone
        const { data: bothPayments } = await adminClient
          .from("payments")
          .select("user_id, status")
          .eq("match_id", match.id)
          .eq("status", "success");

        const paidUserIds = (bothPayments ?? []).map((p: any) => p.user_id);
        const reallyBothPaid = paidUserIds.includes(user.id) && paidUserIds.includes(partnerUserId);

        if (reallyBothPaid) {
          // Fetch private contact from partner's request
          const { data: partnerReq } = await adminClient
            .from("requests")
            .select("full_name_private, whatsapp_number, email_private")
            .eq("id", partnerRequestId)
            .single();

          if (partnerReq) {
            partnerContact = {
              full_name: partnerReq.full_name_private,
              whatsapp_number: partnerReq.whatsapp_number,
              email: partnerReq.email_private,
            };
          }
        }
      }

      return { ...match, partner_contact: partnerContact, is_initiator: isInitiator };
    })
  );

  return successResponse({ matches: enrichedMatches });
}
