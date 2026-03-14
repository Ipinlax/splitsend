// DELETE /api/admin/requests — Admin delete a request
import { NextRequest } from "next/server";
import { createAdminClient, getServerUserWithProfile, isAdminUserId } from "@/lib/supabase/server";
import { adminDeleteRequestSchema } from "@/lib/validation";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") {
    return errorResponse("Admin access required.", 403);
  }
  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse("Invalid body.", 400); }

  const parsed = adminDeleteRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const { request_id, reason } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin.from("requests").update({ status: "cancelled" }).eq("id", request_id);
  if (error) return errorResponse("Failed to delete request.", 500);

  await admin.from("admin_actions").insert({
    admin_id: up.user.id,
    action_type: "delete_request",
    target_request_id: request_id,
    reason,
  });

  logger.security.adminAction(up.user.id, "delete_request", request_id);
  return successResponse({ message: "Request removed." });
}
