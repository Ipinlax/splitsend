"use client";

import { useState } from "react";
import { Flag, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_WHATSAPP_URL } from "@/constants";

const REASONS = [
  { value: "user_not_responding", label: "🔇 User not responding" },
  { value: "payment_problem", label: "💳 Payment problem" },
  { value: "wrong_details", label: "❌ Wrong details provided" },
  { value: "suspicious_activity", label: "🚨 Suspicious activity" },
  { value: "other", label: "📝 Other issue" },
];

export default function ReportMatchButton({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("user_not_responding");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to submit report.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-danger text-xs"
      >
        <Flag className="w-3.5 h-3.5" /> Report Issue
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
            {done ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Report Submitted</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Admin will review and contact you shortly. You can also reach admin directly on WhatsApp.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`${ADMIN_WHATSAPP_URL}?text=${encodeURIComponent(`Hello Admin, I just reported an issue with match ${matchId}. Reason: ${reason}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <WaIcon /> Follow Up on WhatsApp
                  </a>
                  <button onClick={() => { setOpen(false); setDone(false); }} className="btn-secondary justify-center text-xs">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900">Report an Issue</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Admin will review within a few hours</p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                  )}

                  <div>
                    <label className="label">What&apos;s the issue?</label>
                    <div className="space-y-2">
                      {REASONS.map((r) => (
                        <label key={r.value} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          reason === r.value
                            ? "border-blue-500 bg-blue-50 text-blue-800"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        )}>
                          <input
                            type="radio"
                            name="reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                            reason === r.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                          )}>
                            {reason === r.value && <span className="w-full h-full flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                            </span>}
                          </span>
                          <span className="text-sm font-medium">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="report-desc">
                      Additional details <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="report-desc"
                      rows={3}
                      className="input resize-none"
                      placeholder="Describe what happened..."
                      maxLength={1000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <strong>Match ID:</strong> <code className="font-mono">{matchId.slice(0, 12)}…</code> will be included in your report.
                  </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button type="submit" disabled={loading} className="btn-danger flex-1 justify-center">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4" /> Submit Report</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
