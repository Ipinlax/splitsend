import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { adminSuspendSchema } from "@/lib/validation";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("Admin access required.", 403);

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  const { data: users, error, count } = await db
    .from("profiles")
    .select("id, role, full_name, profession, state, city, is_suspended, suspended_at, suspended_reason, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return errorResponse("Failed to fetch users.", 500);

  return successResponse({ users: users ?? [], pagination: { page, pageSize, total: count ?? 0 } });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("Admin access required.", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = adminSuspendSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);

  const { user_id, reason } = parsed.data;
  const db = createAdminClient();

  // Prevent suspending another admin
  const { data: targetProfile } = await db.from("profiles").select("role").eq("id", user_id).single();
  if (targetProfile?.role === "admin") return errorResponse("Cannot suspend admin accounts.", 400);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "unsuspend") {
    await db.from("profiles").update({ is_suspended: false, suspended_at: null, suspended_reason: null }).eq("id", user_id);
    await db.from("admin_actions").insert({ admin_id: admin.userId, action_type: "unsuspend_user", target_user_id: user_id, reason });
    logger.security.adminAction(admin.userId, "unsuspend_user", user_id);
    return successResponse({ message: "User unsuspended." });
  }

  await db.from("profiles").update({ is_suspended: true, suspended_at: new Date().toISOString(), suspended_reason: reason }).eq("id", user_id);
  await db.from("admin_actions").insert({ admin_id: admin.userId, action_type: "suspend_user", target_user_id: user_id, reason });
  logger.security.adminAction(admin.userId, "suspend_user", user_id);

  return successResponse({ message: "User suspended." });
}
