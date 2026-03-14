import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import { formatNaira, timeAgo, cn } from "@/lib/utils";
import { CreditCard, TrendingUp } from "lucide-react";

export const metadata = { title: "Payments | Admin" };

export default async function AdminPaymentsPage({
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

  // Stats
  const [{ data: allPayments }, pagedResult] = await Promise.all([
    admin.from("payments").select("amount_kobo, status"),
    (async () => {
      let q = admin
        .from("payments")
        .select("id, user_id, match_id, paystack_reference, amount_kobo, status, verified_at, channel, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (status) q = q.eq("status", status);
      return q;
    })(),
  ]);

  const { data: payments, count } = pagedResult;
  const verified = allPayments?.filter((p) => p.status === "success") ?? [];
  const totalRevenue = verified.reduce((s, p) => s + (p.amount_kobo ?? 0), 0);
  const pendingCount = allPayments?.filter((p) => p.status === "pending").length ?? 0;

  const statusBadge: Record<string, string> = {
    success: "badge-green", pending: "badge-yellow",
    failed: "badge-red", abandoned: "badge-gray",
  };

  return (
    <div className="p-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Payments</h1>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatNaira(totalRevenue), icon: TrendingUp, color: "green" },
          { label: "Verified Payments", value: verified.length, icon: CreditCard, color: "green" },
          { label: "Pending", value: pendingCount, icon: CreditCard, color: "yellow" },
          { label: "Total Payments", value: allPayments?.length ?? 0, icon: CreditCard, color: "blue" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="font-display font-bold text-xl text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "success", "pending", "failed", "abandoned"].map((s) => (
          <a key={s || "all"} href={s ? `?status=${s}` : "?"}
            className={cn("px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border",
              status === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Reference", "User ID", "Match ID", "Amount", "Status", "Channel", "Date"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(payments ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.paystack_reference?.slice(0, 16)}…</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.user_id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.match_id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-900">{formatNaira(p.amount_kobo)}</td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-[10px]", statusBadge[p.status] ?? "badge-gray")}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.channel ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(p.created_at)}</td>
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
