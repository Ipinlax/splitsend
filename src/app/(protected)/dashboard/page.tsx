import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile, createServerClient } from "@/lib/supabase/server";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import TrustNotice from "@/components/shared/TrustNotice";
import {
  FileText, Users, Bell, Plus, ArrowRight,
  CheckCircle2, Clock, AlertCircle, Package
} from "lucide-react";
import { CATEGORY_LABELS, COURIER_LABELS, MATCH_STATUS_LABELS } from "@/constants";
import { formatDate, timeAgo, cn } from "@/lib/utils";

export default async function DashboardPage() {
  const up = await getServerUserWithProfile();
  if (!up) redirect("/login");

  const supabase = await createServerClient();
  const userId = up.user.id;

  // Fetch user's requests
  const { data: myRequests } = await supabase
    .from("requests")
    .select("id, first_name, request_category, state, city, courier_preference, destination_country, preferred_send_date, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch user's matches
  const { data: myMatches } = await supabase
    .from("matches")
    .select("id, status, initiator_user_id, partner_user_id, created_at, both_paid_at")
    .or(`initiator_user_id.eq.${userId},partner_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch unread notifications
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  const activeRequests = myRequests?.filter((r) => r.status === "active").length ?? 0;
  const totalMatches = myMatches?.length ?? 0;
  const activeMatches = myMatches?.filter((m) => m.status !== "completed" && m.status !== "cancelled").length ?? 0;

  const matchStatusIcon: Record<string, React.ReactNode> = {
    both_paid: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    initiator_paid: <Clock className="w-4 h-4 text-yellow-500" />,
    partner_paid: <Clock className="w-4 h-4 text-yellow-500" />,
    pending: <Clock className="w-4 h-4 text-gray-400" />,
    cancelled: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  return (
    <div className="page-container py-10 max-w-5xl">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">
            Welcome back{up.profile.full_name ? `, ${up.profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{up.user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/notifications" className="btn-secondary relative text-xs">
            <Bell className="w-4 h-4" />
            Notifications
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link href="/post-request" className="btn-primary text-xs">
            <Plus className="w-4 h-4" /> Post Request
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Requests", value: activeRequests, icon: FileText, color: "blue" },
          { label: "Active Matches", value: activeMatches, icon: Users, color: "green" },
          { label: "Total Matches", value: totalMatches, icon: Package, color: "blue" },
          { label: "Unread Alerts", value: unreadCount ?? 0, icon: Bell, color: unreadCount ? "red" : "gray" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", {
              "bg-blue-100": stat.color === "blue",
              "bg-green-100": stat.color === "green",
              "bg-red-100": stat.color === "red",
              "bg-gray-100": stat.color === "gray",
            })}>
              <stat.icon className={cn("w-5 h-5", {
                "text-blue-600": stat.color === "blue",
                "text-green-600": stat.color === "green",
                "text-red-500": stat.color === "red",
                "text-gray-500": stat.color === "gray",
              })} />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">My Requests</h2>
            <Link href="/post-request" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </Link>
          </div>

          {!myRequests?.length ? (
            <div className="card p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No requests yet. Post one to get matched!</p>
              <Link href="/post-request" className="btn-primary text-xs">Post My First Request</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("badge text-xs", {
                        "badge-green": req.status === "active",
                        "badge-blue": req.status === "matched",
                        "badge-gray": req.status === "completed" || req.status === "cancelled",
                      })}>
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
                    </div>
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {CATEGORY_LABELS[req.request_category] ?? req.request_category} → {req.destination_country}
                    </p>
                    <p className="text-xs text-gray-500">{req.city}, {req.state} · {COURIER_LABELS[req.courier_preference] ?? req.courier_preference} · {formatDate(req.preferred_send_date)}</p>
                  </div>
                  <Link href={`/browse?ref=${req.id}`} className="btn-secondary text-xs flex-shrink-0">
                    Find Match <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
              <Link href="/dashboard/requests" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 pl-1">
                View all requests <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Matches */}
          <div className="flex items-center justify-between mt-6">
            <h2 className="font-display font-semibold text-gray-900">My Matches</h2>
          </div>

          {!myMatches?.length ? (
            <div className="card p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No matches yet. Browse to find a partner.</p>
              <Link href="/browse" className="btn-primary text-xs">Browse Requests</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myMatches.map((m) => (
                <Link key={m.id} href={`/dashboard/matches/${m.id}`} className="card p-4 flex items-center justify-between gap-3 hover:border-blue-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    {matchStatusIcon[m.status] ?? <Clock className="w-4 h-4 text-gray-400" />}
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {MATCH_STATUS_LABELS[m.status] ?? m.status}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick actions + support */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/browse" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group text-sm text-gray-700 hover:text-blue-700">
                <Users className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                Browse Requests
              </Link>
              <Link href="/post-request" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group text-sm text-gray-700 hover:text-blue-700">
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                Post New Request
              </Link>
              <Link href="/dashboard/notifications" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group text-sm text-gray-700 hover:text-blue-700">
                <Bell className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                Notifications {(unreadCount ?? 0) > 0 && <span className="ml-auto badge-red text-[10px]">{unreadCount}</span>}
              </Link>
              <Link href="/support" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group text-sm text-gray-700 hover:text-blue-700">
                <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                Contact Admin
              </Link>
            </div>
          </div>

          {/* WhatsApp support */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Need Help?</p>
            <p className="text-sm text-gray-600 mb-4">
              If you have any problem, contact admin on WhatsApp immediately.
            </p>
            <WhatsAppButton
              size="sm"
              variant="primary"
              label="Chat Admin on WhatsApp"
              message="Hello SplitSend Admin, I need help from my dashboard."
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Trust notice */}
      <div className="mt-8">
        <TrustNotice context="general" compact />
      </div>
    </div>
  );
}
