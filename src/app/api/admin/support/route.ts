// GET  /api/admin/support — list support messages
// POST /api/admin/support — update message status

import { NextRequest } from "next/server";
import { createAdminClient, getServerUserWithProfile, isAdminUserId } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { z } from "zod";

async function requireAdmin() {
  const up = await getServerUserWithProfile();
  if (!up) return null;
  if (!isAdminUserId(up.user.id) || up.profile.role !== "admin") {
    logger.security.unauthorizedAccess(up.user.id, "admin/support");
    return null;
  }
  return up;
}

export async function GET(req: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return errorResponse("Admin access required.", 403);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;

  logger.security.adminAction(adminUser.user.id, "list_support_messages");

  const admin = createAdminClient();
  let query = admin
    .from("support_messages")
    .select(
      "id, user_id, name, whatsapp, email, message, category, match_id, request_id, status, admin_note, reviewed_by, reviewed_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return errorResponse("Failed to fetch messages.", 500);

  return successResponse({ messages: data ?? [], total: count ?? 0, page, limit });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "resolved", "ignored"]),
  admin_note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return errorResponse("Admin access required.", 403);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse("Invalid body.", 400); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 422);

  const { id, status, admin_note } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("support_messages")
    .update({
      status,
      admin_note: admin_note ?? null,
      reviewed_by: adminUser.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return errorResponse("Failed to update message.", 500);

  logger.security.adminAction(adminUser.user.id, `support_message_${status}`, id);
  await admin.from("admin_actions").insert({
    admin_id: adminUser.user.id,
    action_type: "resolve_report",
    reason: `Support message marked ${status}`,
    metadata: { support_message_id: id, status, admin_note },
  });

  return successResponse({ message: `Message marked as ${status}.` });
}
