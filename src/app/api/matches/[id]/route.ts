// =============================================================================
// GET /api/matches/[id] — Get match details with conditional contact reveal
//
// Security:
//   - Only participants can access their match
//   - Contact details only revealed after BOTH payments verified in DB
//   - Never trust frontend state for contact reveal decisions
//   - Private fields fetched server-side only
// =============================================================================

import { NextRequest } from "next/server";
import { createServerClient, createAdminClient, getServerUserWithProfile } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { isValidUUID } from "@/lib/utils";
import type { MatchWithContact } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;

  // Validate ID format
  if (!isValidUUID(matchId)) {
    return errorResponse("Invalid match ID.", 400);
  }

  // Auth
  const userWithProfile = await getServerUserWithProfile();
  if (!userWithProfile) {
    return errorResponse("Authentication required.", 401);
  }
  const { user } = userWithProfile;

  // Fetch match — user must be a participant (enforced by RLS too)
  const supabase = await createServerClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .or(`initiator_user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
    .single();

  if (error || !match) {
    logger.security.unauthorizedAccess(user.id, `match ${matchId}`);
    return errorResponse("Match not found.", 404);
  }

  const isInitiator = match.initiator_user_id === user.id;

  // Fetch both requests (public fields only)
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, user_id, first_name, profession, request_category, state, city, area, courier_preference, destination_country, destination_institution, document_type, preferred_send_date, notes, status, created_at"
    )
    .in("id", [match.initiator_request_id, match.partner_request_id]);

  const myRequest = requests?.find((r) =>
    isInitiator
      ? r.id === match.initiator_request_id
      : r.id === match.partner_request_id
  );

  const partnerRequest = requests?.find((r) =>
    isInitiator
      ? r.id === match.partner_request_id
      : r.id === match.initiator_request_id
  );

  // Determine contact reveal
  // SECURITY: Check DB state, never trust client
  const shouldReveal = match.status === "both_paid" || match.status === "completed";
  let partnerContact = null;

  if (shouldReveal) {
    const partnerUserId = isInitiator ? match.partner_user_id : match.initiator_user_id;
    const partnerRequestId = isInitiator
      ? match.partner_request_id
      : match.initiator_request_id;

    // Fetch private contact fields using admin client (service_role bypasses RLS)
    const admin = createAdminClient();
    const { data: privateData } = await admin
      .from("requests")
      .select("full_name_private, whatsapp_number, email_private")
      .eq("id", partnerRequestId)
      .eq("user_id", partnerUserId)
      .single();

    if (privateData) {
      partnerContact = {
        full_name: privateData.full_name_private,
        whatsapp_number: privateData.whatsapp_number,
        email: privateData.email_private ?? null,
      };
    }
  }

  // Fetch payment statuses for both users
  const { data: payments } = await supabase
    .from("payments")
    .select("user_id, status, created_at")
    .eq("match_id", matchId);

  const myPayment = payments?.find((p) => p.user_id === user.id);
  const partnerUserId = isInitiator ? match.partner_user_id : match.initiator_user_id;
  const partnerPayment = payments?.find((p) => p.user_id === partnerUserId);

  const response: MatchWithContact & {
    my_payment_status: string | null;
    partner_payment_status: string | null;
  } = {
    match,
    partner_contact: partnerContact,
    your_request: myRequest as never,
    partner_request: partnerRequest as never,
    my_payment_status: myPayment?.status ?? null,
    partner_payment_status: partnerPayment?.status ?? null,
  };

  return successResponse(response);
}
