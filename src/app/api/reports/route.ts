// POST /api/reports — Submit a user report
import { NextRequest } from "next/server";
import { getServerUser, createServerClient, createAdminClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse, sanitizeText } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const rl = withRateLimit(request, "api/reports", { max: 5, windowMs: 300_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.errors[0]?.message ?? "Invalid report data.", 400);

  const data = parsed.data;
  if (!data.reported_user_id && !data.request_id && !data.match_id) {
    return errorResponse("Report must reference a user, request, or match.", 400);
  }
  if (data.reported_user_id === user.id) {
    return errorResponse("You cannot report yourself.", 400);
  }

  const supabase = await createServerClient();
  const { data: newReport, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_user_id: data.reported_user_id ?? null,
      request_id: data.request_id ?? null,
      match_id: data.match_id ?? null,
      reason: data.reason,
      description: data.description ? sanitizeText(data.description) : null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create report", { userId: user.id, error: error.message });
    return errorResponse("Failed to submit report.", 500);
  }

  logger.security.reportSubmitted(user.id, newReport.id, data.reason);

  // Notify admins via a system notification (simplified)
  const adminClient = createAdminClient();
  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (adminIds.length > 0) {
    await adminClient.from("notifications").insert(
      adminIds.map(adminId => ({
        user_id: adminId,
        type: "issue_reported" as const,
        title: "New report submitted",
        message: `A user reported ${data.reason.replace("_", " ")}.`,
        metadata: { report_id: newReport.id },
      }))
    );
  }

  return successResponse({ id: newReport.id, message: "Report submitted successfully." }, 201);
}
