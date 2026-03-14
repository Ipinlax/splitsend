"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, MapPin, Package, Globe,
  Calendar, User, X, ChevronDown, Loader2, ArrowRight,
  CheckCircle, Star, Users, AlertCircle
} from "lucide-react";
import {
  NIGERIAN_STATES, PROFESSION_LABELS, CATEGORY_LABELS,
  COURIER_LABELS, COMMON_DESTINATIONS, CONNECTION_FEE_NGN
} from "@/constants";
import { rankRequests } from "@/lib/matching";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { PublicRequest } from "@/types";
import WhatsAppButton from "@/components/shared/WhatsAppButton";

interface Props {
  initialRequests: PublicRequest[];
  myRequest: PublicRequest | null;
  userId: string;
  initialFilters: Record<string, string>;
}

export default function BrowseClient({ initialRequests, myRequest, userId, initialFilters }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialFilters.keyword ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    state: initialFilters.state ?? "",
    city: initialFilters.city ?? "",
    profession: initialFilters.profession ?? "",
    request_category: initialFilters.request_category ?? "",
    courier_preference: initialFilters.courier_preference ?? "",
    destination_country: initialFilters.destination_country ?? "",
  });

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  const setFilter = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () => {
    setFilters({ state: "", city: "", profession: "", request_category: "", courier_preference: "", destination_country: "" });
    setKeyword("");
  };
  const hasFilters = Object.values(filters).some(Boolean) || keyword;

  // Filter + score
  const results = useMemo(() => {
    let list = initialRequests.filter((r) => {
      if (filters.state && !r.state.toLowerCase().includes(filters.state.toLowerCase())) return false;
      if (filters.city && !r.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.profession && r.profession !== filters.profession) return false;
      if (filters.request_category && r.request_category !== filters.request_category) return false;
      if (filters.courier_preference && filters.courier_preference !== "any" &&
        r.courier_preference !== "any" && r.courier_preference !== filters.courier_preference) return false;
      if (filters.destination_country && !r.destination_country.toLowerCase().includes(filters.destination_country.toLowerCase())) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const blob = [r.first_name, r.city, r.state, r.destination_country, r.notes ?? "", r.document_type ?? ""].join(" ").toLowerCase();
        if (!blob.includes(kw)) return false;
      }
      return true;
    });

    // Sort by match score if user has own request
    if (myRequest) {
      const scored = rankRequests(list, myRequest);
      return scored.map((s: { request: PublicRequest; score: number }) => ({ ...s.request, _score: s.score }));
    }
    return list.map((r: PublicRequest) => ({ ...r, _score: 0 }));
  }, [initialRequests, filters, keyword, myRequest]);

  const handleConnect = async (partnerRequestId: string) => {
    if (!myRequest) {
      router.push("/post-request");
      return;
    }
    setConnectingId(partnerRequestId);
    setConnectError(null);
    setConnectSuccess(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_request_id: partnerRequestId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setConnectError(json.error ?? "Could not connect. Please try again.");
        return;
      }
      const matchId = json.data?.match_id ?? json.data?.id;
      setConnectSuccess(partnerRequestId);
      setTimeout(() => router.push(`/dashboard/matches/${matchId}`), 1200);
    } catch {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnectingId(null);
    }
  };

  const professionOpts = Object.entries(PROFESSION_LABELS);
  const categoryOpts = Object.entries(CATEGORY_LABELS);
  const courierOpts = Object.entries(COURIER_LABELS);

  return (
    <div className="page-container py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Find a Partner</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {results.length} active request{results.length !== 1 ? "s" : ""}
            {myRequest && " · sorted by best match"}
          </p>
        </div>
        {!myRequest && (
          <a href="/post-request" className="btn-primary text-xs">
            Post Your Request First
          </a>
        )}
      </div>

      {/* No own request notice */}
      {!myRequest && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Post your own request first so we can rank matches for you and let you connect.</span>
          </div>
          <a href="/post-request" className="btn-primary text-xs flex-shrink-0">Post Request</a>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="input pl-9" placeholder="Search by name, city, destination, document type…"
              value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("btn-secondary text-xs flex-shrink-0", showFilters && "bg-blue-50 border-blue-300 text-blue-700")}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-xs flex-shrink-0 text-red-500 border-red-200 hover:bg-red-50">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
            {[
              {
                key: "state", label: "State",
                opts: [["", "Any state"], ...NIGERIAN_STATES.map((s) => [s, s])],
              },
              {
                key: "profession", label: "Profession",
                opts: [["", "Any"], ...professionOpts],
              },
              {
                key: "request_category", label: "Category",
                opts: [["", "Any"], ...categoryOpts],
              },
              {
                key: "courier_preference", label: "Courier",
                opts: [["", "Any"], ...courierOpts],
              },
              {
                key: "destination_country", label: "Destination",
                opts: [["", "Any"], ...COMMON_DESTINATIONS.map((c) => [c, c])],
              },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 font-medium block mb-1">{label}</label>
                <div className="relative">
                  <select className="select text-xs pr-7"
                    value={filters[key as keyof typeof filters]}
                    onChange={(e) => setFilter(key, e.target.value)}>
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                </div>
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">City</label>
              <input type="text" className="input text-xs" placeholder="Any city"
                value={filters.city} onChange={(e) => setFilter("city", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Connect errors/success */}
      {connectError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {connectError}
        </div>
      )}

      {/* Results grid */}
      {results.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-700 mb-2">No matching requests found</h3>
          <p className="text-sm text-gray-400 mb-6">
            Try adjusting your filters, or be the first to post a request for your route.
          </p>
          <a href="/post-request" className="btn-primary">Post Your Request</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((req: PublicRequest & { _score: number }) => {
            const score = (req as PublicRequest & { _score: number })._score;
            const isTopMatch = myRequest && score >= 60;
            const isConnecting = connectingId === req.id;
            const isConnected = connectSuccess === req.id;

            return (
              <div key={req.id} className={cn(
                "card p-5 flex flex-col hover:-translate-y-0.5 transition-all duration-200",
                isTopMatch && "border-blue-300 ring-1 ring-blue-200"
              )}>
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                      {req.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{req.first_name}</p>
                      <p className="text-xs text-gray-500">{PROFESSION_LABELS[req.profession] ?? req.profession}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isTopMatch && (
                      <span className="badge-blue text-[10px] flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" /> Best match
                      </span>
                    )}
                    <span className="badge-green text-[10px]">{req.status}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{CATEGORY_LABELS[req.request_category] ?? req.request_category}</span>
                    <span className="text-gray-300">·</span>
                    <span>{COURIER_LABELS[req.courier_preference] ?? req.courier_preference}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {req.city}, {req.state}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    → {req.destination_country}
                    {req.destination_institution && (
                      <span className="text-gray-400 truncate">({req.destination_institution})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {formatDate(req.preferred_send_date)}
                    <span className="text-gray-400 ml-auto">{timeAgo(req.created_at)}</span>
                  </div>
                  {req.notes && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed line-clamp-2">
                      {req.notes}
                    </p>
                  )}
                </div>

                {/* Connect CTA */}
                {isConnected ? (
                  <div className="flex items-center gap-2 justify-center text-green-700 text-sm font-semibold py-2">
                    <CheckCircle className="w-4 h-4" /> Connected! Redirecting…
                  </div>
                ) : (
                  <div>
                    {!myRequest ? (
                      <a href="/post-request" className="btn-secondary w-full justify-center text-xs">
                        Post Request to Connect
                      </a>
                    ) : (
                      <button
                        onClick={() => handleConnect(req.id)}
                        disabled={isConnecting}
                        className="btn-primary w-full justify-center text-sm"
                      >
                        {isConnecting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                        ) : (
                          <>Connect <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 text-center mt-1.5">
                      ₦{CONNECTION_FEE_NGN.toLocaleString()} connection fee after both accept
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom WhatsApp help */}
      <div className="mt-10 bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-green-800 font-medium">
          Can&apos;t find a match? Contact admin — we may have unlisted partners.
        </p>
        <WhatsAppButton size="sm" label="Chat Admin on WhatsApp"
          message="Hello SplitSend Admin, I can't find a match for my request." />
      </div>
    </div>
  );
}
