// =============================================================================
// Paystack Integration — SERVER SIDE ONLY
//
// SECURITY:
//   - Uses PAYSTACK_SECRET_KEY (never NEXT_PUBLIC_)
//   - All transaction initialization and verification done here
//   - Never trust frontend payment success claims
//   - Verify every transaction server-side before revealing contacts
// =============================================================================

import type { PaystackInitResponse, PaystackVerifyResponse } from "@/types";
import { logger } from "./logger";

const PAYSTACK_API = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. This must be a server-side environment variable."
    );
  }
  return key;
}

function buildHeaders() {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
}

/**
 * Initialize a Paystack transaction.
 * Called from server-side API route only.
 * Returns authorization_url and reference for the client to use.
 */
export async function initializePaystackTransaction({
  email,
  amountKobo,
  reference,
  metadata,
  callbackUrl,
}: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl: string;
}): Promise<PaystackInitResponse> {
  logger.info("Initializing Paystack transaction", { reference, amountKobo });

  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      metadata,
      callback_url: callbackUrl,
      currency: "NGN",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Paystack initialization failed", { status: response.status, body });
    throw new Error("Failed to initialize payment. Please try again.");
  }

  const data = (await response.json()) as PaystackInitResponse;

  if (!data.status) {
    logger.error("Paystack returned failure status on init", { message: data.message });
    throw new Error(data.message ?? "Payment initialization failed.");
  }

  return data;
}

/**
 * Verify a Paystack transaction by reference.
 * MUST be called server-side — never trust client-side verification.
 * Returns the full verification response.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  logger.info("Verifying Paystack transaction", { reference });

  // Basic sanitization — reference should be alphanumeric with hyphens/underscores
  if (!/^[\w-]{8,100}$/.test(reference)) {
    throw new Error("Invalid payment reference format.");
  }

  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    logger.error("Paystack verification request failed", {
      status: response.status,
      reference,
      body,
    });
    throw new Error("Failed to verify payment. Please contact support.");
  }

  const data = (await response.json()) as PaystackVerifyResponse;

  if (!data.status) {
    logger.error("Paystack returned failure status on verify", {
      reference,
      message: data.message,
    });
    throw new Error(data.message ?? "Payment verification failed.");
  }

  return data;
}

/**
 * Generate a secure unique payment reference.
 * Format: SS-{userId_prefix}-{timestamp}-{random}
 */
export function generatePaymentReference(userId: string): string {
  const userPrefix = userId.replace(/-/g, "").substring(0, 8);
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SS-${userPrefix}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Verify Paystack webhook signature to prevent replay attacks.
 * Called in webhook handler route.
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn("PAYSTACK_WEBHOOK_SECRET not set — skipping webhook verification");
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === signature;
}
