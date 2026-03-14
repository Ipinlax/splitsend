import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import { timeAgo, cn } from "@/lib/utils";
import { MATCH_STATUS_LABELS } from "@/constants";

export const metadata = { title: "Matches | Admin" };

export default async function AdminMatchesPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const status = sp.status ?? "";
  const limit = 30;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("matches")
    .select("id, initiator_user_id, partner_user_id, status, both_paid_at, completed_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  const { data: matches, count } = await query;

  const statusColor: Record<string, string> = {
    pending: "badge-yellow", initiator_paid: "badge-blue", partner_paid: "badge-blue",
    both_paid: "badge-green", completed: "badge-green", cancelled: "badge-gray",
  };

  return (
    <div className="p-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Matches</h1>
      <p className="text-sm text-gray-500 mb-6">{count ?? 0} total matches</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "pending", "both_paid", "completed", "cancelled"].map((s) => (
          <a key={s || "all"} href={s ? `?status=${s}` : "?"}
            className={cn("px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border",
              status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
            {s ? (MATCH_STATUS_LABELS[s] ?? s) : "All"}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Match ID", "Initiator", "Partner", "Status", "Created", "Both Paid"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(matches ?? []).map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.id.slice(0, 12)}…</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.initiator_user_id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.partner_user_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-[10px]", statusColor[m.status] ?? "badge-gray")}>
                    {MATCH_STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(m.created_at)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {m.both_paid_at ? timeAgo(m.both_paid_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(count ?? 0) > limit && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil((count ?? 0) / limit)}</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}&status=${status}`} className="btn-secondary text-xs">Previous</a>}
            {page * limit < (count ?? 0) && <a href={`?page=${page + 1}&status=${status}`} className="btn-primary text-xs">Next</a>}
          </div>
        </div>
      )}
    </div>
  );
}
