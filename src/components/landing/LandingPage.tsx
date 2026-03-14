import Link from "next/link";
import {
  ArrowRight, Package, MapPin, Shield, Zap, Users, CheckCircle,
  ChevronDown, Star, AlertTriangle, Clock, Globe, FileText,
  CreditCard, MessageCircle, Building, GraduationCap, Briefcase
} from "lucide-react";
import { CATEGORY_LABELS, PROFESSION_LABELS, COURIER_LABELS } from "@/constants";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Post Your Request",
    desc: "Tell us where you are, what documents you're sending, and your destination. It takes 2 minutes.",
    icon: FileText,
    color: "blue",
  },
  {
    step: "02",
    title: "Get Matched",
    desc: "Our smart algorithm finds people in your city sending documents to the same destination around the same time.",
    icon: Users,
    color: "green",
  },
  {
    step: "03",
    title: "Pay ₦2,000 Each",
    desc: "Both parties pay a small ₦2,000 connection fee. When both have paid, contact details are revealed.",
    icon: CreditCard,
    color: "blue",
  },
  {
    step: "04",
    title: "Coordinate & Save",
    desc: "Connect via WhatsApp, agree on a pickup point, and book the courier together. Split the cost.",
    icon: MessageCircle,
    color: "green",
  },
];

const CATEGORIES = [
  { key: "pebc", icon: "💊", desc: "Pharmacy Examining Board of Canada documents" },
  { key: "wes", icon: "🎓", desc: "World Education Services credential evaluation" },
  { key: "transcript", icon: "📄", desc: "University transcripts for foreign institutions" },
  { key: "licensing_body", icon: "🏛️", desc: "Professional licensing body submissions" },
  { key: "school_admission", icon: "🏫", desc: "Admission documents for foreign schools" },
  { key: "embassy_immigration", icon: "🌍", desc: "Embassy and immigration-related papers" },
];

const TRUST_POINTS = [
  { icon: Shield, title: "Secure Payments", desc: "All payments processed via Paystack — Nigeria's trusted gateway." },
  { icon: MapPin, title: "Location-Based", desc: "Match with people in your city first. No guesswork." },
  { icon: Zap, title: "Fast Matching", desc: "Smart algorithm finds your best match in seconds." },
  { icon: CheckCircle, title: "Verified Payments", desc: "Contact details only revealed after both parties pay." },
];

const FAQS = [
  {
    q: "What documents can I send through SplitSend?",
    a: "PEBC applications, WES documents, university transcripts, licensing body submissions, embassy documents, school admissions — any physical documents sent abroad via courier.",
  },
  {
    q: "How does the ₦2,000 connection fee work?",
    a: "Both you and your match each pay ₦2,000 to SplitSend. Once both payments are confirmed, we reveal each other's WhatsApp number so you can coordinate the actual shipment.",
  },
  {
    q: "Does SplitSend handle the courier booking?",
    a: "No. SplitSend only connects you with a matching partner. You and your match coordinate the actual DHL/UPS/FedEx booking yourselves and split that cost directly.",
  },
  {
    q: "What if my match doesn't pay?",
    a: "If your partner doesn't pay within a reasonable time, you can cancel the match and connect with another user. Contact support for a refund review.",
  },
  {
    q: "Is my personal data safe?",
    a: "Your WhatsApp number and full name are never shown publicly. They are only revealed to your specific match after BOTH payments are verified — never before.",
  },
  {
    q: "How much can I save?",
    a: "DHL costs to Canada can be ₦60,000–₦120,000 depending on weight. Splitting this means you each pay ₦30,000–₦60,000 instead. Even after the ₦2,000 connection fee, the savings are significant.",
  },
];

const STATS = [
  { value: "₦50k+", label: "Avg savings per user" },
  { value: "48hrs", label: "Average match time" },
  { value: "Lagos • Abuja • PH", label: "Key cities covered" },
  { value: "100%", label: "Paystack secured" },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center bg-hero-mesh overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-green-100 rounded-full opacity-30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full opacity-50 blur-3xl" />
        </div>

        <div className="page-container relative z-10 py-20">
          <div className="max-w-4xl">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 animate-fade-up">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Built for Nigerians sending documents abroad
            </div>

            {/* Headline */}
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-gray-950 leading-[1.05] tracking-tight text-balance mb-6 animate-fade-up animation-delay-100">
              Split courier costs{" "}
              <span className="relative inline-block">
                <span className="text-blue-600">with someone</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6 Q100 2 198 6" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </span>{" "}
              near you
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl leading-relaxed mb-10 animate-fade-up animation-delay-200">
              Find someone in your city who also needs to send documents abroad.
              Share a DHL or FedEx shipment. Split the cost. Both save thousands of naira.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-14 animate-fade-up animation-delay-300">
              <Link href="/browse" className="btn-primary text-base px-8 py-3.5 shadow-blue-glow">
                <Users className="w-5 h-5" />
                Find a Partner
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/post-request" className="btn-secondary text-base px-8 py-3.5">
                <FileText className="w-5 h-5" />
                Post My Request
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 animate-fade-up animation-delay-400">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-gray-900">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ===== DISCLAIMER BANNER ===== */}
      <div className="bg-amber-50 border-y border-amber-200 py-3">
        <div className="page-container flex items-center gap-3 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <p>
            <strong>Disclaimer:</strong> SplitSend only connects users for cost-sharing. We are not a courier
            company and do not handle, insure, or guarantee any shipment. Always verify your documents&apos; requirements independently.
          </p>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Simple Process</p>
            <h2 className="font-display font-bold text-4xl text-gray-950 mb-4">How SplitSend Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From posting your request to connecting with a partner — it takes under 5 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-10" />
                )}
                <div className="card p-6 h-full hover:-translate-y-1 transition-transform duration-300">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    step.color === "blue" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    <step.icon className={`w-6 h-6 ${step.color === "blue" ? "text-blue-600" : "text-green-600"}`} />
                  </div>
                  <div className="text-xs font-bold text-gray-300 font-mono mb-2">{step.step}</div>
                  <h3 className="font-display font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SUPPORTED CATEGORIES ===== */}
      <section id="categories" className="py-24 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Supported Use Cases</p>
            <h2 className="font-display font-bold text-4xl text-gray-950 mb-4">What Documents Can You Send?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              SplitSend started with pharmacists sending PEBC documents — but supports any professional sending physical documents abroad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="card p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200">
                <div className="text-3xl">{cat.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 font-display mb-1">
                    {CATEGORY_LABELS[cat.key] ?? cat.key}
                  </h3>
                  <p className="text-sm text-gray-500">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Also: school admission letters, general document courier, and more.
          </p>
        </div>
      </section>

      {/* ===== WHY SPLITSEND ===== */}
      <section id="why" className="py-24 bg-white">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-3">Why SplitSend</p>
              <h2 className="font-display font-bold text-4xl text-gray-950 mb-6 leading-tight">
                Send smarter.<br />Save money.<br />Stay safe.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Courier costs to Canada, UK, or the US can be overwhelming. SplitSend finds
                someone going the same route, so you both pay half — without the risk.
              </p>
              <div className="space-y-4">
                {TRUST_POINTS.map((point) => (
                  <div key={point.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{point.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="card p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="badge-blue text-xs">Active Request</div>
                  <div className="text-xs text-gray-400">Lagos • DHL • Canada</div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">A</div>
                    <div>
                      <div className="font-semibold text-sm">Adaeze • Pharmacist</div>
                      <div className="text-xs text-gray-500">PEBC → Canada • DHL</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-800 text-sm">E</div>
                    <div>
                      <div className="font-semibold text-sm">Emeka • Student</div>
                      <div className="text-xs text-gray-500">WES → Canada • Any</div>
                    </div>
                    <div className="badge-green text-xs ml-auto">Match!</div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-xs text-green-700 font-semibold mb-1">💰 Estimated Savings</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">DHL to Canada</span>
                    <span className="font-bold text-gray-900">~₦80,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Each pays (split)</span>
                    <span className="font-bold text-green-700">~₦40,000</span>
                  </div>
                  <div className="border-t border-green-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                    <span>You save</span>
                    <span className="text-green-700">₦38,000</span>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white rounded-2xl px-4 py-2 text-sm font-bold shadow-blue-glow">
                ₦2,000 fee only
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOCATION SECTION ===== */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="page-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-display font-bold text-3xl mb-2">Available across Nigeria</h2>
              <p className="text-blue-200 max-w-lg">
                Lagos, Abuja, Port Harcourt, Ibadan, Kano, Enugu — wherever you are,
                find matches in your state and city.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Anambra", "Enugu", "Delta"].map((s) => (
                <span key={s} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  📍 {s}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                + 29 more states
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 bg-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="font-display font-bold text-4xl text-gray-950 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group card border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 bg-gray-950 text-white">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-6">
            <Package className="w-3.5 h-3.5" />
            Free to browse. Pay only when you connect.
          </div>
          <h2 className="font-display font-bold text-5xl mb-6 text-balance">
            Ready to split your<br />courier cost?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Post your request or browse existing matches. It&apos;s free to sign up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/browse" className="btn-secondary text-base px-8 py-3.5 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              Browse Requests
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="page-container">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Have a question?</h3>
            <p className="text-gray-500 mb-6">
              Get instant help from admin on WhatsApp, or fill our support form for detailed issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/2348168543901?text=Hello%20SplitSend%20Admin%2C%20I%20have%20a%20question."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95 text-sm shadow-sm"
              >
                <WaIconInline /> Chat Admin on WhatsApp
              </a>
              <a href="/support" className="btn-secondary">
                <Mail className="w-4 h-4" />
                Contact Form
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              If you have any problem, contact admin on WhatsApp immediately.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function WaIconInline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Mail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
