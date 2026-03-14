"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, ChevronDown, Clock, CheckCircle,
  XCircle, Phone, Mail, Tag, Calendar, Hash, Loader2,
  ExternalLink
} from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";

const CATEGORIES: Record<string, string> = {
  payment_issue: "💳 Payment Issue",
  match_problem: "🤝 Match Problem",
  report_user: "🚩 Report User",
  general_help: "💬 General Help",
  other: "📝 Other",
};

const STATUS_FILTERS = ["", "open", "resolved", "ignored"];

interface Message {
  id: string;
  user_id: string | null;
  name: string;
  whatsapp: string;
  email: string | null;
  message: string;
  category: string;
  match_id: string | null;
  request_id: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface AdminMessageListProps {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  currentStatus: string;
  currentCategory: string;
}

export default function AdminMessageList({
  messages,
  total,
  page,
  limit,
  currentStatus,
  currentCategory,
}: AdminMessageListProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const setFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (currentCategory) params.set("category", currentCategory);
    router.push(`/admin/messages?${params.toString()}`);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, admin_note: adminNotes[id] }),
      });
      const json = await res.json();
      if (json.success) router.refresh();
    } catch {
      console.error("Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const statusIcon: Record<string, React.ReactNode> = {
    open: <Clock className="w-3.5 h-3.5 text-yellow-500" />,
    resolved: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
    ignored: <XCircle className="w-3.5 h-3.5 text-gray-400" />,
  };

  const statusBadge: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    ignored: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border",
              currentStatus === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 self-center">
          {total} total
        </span>
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "card overflow-hidden",
                msg.status === "open" && "border-l-4 border-l-yellow-400"
              )}
            >
              {/* Message header */}
              <button
                className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-blue-700 text-sm">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{msg.name}</p>
                      <span className={cn("badge text-xs flex items-center gap-1", statusBadge[msg.status] ?? "badge-gray")}>
                        {statusIcon[msg.status]}
                        {msg.status}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                        {CATEGORIES[msg.category] ?? msg.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {msg.whatsapp}
                      </span>
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {msg.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {timeAgo(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform", expanded === msg.id && "rotate-180")} />
              </button>

              {/* Expanded details */}
              {expanded === msg.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-5">

                  {/* Full message */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Message</p>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>

                  {/* Context IDs */}
                  {(msg.match_id || msg.request_id || msg.user_id) && (
                    <div className="flex flex-wrap gap-2">
                      {msg.user_id && (
                        <a href={`/admin/users?id=${msg.user_id}`} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors">
                          <Hash className="w-3 h-3" /> User ID: {msg.user_id.slice(0, 8)}…
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {msg.match_id && (
                        <a href={`/admin/matches?id=${msg.match_id}`} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors">
                          <Hash className="w-3 h-3" /> Match: {msg.match_id.slice(0, 8)}…
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {msg.request_id && (
                        <a href={`/admin/requests?id=${msg.request_id}`} className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors">
                          <Hash className="w-3 h-3" /> Request: {msg.request_id.slice(0, 8)}…
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* WhatsApp reply button */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Reply via WhatsApp</p>
                      <p className="text-xs text-green-600">{msg.whatsapp}</p>
                    </div>
                    <a
                      href={`https://wa.me/${msg.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${msg.name}, this is SplitSend Admin. I'm responding to your support message.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                    >
                      <WaIcon /> Reply on WhatsApp
                    </a>
                  </div>

                  {/* Admin note */}
                  <div>
                    <label className="label text-xs">Admin Note (internal)</label>
                    <textarea
                      rows={2}
                      className="input text-sm resize-none"
                      placeholder="Add an internal note (only visible to admin)..."
                      maxLength={1000}
                      defaultValue={msg.admin_note ?? ""}
                      onChange={(e) => setAdminNotes((n) => ({ ...n, [msg.id]: e.target.value }))}
                    />
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2 flex-wrap">
                    {msg.status !== "open" && (
                      <button
                        onClick={() => updateStatus(msg.id, "open")}
                        disabled={updating === msg.id}
                        className="btn-secondary text-xs"
                      >
                        {updating === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                        Mark Open
                      </button>
                    )}
                    {msg.status !== "resolved" && (
                      <button
                        onClick={() => updateStatus(msg.id, "resolved")}
                        disabled={updating === msg.id}
                        className="btn-green text-xs"
                      >
                        {updating === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Mark Resolved
                      </button>
                    )}
                    {msg.status !== "ignored" && (
                      <button
                        onClick={() => updateStatus(msg.id, "ignored")}
                        disabled={updating === msg.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
                      >
                        {updating === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Ignore
                      </button>
                    )}
                  </div>

                  {msg.reviewed_at && (
                    <p className="text-xs text-gray-400">
                      Last updated {timeAgo(msg.reviewed_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / limit)}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}&status=${currentStatus}`} className="btn-secondary text-xs">
                Previous
              </a>
            )}
            {page * limit < total && (
              <a href={`?page=${page + 1}&status=${currentStatus}`} className="btn-primary text-xs">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
