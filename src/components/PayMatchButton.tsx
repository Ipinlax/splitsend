"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import WhatsAppButton from "./shared/WhatsAppButton";
import { CONNECTION_FEE_NGN } from "@/constants";

export default function PayMatchButton({ matchId }: { matchId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to initialize payment.");
        return;
      }
      // Redirect to Paystack authorization URL
      window.location.href = json.data.authorization_url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary justify-center"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay ₦{CONNECTION_FEE_NGN.toLocaleString()}</>
        )}
      </button>

      {error && (
        <div className="text-xs text-red-600 text-center">{error}</div>
      )}

      <p className="text-xs text-gray-400 text-center">Secured by Paystack</p>

      {/* Payment problem help */}
      <WhatsAppButton
        size="sm"
        variant="ghost"
        label="Payment issue? Contact admin"
        message={`Hello Admin, I have a payment issue for match ID: ${matchId}`}
        className="text-xs justify-center text-gray-500"
      />
    </div>
  );
}
