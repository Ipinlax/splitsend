"use client";

import { useState } from "react";

interface PayMatchButtonProps {
  matchId: string;
  disabled?: boolean;
  className?: string;
}

const FEE_NGN = process.env.NEXT_PUBLIC_CONNECTION_FEE_NGN ?? "2000";

export default function PayMatchButton({
  matchId,
  disabled = false,
  className = "",
}: PayMatchButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId }),
      });

      const data: { payment_url?: string; error?: string } = await res.json();

      if (!res.ok || !data.payment_url) {
        setError(data.error ?? "Failed to start payment. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to Flutterwave hosted checkout
      window.location.href = data.payment_url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || loading}
        className={[
          "btn-primary w-full justify-center",
          disabled || loading ? "opacity-50 cursor-not-allowed" : "",
          className,
        ]
          .join(" ")
          .trim()}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Redirecting to payment…
          </>
        ) : (
          <>Pay ₦{Number(FEE_NGN).toLocaleString()} — Connect</>
        )}
      </button>
      {error !== null && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
