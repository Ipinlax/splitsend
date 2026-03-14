import { redirect } from "next/navigation";
import { getServerUserWithProfile, isAdminUserId, createAdminClient } from "@/lib/supabase/server";
import AdminRequestsClient from "@/components/admin/AdminRequestsClient";

export const metadata = { title: "Requests | Admin" };

export default async function AdminRequestsPage({
  searchParams,
}: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const up = await getServerUserWithProfile();
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const status = sp.status ?? "";
  const limit = 30;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("requests")
    .select(
      // Admin can see public fields — access to private fields only when explicitly needed for support
      "id, user_id, first_name, profession, request_category, state, city, courier_preference, destination_country, preferred_send_date, status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data: requests, count } = await query;

  return (
    <div className="p-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Requests</h1>
      <p className="text-sm text-gray-500 mb-6">{count ?? 0} total requests</p>
      <AdminRequestsClient requests={requests ?? []} total={count ?? 0} page={page} limit={limit} currentStatus={status} />
    </div>
  );
}
