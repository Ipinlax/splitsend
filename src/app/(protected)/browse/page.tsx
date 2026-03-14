import { createServerClient, getServerUserWithProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BrowseClient from "@/components/BrowseClient";
import type { PublicRequest } from "@/types";

export const metadata = {
  title: "Find a Partner | SplitSend",
  description: "Browse active document-send requests and find someone to split courier costs with.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const up = await getServerUserWithProfile();
  if (!up) redirect("/login");

  const sp = await searchParams;
  const supabase = await createServerClient();

  // Build server-side query with safe public fields only — NEVER private columns
  let query = supabase
    .from("requests")
    .select(
      "id, user_id, first_name, profession, request_category, state, city, area, courier_preference, destination_country, destination_institution, document_type, preferred_send_date, notes, status, created_at"
    )
    .eq("status", "active")
    .neq("user_id", up.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.state) query = query.ilike("state", sp.state);
  if (sp.city) query = query.ilike("city", sp.city);
  if (sp.profession) query = query.eq("profession", sp.profession);
  if (sp.request_category) query = query.eq("request_category", sp.request_category);
  if (sp.courier_preference && sp.courier_preference !== "any")
    query = query.or(`courier_preference.eq.${sp.courier_preference},courier_preference.eq.any`);
  if (sp.destination_country) query = query.ilike("destination_country", sp.destination_country);

  const { data: requests, error } = await query;

  if (error) {
    return (
      <div className="page-container py-20 text-center">
        <p className="text-red-500 text-sm">Failed to load requests. Please refresh.</p>
      </div>
    );
  }

  // Also fetch user's own active request for smart match scoring
  const { data: myRequest } = await supabase
    .from("requests")
    .select("id, user_id, first_name, profession, request_category, state, city, area, courier_preference, destination_country, destination_institution, document_type, preferred_send_date, notes, status, created_at")
    .eq("user_id", up.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <BrowseClient
      initialRequests={(requests ?? []) as PublicRequest[]}
      myRequest={myRequest as PublicRequest | null}
      userId={up.user.id}
      initialFilters={sp}
    />
  );
}
