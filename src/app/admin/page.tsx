import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import { formatNaira, timeAgo } from "@/lib/utils";
import { ADMIN_WHATSAPP_URL, ADMIN_WHATSAPP_NUMBER } from "@/constants";
import {
  Users, FileText, Package, CreditCard, Flag,
  MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock
} from "lucide-react";

export const metadata = { title: "Admin Overview | SplitSend" };

export default async function AdminOverviewPage() {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalRequests },
    { count: activeRequests },
    { count: totalMatches },
    { count: pendingReports },
    { count: pendingSupportMsgs },
    { count: openSupportMsgs },
    paymentsRes,
    recentMsgs,
    recentReports,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("requests").select("id", { count: "exact", head: true }),
    admin.from("requests").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("matches").select("id", { count: "exact", head: true }),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("payments").select("amount_kobo").eq("status", "success"),
    admin.from("support_messages")
      .select("id, name, category, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("reports")
      .select("id, reason, status, created_at, reporter_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const payments = paymentsRes.data ?? [];
  const totalRevenue = payments.reduce((s, p) => s + (p.amount_kobo ?? 0), 0);

  const stats = [
    { label: "Total Users", value: totalUsers ?? 0, icon: Users, color: "blue", href: "/admin/users" },
    { label: "Active Requests", value: activeRequests ?? 0, icon: FileText, color: "green", href: "/admin/requests" },
    { label: "Total Matches", value: totalMatches ?? 0, icon: Package, color: "blue", href: "/admin/matches" },
    { label: "Revenue", value: formatNaira(totalRevenue), icon: CreditCard, color: "green", href: "/admin/payments" },
    { label: "Pending Reports", value: pendingReports ?? 0, icon: Flag, color: "red", href: "/admin/reports" },
    { label: "Open Support Msgs", value: openSupportMsgs ?? 0, icon: MessageSquare, color: pendingSupportMsgs ? "red" : "gray", href: "/admin/messages" },
  ];

  const catLabels: Record<string, string> = {
    payment_issue: "Payment Issue", match_problem: "Match Problem",
    report_user: "Report User", general_help: "General Help", other: "Other",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">SplitSend platform statistics and recent activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-blue-200 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                s.color === "blue" ? "bg-blue-100" :
                s.color === "green" ? "bg-green-100" :
                s.color === "red" ? "bg-red-100" : "bg-gray-100"
              }`}>
                <s.icon className={`w-5 h-5 ${
                  s.color === "blue" ? "text-blue-600" :
                  s.color === "green" ? "text-green-600" :
                  s.color === "red" ? "text-red-500" : "text-gray-400"
                }`} />
              </div>
              {s.color === "red" && (s.value as number) > 0 && (
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              )}
            </div>
            <p className="font-display font-bold text-2xl text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent support messages */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Recent Support Messages
            </h2>
            <Link href="/admin/messages" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>

          {!recentMsgs.data?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
          ) : (
            <div className="space-y-2">
              {recentMsgs.data.map((msg) => (
                <Link key={msg.id} href={`/admin/messages?id=${msg.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{msg.name}</p>
                    <p className="text-xs text-gray-500">{catLabels[msg.category] ?? msg.category} · {timeAgo(msg.created_at)}</p>
                  </div>
                  <StatusBadge status={msg.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              Recent Reports
            </h2>
            <Link href="/admin/reports" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>

          {!recentReports.data?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No reports yet</p>
          ) : (
            <div className="space-y-2">
              {recentReports.data.map((r) => (
                <Link key={r.id} href={`/admin/reports?id=${r.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {r.reason.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp reminder for admin */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-800">Admin WhatsApp Active</p>
          <p className="text-xs text-green-600">Users can contact you at wa.me/{ADMIN_WHATSAPP_NUMBER}</p>
        </div>
        <a
          href={ADMIN_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "badge-yellow",
    pending: "badge-yellow",
    resolved: "badge-green",
    ignored: "badge-gray",
    dismissed: "badge-gray",
  };
  return <span className={`badge text-xs ${map[status] ?? "badge-gray"}`}>{status}</span>;
}
