import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import AdminReportList from "@/components/admin/AdminReportList";
import { Flag } from "lucide-react";

export const metadata = { title: "Reports | Admin" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("reports")
    .select(
      "id, reporter_id, reported_user_id, request_id, match_id, reason, description, status, admin_note, reviewed_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data: reports, count } = await query;
  const { count: pendingCount } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-500" />
            User Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount ?? 0} pending reports require review
          </p>
        </div>
      </div>

      <AdminReportList
        reports={reports ?? []}
        total={count ?? 0}
        page={page}
        limit={limit}
        currentStatus={status}
      />
    </div>
  );
}
