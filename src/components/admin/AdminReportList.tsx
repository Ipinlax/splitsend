"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flag, ChevronDown, Clock, CheckCircle, XCircle,
  Hash, ExternalLink, Loader2, AlertTriangle
} from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  fake_listing: "🚫 Fake Listing",
  spam: "📨 Spam",
  abusive_behavior: "⚠️ Abusive Behavior",
  wrong_info: "❌ Wrong Information",
  suspicious_activity: "🔍 Suspicious Activity",
  user_not_responding: "🔇 User Not Responding",
  payment_problem: "💳 Payment Problem",
  wrong_details: "📝 Wrong Details",
  other: "📋 Other",
};

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  request_id: string | null;
  match_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface AdminReportListProps {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  currentStatus: string;
}

export default function AdminReportList({
  reports, total, page, limit, currentStatus,
}: AdminReportListProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const setFilter = (s: string) => {
    router.push(`/admin/reports${s ? `?status=${s}` : ""}`);
  };

  const updateReport = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/reports-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: id, status, resolution_notes: adminNotes[id] }),
      });
      const json = await res.json();
      if (json.success) router.refresh();
    } finally {
      setUpdating(null);
    }
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    dismissed: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {["", "pending", "reviewed", "resolved", "dismissed"].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={cn("px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border",
              currentStatus === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className={cn("card overflow-hidden",
              r.status === "pending" && "border-l-4 border-l-red-400")}>
              <button
                className="w-full p-5 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span className={cn("badge text-xs", statusBadge[r.status] ?? "badge-gray")}>
                      {r.status}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(r.created_at)}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform", expanded === r.id && "rotate-180")} />
              </button>

              {expanded === r.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-4">
                  {r.description && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                      <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                        {r.description}
                      </div>
                    </div>
                  )}

                  {/* Context links */}
                  <div className="flex flex-wrap gap-2">
                    {r.reporter_id && (
                      <a href={`/admin/users?id=${r.reporter_id}`}
                        className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors">
                        <Hash className="w-3 h-3" /> Reporter: {r.reporter_id.slice(0, 8)}…
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {r.reported_user_id && (
                      <a href={`/admin/users?id=${r.reported_user_id}`}
                        className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors">
                        <Hash className="w-3 h-3" /> Reported User: {r.reported_user_id.slice(0, 8)}…
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {r.match_id && (
                      <a href={`/admin/matches?id=${r.match_id}`}
                        className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors">
                        <Hash className="w-3 h-3" /> Match: {r.match_id.slice(0, 8)}…
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Admin note */}
                  <div>
                    <label className="label text-xs">Resolution Notes (internal)</label>
                    <textarea rows={2} className="input text-sm resize-none"
                      placeholder="Add resolution notes..."
                      maxLength={1000}
                      defaultValue={r.admin_note ?? ""}
                      onChange={(e) => setAdminNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {r.status !== "resolved" && (
                      <button onClick={() => updateReport(r.id, "resolved")}
                        disabled={updating === r.id}
                        className="btn-green text-xs">
                        {updating === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Mark Resolved
                      </button>
                    )}
                    {r.status !== "reviewed" && (
                      <button onClick={() => updateReport(r.id, "reviewed")}
                        disabled={updating === r.id}
                        className="btn-secondary text-xs">
                        {updating === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                        Mark Reviewed
                      </button>
                    )}
                    {r.status !== "dismissed" && (
                      <button onClick={() => updateReport(r.id, "dismissed")}
                        disabled={updating === r.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors">
                        {updating === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Dismiss
                      </button>
                    )}
                    {/* Suspend reported user */}
                    {r.reported_user_id && r.status !== "resolved" && (
                      <a href={`/admin/users?id=${r.reported_user_id}&action=suspend`}
                        className="btn-danger text-xs">
                        Suspend User
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)}</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}&status=${currentStatus}`} className="btn-secondary text-xs">Previous</a>}
            {page * limit < total && <a href={`?page=${page + 1}&status=${currentStatus}`} className="btn-primary text-xs">Next</a>}
          </div>
        </div>
      )}
    </div>
  );
}
