"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Loader2, ChevronDown, User } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import { PROFESSION_LABELS } from "@/constants";

interface AdminUser {
  id: string;
  role: string;
  full_name: string | null;
  profession: string | null;
  state: string | null;
  city: string | null;
  is_suspended: boolean;
  suspended_reason: string | null;
  created_at: string;
}

export default function AdminUsersClient({
  users, total, page, limit,
}: { users: AdminUser[]; total: number; page: number; limit: number }) {
  const router = useRouter();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});

  const handleSuspend = async (userId: string, action: "suspend" | "unsuspend") => {
    const reason = reasonInputs[userId] ?? "Violated platform rules";
    setActingOn(userId);
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reason }),
      });
      router.refresh();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["User", "Profession", "Location", "Role", "Joined", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className={cn("hover:bg-gray-50/50 transition-colors", u.is_suspended && "bg-red-50/30")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xs flex-shrink-0">
                      {(u.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{u.full_name ?? "—"}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{u.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {PROFESSION_LABELS[u.profession ?? ""] ?? u.profession ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {u.city && u.state ? `${u.city}, ${u.state}` : u.state ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-[10px]", u.role === "admin" ? "badge-blue" : "badge-gray")}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={cn("badge text-[10px]", u.is_suspended ? "badge-red" : "badge-green")}>
                    {u.is_suspended ? "Suspended" : "Active"}
                  </span>
                  {u.is_suspended && u.suspended_reason && (
                    <p className="text-[10px] text-red-500 mt-0.5 max-w-[120px] truncate">{u.suspended_reason}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.role !== "admin" && (
                    <div className="flex items-center gap-2">
                      {!u.is_suspended ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Reason"
                            className="input text-xs py-1 px-2 w-28"
                            value={reasonInputs[u.id] ?? ""}
                            onChange={(e) => setReasonInputs((r) => ({ ...r, [u.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => handleSuspend(u.id, "suspend")}
                            disabled={actingOn === u.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            {actingOn === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                            Suspend
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSuspend(u.id, "unsuspend")}
                          disabled={actingOn === u.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          {actingOn === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                          Unsuspend
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)} · {total} users</p>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}`} className="btn-secondary text-xs">Previous</a>}
            {page * limit < total && <a href={`?page=${page + 1}`} className="btn-primary text-xs">Next</a>}
          </div>
        </div>
      )}
    </div>
  );
}
