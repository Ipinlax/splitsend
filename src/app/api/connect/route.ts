// POST /api/connect
// Creates a match between the current user's active request and a partner request.
// Does NOT initialize payment — that is handled separately by /api/payments/initialize.
//
// Security:
//   - Auth required
//   - Validates partner request is active and not own
//   - Prevents duplicate matches
//   - Match creation uses admin client (service_role) since INSERT spans two users

import { NextRequest } from "next/server";
import { getServerUser, createServerClient, createAdminClient } from "@/lib/supabase/server";
import { connectSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const rl = withRateLimit(request, "api/connect", { max: 10, windowMs: 300_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid request ID.", 400, "VALIDATION_ERROR");

  const { partner_request_id } = parsed.data;

  const adminClient = createAdminClient();
  const supabase = await createServerClient();

  // Verify partner request exists, is active, and is not the user's own
  const { data: partnerRequest } = await adminClient
    .from("requests")
    .select("id, user_id, status, city, state")
    .eq("id", partner_request_id)
    .eq("status", "active")
    .single();

  if (!partnerRequest) return errorResponse("This request is no longer available.", 404, "NOT_FOUND");
  if (partnerRequest.user_id === user.id) return errorResponse("You cannot connect with your own request.", 400, "SELF_MATCH");

  // Get the user's own most recent active request
  const { data: myRequest } = await supabase
    .from("requests")
    .select("id, user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!myRequest) return errorResponse("You need to post a request before connecting.", 400, "NO_REQUEST");

  // Check for existing non-cancelled match between these two requests
  const { data: existingMatch } = await adminClient
    .from("matches")
    .select("id, status")
    .or(
      `and(initiator_request_id.eq.${myRequest.id},partner_request_id.eq.${partner_request_id}),` +
      `and(initiator_request_id.eq.${partner_request_id},partner_request_id.eq.${myRequest.id})`
    )
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingMatch) {
    return successResponse({ match_id: existingMatch.id, existing: true });
  }

  // Create new match
  const { data: newMatch, error: matchError } = await adminClient
    .from("matches")
    .insert({
      initiator_request_id: myRequest.id,
      partner_request_id: partner_request_id,
      initiator_user_id: user.id,
      partner_user_id: partnerRequest.user_id,
      status: "pending",
    })
    .select("id")
    .single();

  if (matchError || !newMatch) {
    logger.error("Failed to create match", { userId: user.id, error: matchError?.message });
    return errorResponse("Failed to create connection. Please try again.", 500);
  }

  logger.security.matchCreated(newMatch.id, user.id, partnerRequest.user_id);

  // Notify the partner
  await adminClient.from("notifications").insert({
    user_id: partnerRequest.user_id,
    type: "connection_request",
    title: "Someone wants to connect!",
    message: `A user in ${partnerRequest.city}, ${partnerRequest.state} wants to split courier costs with you.`,
    metadata: { match_id: newMatch.id },
  });

  return successResponse({ match_id: newMatch.id, existing: false }, 201);
}
