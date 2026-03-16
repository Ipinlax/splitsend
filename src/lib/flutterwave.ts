const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

if (!FLW_SECRET_KEY) {
  throw new Error("FLUTTERWAVE_SECRET_KEY environment variable is not set");
}

export interface InitializePaymentParams {
  tx_ref: string;
  amount_ngn: number;
  email: string;
  full_name: string;
  redirect_url: string;
  description?: string;
}

export interface InitializePaymentResult {
  success: boolean;
  payment_url?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  verified: boolean;
  flw_transaction_id?: number;
  flw_ref?: string;
  tx_ref?: string;
  status?: string;
  amount_ngn?: number;
  currency?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResult> {
  try {
    const payload = {
      tx_ref: params.tx_ref,
      amount: params.amount_ngn,
      currency: "NGN",
      redirect_url: params.redirect_url,
      customer: {
        email: params.email,
        name: params.full_name,
        phonenumber: "00000000000",
      },
      customizations: {
        title: "SplitSend",
        description: params.description ?? "Connect fee — split courier cost",
      },
    };

    console.log("[flutterwave] sending payload:", JSON.stringify(payload));

    const res = await fetch(`${FLW_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[flutterwave] raw response:", JSON.stringify(data));

    if (data.status === "success" && data.data?.link) {
      return { success: true, payment_url: data.data.link };
    }

    return {
      success: false,
      error: data.message ?? "Failed to initialize payment",
    };
  } catch (err) {
    console.error("[flutterwave] initializePayment error:", err);
    return { success: false, error: "Payment initialization failed" };
  }
}

export async function verifyPayment(
  flw_transaction_id: string | number,
  expected_amount_kobo: number
): Promise<VerifyPaymentResult> {
  try {
    const res = await fetch(
      `${FLW_BASE_URL}/transactions/${flw_transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (data.status !== "success") {
      return {
        success: true,
        verified: false,
        error: data.message ?? "Verification API call failed",
      };
    }

    const tx = data.data as Record<string, unknown>;
    const expected_ngn = expected_amount_kobo / 100;
    const returned_amount = Number(tx.amount);
    const amountOk =
      tx.currency === "NGN" && returned_amount >= expected_ngn;
    const isSuccessful = tx.status === "successful" && amountOk;

    return {
      success: true,
      verified: isSuccessful,
      flw_transaction_id: tx.id as number,
      flw_ref: tx.flw_ref as string,
      tx_ref: tx.tx_ref as string,
      status: tx.status as string,
      amount_ngn: returned_amount,
      currency: tx.currency as string,
      raw: tx,
    };
  } catch (err) {
    console.error("[flutterwave] verifyPayment error:", err);
    return {
      success: false,
      verified: false,
      error: "Verification request failed",
    };
  }
}

export function verifyWebhookSignature(headerHash: string | null): boolean {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash || !headerHash) return false;
  return headerHash === secretHash;
}
```

**Important:** After pasting, scroll to the very bottom of the editor and make sure the last line is exactly:
```
}
