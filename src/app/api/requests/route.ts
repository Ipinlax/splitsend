import { NextRequest } from "next/server";
import { getServerUser, createServerClient, createAdminClient } from "@/lib/supabase/server";
import { createRequestSchema } from "@/lib/validation";
import { withRateLimit, getClientIp } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { errorResponse, successResponse, sanitizeText } from "@/lib/utils";
import { MAX_POSTS_PER_DAY } from "@/constants";

export async function POST(request: NextRequest) {
  const rl = withRateLimit(request, "api/requests", { max: 5, windowMs: 600_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("is_suspended").eq("id", user.id).single();

  if (profile?.is_suspended) {
    logger.security.unauthorizedAccess(user.id, "api/requests (suspended)");
    return errorResponse("Your account has been suspended.", 403, "SUSPENDED");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await adminClient
    .from("requests").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).gte("created_at", startOfDay.toISOString());

  if ((todayCount ?? 0) >= MAX_POSTS_PER_DAY) {
    return errorResponse(`You can only post ${MAX_POSTS_PER_DAY} requests per day.`, 429, "DAILY_LIMIT");
  }

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Invalid request body.", 400); }

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? "Invalid input.", 400, "VALIDATION_ERROR");
  }

  const data = parsed.data;
  const supabase = await createServerClient();

  const { data: newRequest, error } = await supabase
    .from("requests")
    .insert({
      user_id: user.id,
      first_name: data.first_name,
      profession: data.profession,
      request_category: data.request_category,
      state: data.state, city: data.city,
      area: data.area ?? null,
      courier_preference: data.courier_preference,
      destination_country: data.destination_country,
      destination_institution: data.destination_institution ? sanitizeText(data.destination_institution) : null,
      document_type: data.document_type ? sanitizeText(data.document_type) : null,
      preferred_send_date: data.preferred_send_date,
      notes: data.notes ? sanitizeText(data.notes) : null,
      full_name_private: data.full_name_private,
      whatsapp_number: data.whatsapp_number,
      email_private: data.email_private || null,
      status: "active",
    })
    .select("id, first_name, state, city, status, created_at")
    .single();

  if (error) {
    logger.error("Failed to create request", { userId: user.id, error: error.message });
    return errorResponse("Failed to create your request. Please try again.", 500);
  }

  logger.info("Request created", { requestId: newRequest.id, userId: user.id, ip: getClientIp(request) });
  return successResponse({ id: newRequest.id, message: "Your request has been posted successfully." }, 201);
}

export async function GET(request: NextRequest) {
  const rl = withRateLimit(request, "api/requests/get", { max: 30, windowMs: 60_000 });
  if (rl) return rl;

  const user = await getServerUser();
  if (!user) return errorResponse("Authentication required.", 401, "UNAUTHORIZED");

  const { searchParams } = new URL(request.url);
  const supabase = await createServerClient();

  let query = supabase
    .from("requests")
    .select("id, user_id, first_name, profession, request_category, state, city, area, courier_preference, destination_country, destination_institution, document_type, preferred_send_date, notes, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const state = searchParams.get("state");
  const city = searchParams.get("city");
  const profession = searchParams.get("profession");
  const category = searchParams.get("request_category");
  const courier = searchParams.get("courier_preference");
  const destination = searchParams.get("destination_country");
  const keyword = searchParams.get("keyword");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  if (state) query = query.ilike("state", `%${state}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (profession) query = query.eq("profession", profession);
  if (category) query = query.eq("request_category", category);
  if (courier) query = query.in("courier_preference", [courier, "any"]);
  if (destination) query = query.ilike("destination_country", `%${destination}%`);
  if (keyword) {
    query = query.or(`notes.ilike.%${keyword}%,destination_country.ilike.%${keyword}%,city.ilike.%${keyword}%`);
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data: requests, error, count } = await query;
  if (error) {
    logger.error("Failed to fetch requests", { error: error.message });
    return errorResponse("Failed to load requests.", 500);
  }

  return successResponse({ requests: requests ?? [], pagination: { page, pageSize, total: count ?? 0 } });
}
