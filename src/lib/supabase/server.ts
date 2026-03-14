// =============================================================================
// Supabase Server Client
// For use in Server Components, API Routes, and Server Actions only.
//
// Two clients:
//   createServerClient()      — uses anon key, respects RLS (for user actions)
//   createAdminClient()       — uses service_role key, bypasses RLS (admin only)
//
// SECURITY:
//   - Never import createAdminClient in client components
//   - Always validate user is admin before calling createAdminClient
//   - service_role key is NEVER in NEXT_PUBLIC_ vars
// =============================================================================

import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Standard server client — respects RLS — use for regular user operations */
export async function createServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          );
        } catch {
          // setAll called from a Server Component (read-only context) — safe to ignore
        }
      },
    },
  });
}

/**
 * Admin server client — uses service_role key, bypasses ALL RLS.
 *
 * SECURITY: Only call this from:
 *   1. Server-side API routes that verify admin role first
 *   2. Internal server actions (never client components)
 *
 * Always check admin authorization BEFORE calling this function.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables. SUPABASE_SERVICE_ROLE_KEY must be set server-side only."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Get the current authenticated user server-side (returns null if not authed) */
export async function getServerUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** Get user + profile together — returns null if not authenticated */
export async function getServerUserWithProfile() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  return { user, profile };
}

/** Check if a user ID is in the admin list (env var based check as secondary layer) */
export function isAdminUserId(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}
