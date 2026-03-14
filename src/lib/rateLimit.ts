// =============================================================================
// Rate Limiter — In-Memory (suitable for single-instance/Vercel)
//
// For production scale, replace with Redis-backed rate limiting
// (e.g., Upstash Redis with @upstash/ratelimit)
//
// Protects against:
//   - Form spam on POST /api/requests
//   - Repeated connect/payment attempts
//   - Brute force on auth endpoints
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from "@/constants";
import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — resets on cold start (acceptable for MVP)
const store = new Map<string, RateLimitEntry>();

// Periodically clean up stale entries to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/** Get client IP safely from request headers */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

/** Middleware helper: return 429 if rate limited */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { success: false, error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/** Convenience: check rate limit for an API route and return 429 if exceeded */
export function withRateLimit(
  req: NextRequest,
  endpoint: string,
  options?: { max?: number; windowMs?: number }
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${endpoint}:${ip}`;
  const { allowed, remaining, resetAt } = checkRateLimit(
    key,
    options?.max,
    options?.windowMs
  );

  if (!allowed) {
    logger.security.rateLimited(ip, endpoint);
    return rateLimitResponse(resetAt);
  }

  return null; // Allowed — continue
}
