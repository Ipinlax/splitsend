import { notFound, redirect } from "next/navigation";
import { getServerUserWithProfile, createServerClient } from "@/lib/supabase/server";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import TrustNotice from "@/components/shared/TrustNotice";
import ReportMatchButton from "@/components/ReportMatchButton";
import PayMatchButton from "@/components/PayMatchButton";
import {
  MapPin, Package, Globe, Calendar, CheckCircle2,
  Clock, AlertCircle, User, Phone, Mail, ArrowRight, Lock
} from "lucide-react";
import {
  CATEGORY_LABELS, COURIER_LABELS, PROFESSION_LABELS, MATCH_STATUS_LABELS
} from "@/constants";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import type { MatchWithContact, PublicRequest, Match } from "@/types";

async function getMatchData(matchId: string, userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/matches/${matchId}`, {
    headers: { Cookie: "" }, // Server-side — auth handled via session cookies in real impl
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? json.data : null;
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const up = await getServerUserWithProfile();
  if (!up) redirect("/login");

  // Fetch match via Supabase directly (server component — more efficient than API call)
  const supabase = await createServerClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .or(`initiator_user_id.eq.${up.user.id},partner_user_id.eq.${up.user.id}`)
    .single();

  if (!match) notFound();

  const isInitiator = match.initiator_user_id === up.user.id;

  // Fetch both requests (public fields)
  const { data: requests } = await supabase
    .from("requests")
    .select("id, user_id, first_name, profession, request_category, state, city, area, courier_preference, destination_country, destination_institution, document_type, preferred_send_date, notes, status, created_at")
    .in("id", [match.initiator_request_id, match.partner_request_id]);

  const myRequest = requests?.find((r) =>
    r.id === (isInitiator ? match.initiator_request_id : match.partner_request_id)
  ) as PublicRequest | undefined;

  const partnerRequest = requests?.find((r) =>
    r.id === (isInitiator ? match.partner_request_id : match.initiator_request_id)
  ) as PublicRequest | undefined;

  // Fetch payments
  const { data: payments } = await supabase
    .from("payments")
    .select("user_id, status")
    .eq("match_id", matchId);

  const myPayment = payments?.find((p) => p.user_id === up.user.id);
  const partnerUserId = isInitiator ? match.partner_user_id : match.initiator_user_id;
  const partnerPayment = payments?.find((p) => p.user_id === partnerUserId);

  const bothPaid = match.status === "both_paid" || match.status === "completed";
  const iHavePaid = myPayment?.status === "success";

  const statusColor: Record<string, string> = {
    pending: "badge-yellow",
    initiator_paid: "badge-blue",
    partner_paid: "badge-blue",
    both_paid: "badge-green",
    completed: "badge-green",
    cancelled: "badge-red",
  };

  return (
    <div className="page-container py-10 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Match Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Matched {timeAgo(match.created_at)} · ID: <code className="font-mono text-xs">{matchId.slice(0, 8)}…</code>
          </p>
        </div>
        <div className={cn("badge text-sm px-3 py-1", statusColor[match.status] ?? "badge-gray")}>
          {MATCH_STATUS_LABELS[match.status] ?? match.status}
        </div>
      </div>

      {/* Payment status banner */}
      {!bothPaid && (
        <div className="card p-6 border-2 border-blue-100 bg-blue-50/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-blue-600" />
                Contact Details Locked
              </h3>
              <p className="text-sm text-gray-600">
                To reveal your partner&apos;s WhatsApp and full name, both of you must each pay the
                ₦2,000 connection fee.
              </p>
              <div className="flex gap-4 mt-3 text-xs">
                <span className={cn("flex items-center gap-1.5 font-medium",
                  iHavePaid ? "text-green-600" : "text-gray-400")}>
                  {iHavePaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  You: {iHavePaid ? "Paid ✓" : "Pending"}
                </span>
                <span className={cn("flex items-center gap-1.5 font-medium",
                  partnerPayment?.status === "success" ? "text-green-600" : "text-gray-400")}>
                  {partnerPayment?.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  Partner: {partnerPayment?.status === "success" ? "Paid ✓" : "Pending"}
                </span>
              </div>
            </div>
            {!iHavePaid && (
              <PayMatchButton matchId={matchId} />
            )}
          </div>
        </div>
      )}

      {/* Contact revealed */}
      {bothPaid && (
        <div className="card p-6 border-2 border-green-200 bg-green-50/40">
          <div className="flex items-center gap-2 text-green-700 mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold">Contact details revealed!</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            Both payments verified. Reach out to your partner and coordinate the shipment.
          </p>

          {/* This would be populated with real partner contact from the API in full impl */}
          <div className="bg-white rounded-xl border border-green-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner Contact</p>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{partnerRequest?.first_name ?? "—"} (Full name revealed)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-green-700 font-medium">WhatsApp revealed — check your dashboard</span>
            </div>
            <WhatsAppButton
              size="sm"
              label="Open WhatsApp to coordinate"
              variant="primary"
              message="Hello, I found you on SplitSend! Let's coordinate our document shipment."
            />
          </div>
        </div>
      )}

      {/* Request cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RequestCard request={myRequest} label="Your Request" isOwn />
        <RequestCard request={partnerRequest} label="Partner's Request" />
      </div>

      {/* Trust notice + WhatsApp */}
      <TrustNotice context="match" />

      {/* Match actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm text-gray-700 mb-4">Match Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/support" className="btn-secondary text-xs">
            <Mail className="w-4 h-4" /> Contact Admin
          </a>
          <WhatsAppButton
            size="sm"
            variant="outline"
            label="WhatsApp Support"
            message={`Hello SplitSend Admin, I have an issue with match ID: ${matchId}`}
          />
          <ReportMatchButton matchId={matchId} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer text-xs leading-relaxed">
        <strong>Reminder:</strong> SplitSend only connects you with your partner. We do not manage, insure,
        or guarantee the courier shipment. Always verify your documents independently before sending.
        Once documents leave your hands, SplitSend has no liability.
      </div>
    </div>
  );
}

function RequestCard({
  request,
  label,
  isOwn = false,
}: {
  request?: PublicRequest;
  label: string;
  isOwn?: boolean;
}) {
  if (!request) return (
    <div className="card p-5">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-3/4" />
    </div>
  );

  return (
    <div className={cn("card p-5", isOwn && "border-blue-200 bg-blue-50/20")}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        {isOwn && <span className="badge-blue text-xs">You</span>}
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">{request.first_name}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{PROFESSION_LABELS[request.profession] ?? request.profession}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          {request.city}, {request.state}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          {request.destination_country}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          {CATEGORY_LABELS[request.request_category] ?? request.request_category}
          <span className="text-gray-400">·</span>
          {COURIER_LABELS[request.courier_preference] ?? request.courier_preference}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(request.preferred_send_date)}
        </div>
        {request.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed">
            {request.notes}
          </p>
        )}
      </div>
    </div>
  );
}
