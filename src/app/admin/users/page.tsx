import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export const metadata = { title: "Users | Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data: users, count } = await admin
    .from("profiles")
    .select("id, role, full_name, profession, state, city, is_suspended, suspended_reason, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <div className="p-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Users</h1>
      <p className="text-sm text-gray-500 mb-6">{count ?? 0} total registered users</p>
      <AdminUsersClient users={users ?? []} total={count ?? 0} page={page} limit={limit} />
    </div>
  );
}
