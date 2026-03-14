// =============================================================================
// Supabase Browser Client
// Uses ONLY the public anon key — safe for client-side use.
// RLS policies enforce all data access restrictions.
// NEVER import or use service_role key in this file.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
