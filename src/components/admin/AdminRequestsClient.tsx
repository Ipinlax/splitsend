"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { timeAgo, formatDate, cn } from "@/lib/utils";
import { CATEGORY_LABELS, COURIER_LABELS, PROFESSION_LABELS } from "@/constants";

interface AdminRequest {
  id: string; user_id: string; first_name: string; profession: string;
  request_category: string; state: string; city: string;
  courier_preference: string; destination_country: string;
  preferred_send_date: string; status: string; created_at: string;
}

export default function AdminRequestsClient({
  requests, total, page, limit, currentStatus,
}: { requests: AdminRequest[]; total: number; page: number; limit: number; currentStatus: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this request? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: id, reason: "Removed by admin" }),
      });
      router.refresh();
    } finally { setDeleting(null); }
  };

  const statusColor: Record<string, string> = {
    active: "badge-green", matched: "badge-blue",
    completed: "badge-gray", cancelled: "badge-gray", suspended: "badge-red",
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "active", "matched", "completed", "cancelled"].map((s) => (
          <a key={s || "all"} href={s ? `?status=${s}` : "?"}
            className={cn("px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border",
              currentStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </a>
        ))}
        <span className="ml-auto text-sm text-gray-500 self-center">{total} total</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name", "Category", "Location", "Destination", "Courier", "Send Date", "Status", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-xs text-gray-900">{r.first_name}</p>
                  <p className="text-[10px] text-gray-400">{PROFESSION_LABELS[r.profession] ?? r.profession}</p>
                  <p className="text-[10px] text-gray-300 font-mono">{r.id.slice(0,8)}…</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{CATEGORY_LABELS[r.request_category] ?? r.request_category}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.city}, {r.state}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.destination_country}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{COURIER_LABELS[r.courier_preference] ?? r.courier_preference}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{formatDate(r.preferred_send_date)}</td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-[10px]", statusColor[r.status] ?? "badge-gray")}>{r.status}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(r.created_at)}</p>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    {deleting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between mt-4">
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
