// Admin authorization helper — always verify server-side
import { getServerUser, createAdminClient, isAdminUserId } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const user = await getServerUser();
  if (!user) return null;

  // Double-check: verify role in DB AND env var list
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !isAdminUserId(user.id)) {
    logger.security.unauthorizedAccess(user.id, "admin route");
    return null;
  }

  if (profile.is_suspended) {
    logger.security.unauthorizedAccess(user.id, "admin route (suspended admin)");
    return null;
  }

  return { userId: user.id };
}
