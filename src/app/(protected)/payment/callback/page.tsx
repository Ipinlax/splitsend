"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import WhatsAppButton from "@/components/shared/WhatsAppButton";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "already_paid">("verifying");
  const [bothPaid, setBothPaid] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Flutterwave callback params (replaces Paystack ?reference= and ?match_id=)
    const flw_status = searchParams.get("status");
    const transaction_id = searchParams.get("transaction_id");
    const tx_ref = searchParams.get("tx_ref");

    // User cancelled or payment failed on Flutterwave side
    if (flw_status === "cancelled" || flw_status === "failed") {
      setStatus("failed");
      setError("Payment was not completed. No charge was made.");
      return;
    }

    if (!transaction_id || !tx_ref) {
      setStatus("failed");
      setError("Missing payment details. Please contact admin.");
      return;
    }

    const qs = new URLSearchParams({
      transaction_id,
      tx_ref,
      status: flw_status ?? "",
    });

    fetch(`/api/payments/verify?${qs.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setStatus("failed");
          setError(json.error ?? "Verification failed. Contact admin if you were charged.");
          return;
        }

        if (json.already_verified) {
          setMatchId(json.match_id ?? null);
          setStatus("already_paid");
          return;
        }

        if (json.verified) {
          setMatchId(json.match_id ?? null);
          setStatus("success");
          setBothPaid(json.contacts_revealed ?? false);
        } else {
          setStatus("failed");
          setError(json.message ?? "Payment was not successful. No charge was made.");
        }
      })
      .catch(() => {
        setStatus("failed");
        setError("Network error during verification. Contact admin if you were charged.");
      });
  }, [searchParams]);

  const goToMatch = () => matchId && router.push(`/dashboard/matches/${matchId}`);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center">

        {status === "verifying" && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Verifying Payment…</h2>
            <p className="text-sm text-gray-500">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${bothPaid ? "bg-green-100" : "bg-blue-100"}`}>
              <CheckCircle className={`w-8 h-8 ${bothPaid ? "text-green-600" : "text-blue-600"}`} />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">
              {bothPaid ? "🎉 Both Paid! Contact Revealed" : "Payment Confirmed!"}
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {bothPaid
                ? "Both you and your partner have paid. Contact details are now visible on your match page."
                : "Your payment is confirmed. Your partner has been notified. Once they also pay, contact details will be revealed."}
            </p>
            <button onClick={goToMatch} className="btn-primary w-full justify-center mb-3">
              View Match <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {status === "already_paid" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Already Verified</h2>
            <p className="text-sm text-gray-500 mb-6">Your payment for this match was already confirmed.</p>
            <button onClick={goToMatch} className="btn-primary w-full justify-center">
              Go to Match <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">
              {error ?? "There was a problem verifying your payment."}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              If money was deducted from your account, contact admin immediately on WhatsApp.
            </p>
            <div className="space-y-3">
              <WhatsAppButton
                size="md"
                fullWidth
                label="Contact Admin on WhatsApp"
                message={`Hello SplitSend Admin, I had a payment issue. TX Ref: ${searchParams.get("tx_ref") ?? "unknown"}. Please help.`}
              />
              <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full justify-center text-sm">
                Back to Dashboard
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
