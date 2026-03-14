import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("Admin access required.", 403, "FORBIDDEN");

  const db = createAdminClient();

  const [users, requests, matches, payments, reports] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("requests").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("matches").select("id", { count: "exact", head: true }),
    db.from("payments").select("amount_kobo").eq("status", "success"),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const totalRevenue = (payments.data ?? []).reduce((sum: number, p: any) => sum + p.amount_kobo, 0);

  logger.security.adminAction(admin.userId, "view_stats");

  return successResponse({
    total_users: users.count ?? 0,
    active_requests: requests.count ?? 0,
    total_matches: matches.count ?? 0,
    total_payments_verified: (payments.data ?? []).length,
    total_revenue_kobo: totalRevenue,
    pending_reports: reports.count ?? 0,
  });
}
