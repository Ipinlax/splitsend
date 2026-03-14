"use client";

import Link from "next/link";
import {
  Bell, Users, CreditCard, CheckCircle2, Phone,
  AlertTriangle, Info, ArrowRight
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, React.ElementType> = {
  connection_request: Users,
  payment_received: CreditCard,
  both_paid: CheckCircle2,
  contact_revealed: Phone,
  match_completed: CheckCircle2,
  issue_reported: AlertTriangle,
  system: Info,
};

const COLORS: Record<NotificationType, string> = {
  connection_request: "bg-blue-100 text-blue-600",
  payment_received: "bg-green-100 text-green-600",
  both_paid: "bg-green-100 text-green-700",
  contact_revealed: "bg-purple-100 text-purple-600",
  match_completed: "bg-green-100 text-green-600",
  issue_reported: "bg-red-100 text-red-600",
  system: "bg-gray-100 text-gray-600",
};

export default function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (!notifications.length) {
    return (
      <div className="card p-16 text-center">
        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h3 className="font-display font-semibold text-gray-600 mb-1">No notifications yet</h3>
        <p className="text-sm text-gray-400">We&apos;ll notify you when someone wants to connect.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const Icon = ICONS[n.type] ?? Bell;
        const colorClass = COLORS[n.type] ?? "bg-gray-100 text-gray-600";
        const matchId = (n.metadata as Record<string, string> | null)?.match_id;

        return (
          <div key={n.id} className="card p-4 flex items-start gap-4 hover:border-blue-200 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-600 mt-0.5 leading-snug">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
            </div>
            {matchId && (
              <Link href={`/dashboard/matches/${matchId}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0 mt-1">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
