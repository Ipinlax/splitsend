// POST /api/matches/[id]/report — Report a match issue
import { NextRequest } from "next/server";
import { createAdminClient, getServerUserWithProfile } from "@/lib/supabase/server";
import { matchReportSchema } from "@/lib/supportValidation";
import { withRateLimit } from "@/lib/rateLimit";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { isValidUUID } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  user_not_responding: "User not responding",
  payment_problem: "Payment problem",
  wrong_details: "Wrong details provided",
  suspicious_activity: "Suspicious activity",
  other: "Other issue",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  if (!isValidUUID(matchId)) return errorResponse("Invalid match ID.", 400);

  const rl = withRateLimit(req, `api/match-report/${matchId}`, { max: 3, windowMs: 600_000 });
  if (rl) return rl;

  const up = await getServerUserWithProfile();
  if (!up) return errorResponse("Authentication required.", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse("Invalid body.", 400); }

  const parsed = matchReportSchema.safeParse({ ...body as object, match_id: matchId });
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const { reason, description } = parsed.data;
  const admin = createAdminClient();

  // Verify user is a participant in this match
  const { data: match } = await admin
    .from("matches")
    .select("id, initiator_user_id, partner_user_id")
    .eq("id", matchId)
    .or(`initiator_user_id.eq.${up.user.id},partner_user_id.eq.${up.user.id}`)
    .single();

  if (!match) return errorResponse("Match not found or access denied.", 404);

  const partnerUserId =
    match.initiator_user_id === up.user.id
      ? match.partner_user_id
      : match.initiator_user_id;

  // Save as both a report + support message for admin visibility
  const [reportResult] = await Promise.all([
    admin.from("reports").insert({
      reporter_id: up.user.id,
      reported_user_id: partnerUserId,
      match_id: matchId,
      reason: "suspicious_activity", // maps to existing enum
      description: `[${REASON_LABELS[reason] ?? reason}] ${description ?? ""}`.trim(),
    }).select("id").single(),

    admin.from("notifications").insert({
      user_id: up.user.id,
      type: "issue_reported",
      title: "Issue reported",
      message: `Your report for match issue "${REASON_LABELS[reason]}" has been submitted. Admin will review.`,
      metadata: { match_id: matchId, reason },
    }),
  ]);

  if (reportResult.error) {
    logger.error("Failed to save match report", { userId: up.user.id, matchId });
    return errorResponse("Failed to submit report.", 500);
  }

  logger.security.reportSubmitted(up.user.id, reportResult.data.id, reason);
  return successResponse({ id: reportResult.data.id, message: "Issue reported. Admin will review shortly." }, 201);
}
