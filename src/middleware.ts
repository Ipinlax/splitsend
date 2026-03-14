// =============================================================================
// Next.js Middleware
// - Refreshes Supabase session on every request
// - Protects authenticated routes
// - Restricts admin routes to admin role only
// - Blocks suspended users
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard", "/post-request", "/browse", "/connect", "/payment"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p));

  // Unauthenticated user trying to access protected route
  if ((isProtected || isAdmin) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route: verify admin role in DB
  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (profile.is_suspended) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?reason=suspended", request.url));
    }
  }

  // Check suspended users on protected routes
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", user.id)
      .single();

    if (profile?.is_suspended) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?reason=suspended", request.url));
    }
  }

  // Logged-in users should not see auth pages
  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
