// =============================================================================
// Utility Functions
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiError } from "@/types";
import { NextResponse } from "next/server";

/** Tailwind class merger */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format amount from kobo to naira string */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

/** Format date to readable Nigerian format */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Get time-since string */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

/** Safe error response for API routes — never leak internal details */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, ...(code ? { code } : {}) },
    { status }
  );
}

/** Success response wrapper */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/** Sanitize text to prevent XSS — strip HTML tags */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/** Mask WhatsApp number for display (first 4 + last 2 digits visible) */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "****";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

/** Mask email for display */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "****@****";
  return user[0] + "***@" + domain;
}

/** Check if string is a valid UUID */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Get first name only from full name */
export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}
