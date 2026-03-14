"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, AlertTriangle, CheckCircle, User, Phone,
  Mail, MapPin, Package, Globe, Calendar, ChevronDown, Info
} from "lucide-react";
import {
  NIGERIAN_STATES, PROFESSION_LABELS, CATEGORY_LABELS,
  COURIER_LABELS, COMMON_DESTINATIONS, CONNECTION_FEE_NGN,
} from "@/constants";
import { cn } from "@/lib/utils";

const PROFESSIONS = Object.entries(PROFESSION_LABELS);
const CATEGORIES = Object.entries(CATEGORY_LABELS);
const COURIERS = Object.entries(COURIER_LABELS);

function FormSection({
  title, icon: Icon, children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2 mb-5 text-sm uppercase tracking-wide">
        <Icon className="w-4 h-4 text-blue-600" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {!required && <span className="text-gray-400 font-normal text-xs ml-1">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function PostRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    full_name_private: "",
    whatsapp_number: "",
    email_private: "",
    profession: "",
    request_category: "",
    state: "",
    city: "",
    area: "",
    courier_preference: "any",
    destination_country: "",
    destination_institution: "",
    document_type: "",
    preferred_send_date: "",
    notes: "",
    confirm_correct: false,
    agree_terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.full_name_private.trim()) e.full_name_private = "Full name is required";
    if (!form.whatsapp_number.trim()) e.whatsapp_number = "WhatsApp number is required";
    else if (!/^\+?[0-9]{10,15}$/.test(form.whatsapp_number.replace(/\s/g, "")))
      e.whatsapp_number = "Enter a valid phone number (e.g. +2348012345678)";
    if (!form.profession) e.profession = "Select your profession";
    if (!form.request_category) e.request_category = "Select request type";
    if (!form.state) e.state = "Select your state";
    if (!form.city.trim()) e.city = "Enter your city";
    if (!form.destination_country) e.destination_country = "Select destination country";
    if (!form.preferred_send_date) e.preferred_send_date = "Select preferred send date";
    else {
      const d = new Date(form.preferred_send_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) e.preferred_send_date = "Date must be today or in the future";
    }
    if (!form.confirm_correct) e.confirm_correct = "Please confirm your details are correct";
    if (!form.agree_terms) e.agree_terms = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email_private: form.email_private || undefined,
          area: form.area || undefined,
          destination_institution: form.destination_institution || undefined,
          document_type: form.document_type || undefined,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.error ?? "Failed to post request. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/browse"), 2500);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Today's date as min for date picker
  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <div className="page-container py-20 text-center max-w-md">
        <div className="card p-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Request Posted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your request is now live. We&apos;re finding you a match. Redirecting to browse…
          </p>
          <div className="mt-6 flex justify-center">
            <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Post a Request</h1>
            <p className="text-sm text-gray-500">Find someone to split your courier cost with</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer flex items-start gap-3 mt-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <p className="text-xs leading-relaxed">
            <strong>Important:</strong> SplitSend connects users only — we do not handle shipments.
            Your WhatsApp number and full name are <strong>never shown publicly</strong>. They are
            revealed only to your matched partner after <strong>both parties pay the
            ₦{CONNECTION_FEE_NGN.toLocaleString()} connection fee</strong>.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* === PUBLIC INFO === */}
        <FormSection title="Public Info" icon={User}>
          <p className="text-xs text-blue-700 bg-blue-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            This information is visible to all users browsing requests.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name only" required error={errors.first_name} hint="Only your first name is shown publicly">
              <input type="text" className={cn("input", errors.first_name && "border-red-400")}
                placeholder="e.g. Adaeze" maxLength={50}
                value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </Field>

            <Field label="Profession / Category" required error={errors.profession}>
              <div className="relative">
                <select className={cn("select pr-8", errors.profession && "border-red-400")}
                  value={form.profession} onChange={(e) => set("profession", e.target.value)}>
                  <option value="">Select profession…</option>
                  {PROFESSIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </Field>
          </div>

          <Field label="Request type" required error={errors.request_category}>
            <div className="relative">
              <select className={cn("select pr-8", errors.request_category && "border-red-400")}
                value={form.request_category} onChange={(e) => set("request_category", e.target.value)}>
                <option value="">Select type…</option>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </Field>

          <Field label="Document type" hint="e.g. Application transcripts, Pharmacy degree certificate" error={errors.document_type}>
            <input type="text" className="input" placeholder="e.g. PEBC application documents"
              maxLength={200} value={form.document_type} onChange={(e) => set("document_type", e.target.value)} />
          </Field>
        </FormSection>

        {/* === LOCATION === */}
        <FormSection title="Your Location" icon={MapPin}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="State" required error={errors.state}>
              <div className="relative">
                <select className={cn("select pr-8", errors.state && "border-red-400")}
                  value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state…</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </Field>

            <Field label="City" required error={errors.city}>
              <input type="text" className={cn("input", errors.city && "border-red-400")}
                placeholder="e.g. Ikeja" maxLength={100}
                value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>

          <Field label="Area / Neighbourhood" hint="Helps narrow down meeting point">
            <input type="text" className="input" placeholder="e.g. Lekki Phase 1, Wuse Zone 4"
              maxLength={100} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
        </FormSection>

        {/* === COURIER & DESTINATION === */}
        <FormSection title="Courier & Destination" icon={Package}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Courier preference" required>
              <div className="grid grid-cols-2 gap-2">
                {COURIERS.map(([v, l]) => (
                  <label key={v} className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm",
                    form.courier_preference === v
                      ? "border-blue-500 bg-blue-50 text-blue-800 font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  )}>
                    <input type="radio" name="courier" value={v} className="sr-only"
                      checked={form.courier_preference === v}
                      onChange={() => set("courier_preference", v)} />
                    <span className={cn("w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all",
                      form.courier_preference === v ? "border-blue-500 bg-blue-500" : "border-gray-300")} />
                    {l}
                  </label>
                ))}
              </div>
            </Field>

            <div className="space-y-4">
              <Field label="Destination country" required error={errors.destination_country}>
                <div className="relative">
                  <select className={cn("select pr-8", errors.destination_country && "border-red-400")}
                    value={form.destination_country} onChange={(e) => set("destination_country", e.target.value)}>
                    <option value="">Select country…</option>
                    {COMMON_DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </Field>

              <Field label="Destination institution / body" hint="e.g. PEBC, WES, University of Toronto">
                <input type="text" className="input" placeholder="e.g. Pharmacy Examining Board of Canada"
                  maxLength={200} value={form.destination_institution}
                  onChange={(e) => set("destination_institution", e.target.value)} />
              </Field>
            </div>
          </div>

          <Field label="Preferred send date" required error={errors.preferred_send_date}
            hint="When do you want to drop off the shipment?">
            <input type="date" className={cn("input", errors.preferred_send_date && "border-red-400")}
              min={today} value={form.preferred_send_date}
              onChange={(e) => set("preferred_send_date", e.target.value)} />
          </Field>

          <Field label="Additional notes">
            <textarea rows={3} className="input resize-none"
              placeholder="Any extra details that could help with matching, e.g. flexible on date, prefer weekday drop-off, documents already sealed…"
              maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">{form.notes.length}/500</p>
          </Field>
        </FormSection>

        {/* === PRIVATE CONTACT === */}
        <FormSection title="Your Contact Details" icon={Phone}>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-600" />
            <span>
              <strong>Private & secure.</strong> Your full name and WhatsApp number are
              <strong> never shown publicly</strong>. They are revealed only to your matched
              partner after both of you pay the connection fee.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required error={errors.full_name_private}
              hint="Your real name — shared only with your match after payment">
              <input type="text" className={cn("input", errors.full_name_private && "border-red-400")}
                placeholder="e.g. Adaeze Okafor" maxLength={100}
                value={form.full_name_private} onChange={(e) => set("full_name_private", e.target.value)} />
            </Field>

            <Field label="WhatsApp number" required error={errors.whatsapp_number}
              hint="Include country code e.g. +2348012345678">
              <input type="tel" className={cn("input", errors.whatsapp_number && "border-red-400")}
                placeholder="+2348012345678" maxLength={15}
                value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
            </Field>
          </div>

          <Field label="Email address" hint="Optional — shared with your match alongside WhatsApp">
            <input type="email" className="input" placeholder="you@example.com" maxLength={254}
              value={form.email_private} onChange={(e) => set("email_private", e.target.value)} />
          </Field>
        </FormSection>

        {/* === AGREEMENTS === */}
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-gray-900 text-sm uppercase tracking-wide">Confirm & Agree</h3>

          <label className={cn(
            "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
            errors.confirm_correct ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-blue-300"
          )}>
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-blue-600"
              checked={form.confirm_correct}
              onChange={(e) => set("confirm_correct", e.target.checked)} />
            <span className="text-sm text-gray-700">
              <strong>I confirm</strong> that all the information I&apos;ve entered is accurate and truthful.
              I understand that inaccurate listings may result in account suspension.
            </span>
          </label>
          {errors.confirm_correct && <p className="form-error text-xs">{errors.confirm_correct}</p>}

          <label className={cn(
            "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
            errors.agree_terms ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-blue-300"
          )}>
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-blue-600"
              checked={form.agree_terms}
              onChange={(e) => set("agree_terms", e.target.checked)} />
            <span className="text-sm text-gray-700">
              I agree to SplitSend&apos;s{" "}
              <a href="/terms" target="_blank" className="text-blue-600 underline font-medium">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" className="text-blue-600 underline font-medium">Privacy Policy</a>.
              I understand SplitSend only facilitates matching and is not responsible for any courier shipment.
            </span>
          </label>
          {errors.agree_terms && <p className="form-error text-xs">{errors.agree_terms}</p>}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-primary w-full justify-center py-4 text-base shadow-blue-glow">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Posting your request…
            </span>
          ) : (
            <><FileText className="w-5 h-5" /> Post Request &amp; Find Partner</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your request will appear in browse immediately. Connection fee only charged when you match.
        </p>
      </form>
    </div>
  );
}
