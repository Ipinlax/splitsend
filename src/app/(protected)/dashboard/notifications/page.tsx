import { redirect } from "next/navigation";
import { getServerUserWithProfile, createServerClient, createAdminClient } from "@/lib/supabase/server";
import NotificationsList from "@/components/NotificationsList";
import { Bell } from "lucide-react";
import type { Notification } from "@/types";

export const metadata = { title: "Notifications | SplitSend" };

export default async function NotificationsPage() {
  const up = await getServerUserWithProfile();
  if (!up) redirect("/login");

  const supabase = await createServerClient();

  // Fetch notifications (RLS ensures only own)
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, message, is_read, metadata, created_at")
    .eq("user_id", up.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;

  // Mark all as read in background
  if (unread > 0) {
    const admin = createAdminClient();
    await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", up.user.id)
      .eq("is_read", false);
  }

  return (
    <div className="page-container py-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-blue-600" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
      </div>

      <NotificationsList notifications={(notifications ?? []) as Notification[]} />
    </div>
  );
}
