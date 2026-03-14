"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Send } from "lucide-react";
import { ADMIN_WHATSAPP_URL, ADMIN_WHATSAPP_NUMBER } from "@/constants";

const CATEGORIES = [
  { value: "payment_issue", label: "💳 Payment Issue" },
  { value: "match_problem", label: "🤝 Match Problem" },
  { value: "report_user", label: "🚩 Report a User" },
  { value: "general_help", label: "💬 General Help" },
  { value: "other", label: "📝 Other" },
];

interface SupportFormProps {
  userId: string | null;
  matchId?: string;
  requestId?: string;
  defaultCategory?: string;
}

export default function SupportForm({ userId, matchId, requestId, defaultCategory }: SupportFormProps) {
  const [form, setForm] = useState({
    name: "", whatsapp: "", email: "", message: "",
    category: defaultCategory ?? "general_help",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("You must be signed in to send a message.");
      return;
    }
    if (!form.name.trim() || !form.whatsapp.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, match_id: matchId, request_id: requestId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to send message.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 text-sm mb-6">
          Admin will review your message and reach out to you on WhatsApp shortly.
        </p>
        <a
          href={`${ADMIN_WHATSAPP_URL}?text=${encodeURIComponent("Hello SplitSend Admin, I just submitted a support message.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <WaIcon /> Follow up on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Send a Message</h2>
      <p className="text-sm text-gray-500 mb-6">We'll review and contact you within a few hours.</p>

      {!userId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Please <a href="/login" className="underline font-medium">sign in</a> to send a message. Or go directly to <a href={ADMIN_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium">WhatsApp</a>.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="sup-name">Full Name <span className="text-red-500">*</span></label>
            <input id="sup-name" type="text" className="input" placeholder="Your name" maxLength={100}
              value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="sup-wa">WhatsApp Number <span className="text-red-500">*</span></label>
            <input id="sup-wa" type="tel" className="input" placeholder="+2348000000000" maxLength={15}
              value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="sup-email">Email <span className="text-gray-400 font-normal">(optional)</span></label>
          <input id="sup-email" type="email" className="input" placeholder="you@example.com" maxLength={254}
            value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="sup-category">Category <span className="text-red-500">*</span></label>
          <div className="relative">
            <select id="sup-category" className="select pr-10" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="sup-msg">Message <span className="text-red-500">*</span></label>
          <textarea
            id="sup-msg"
            rows={5}
            className="input resize-none"
            placeholder="Describe your issue in detail. Include your match ID or request ID if relevant."
            maxLength={2000}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            required
          />
          <p className="text-xs text-gray-400 mt-1">{form.message.length}/2000 characters</p>
        </div>

        {(matchId || requestId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            {matchId && <span className="block">Match ID: <code className="font-mono">{matchId}</code></span>}
            {requestId && <span className="block">Request ID: <code className="font-mono">{requestId}</code></span>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !userId}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Sending...
            </span>
          ) : (
            <><Send className="w-4 h-4" /> Send Message</>
          )}
        </button>
      </form>
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
