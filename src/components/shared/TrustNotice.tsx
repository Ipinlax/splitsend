import { ShieldAlert } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";

interface TrustNoticeProps {
  context?: "match" | "payment" | "general";
  compact?: boolean;
}

export default function TrustNotice({ context = "general", compact = false }: TrustNoticeProps) {
  const messages: Record<typeof context, string> = {
    match: "If you have any problem with this match, contact admin on WhatsApp immediately.",
    payment: "If your payment was deducted but not confirmed, contact admin on WhatsApp immediately.",
    general: "If you have any problem, contact admin on WhatsApp immediately.",
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-green-800 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-green-600" />
          {messages[context]}
        </div>
        <WhatsAppButton
          size="sm"
          variant="primary"
          label="WhatsApp"
          message={`Hello SplitSend Admin, I need help with my ${context}.`}
        />
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <ShieldAlert className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800 mb-0.5">Need help?</p>
          <p className="text-sm text-green-700">{messages[context]}</p>
        </div>
      </div>
      <WhatsAppButton
        size="md"
        variant="primary"
        message={`Hello SplitSend Admin, I need help with my ${context}.`}
        fullWidth
      />
    </div>
  );
}
