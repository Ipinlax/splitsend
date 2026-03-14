import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import AdminMessageList from "@/components/admin/AdminMessageList";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Support Messages | Admin" };

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>;
}) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const status = sp.status ?? "";
  const category = sp.category ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("support_messages")
    .select(
      "id, user_id, name, whatsapp, email, message, category, match_id, request_id, status, admin_note, reviewed_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data: messages, count } = await query;

  const { count: openCount } = await admin
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Support Messages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {openCount ?? 0} open messages requiring attention
          </p>
        </div>
      </div>

      <AdminMessageList
        messages={messages ?? []}
        total={count ?? 0}
        page={page}
        limit={limit}
        currentStatus={status}
        currentCategory={category}
      />
    </div>
  );
}
