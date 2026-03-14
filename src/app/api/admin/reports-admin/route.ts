import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { adminResolveReportSchema } from "@/lib/validation";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("Admin access required.", 403);

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  const { data: reports, count, error } = await db
    .from("reports")
    .select("id, reporter_id, reported_user_id, request_id, reason, description, status, created_at, resolution_notes", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return errorResponse("Failed to fetch reports.", 500);
  return successResponse({ reports: reports ?? [], pagination: { page, pageSize, total: count ?? 0 } });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("Admin access required.", 403);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid body.", 400); }

  const parsed = adminResolveReportSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.", 400);

  const { report_id, status, resolution_notes } = parsed.data;
  const db = createAdminClient();

  await db.from("reports").update({
    status,
    reviewed_by: admin.userId,
    reviewed_at: new Date().toISOString(),
    resolution_notes: resolution_notes ?? null,
  }).eq("id", report_id);

  await db.from("admin_actions").insert({
    admin_id: admin.userId,
    action_type: "resolve_report",
    target_report_id: report_id,
    reason: resolution_notes ?? status,
  });

  logger.security.adminAction(admin.userId, "resolve_report", report_id);
  return successResponse({ message: "Report updated." });
}
