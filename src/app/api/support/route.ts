// POST /api/support — Submit a support/contact message
// Security: auth required, rate limited, all input validated

import { NextRequest } from "next/server";
import { createAdminClient, getServerUserWithProfile } from "@/lib/supabase/server";
import { supportMessageSchema } from "@/lib/supportValidation";
import { withRateLimit } from "@/lib/rateLimit";
import { errorResponse, successResponse } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rateLimit = withRateLimit(req, "api/support", { max: 3, windowMs: 300_000 });
  if (rateLimit) return rateLimit;

  // Auth — user must be signed in to submit
  const up = await getServerUserWithProfile();
  if (!up) return errorResponse("Authentication required.", 401);

  let body: unknown;
  try { body = await req.json(); } catch { return errorResponse("Invalid body.", 400); }

  const parsed = supportMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? "Invalid data.", 422);
  }

  const data = parsed.data;
  const admin = createAdminClient();

  const { data: msg, error } = await admin
    .from("support_messages")
    .insert({
      user_id: up.user.id,
      name: data.name,
      whatsapp: data.whatsapp,
      email: data.email || null,
      message: data.message,
      category: data.category,
      match_id: data.match_id ?? null,
      request_id: data.request_id ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to save support message", { userId: up.user.id, error: error.message });
    return errorResponse("Failed to submit message. Please try again.", 500);
  }

  logger.info("Support message submitted", { userId: up.user.id, msgId: msg.id, category: data.category });
  return successResponse({ id: msg.id, message: "Message sent. Admin will contact you shortly." }, 201);
}
