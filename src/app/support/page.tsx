import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import SupportForm from "@/components/SupportForm";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { getServerUser } from "@/lib/supabase/server";
import { MessageSquare, Clock, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Contact Admin | SplitSend",
  description: "Get help from SplitSend admin. Report issues, payment problems, or ask any question.",
};

export default async function SupportPage() {
  const user = await getServerUser();

  return (
    <>
      <Navbar user={user ? { email: user.email ?? "", id: user.id } : null} />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="page-container max-w-5xl">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Admin typically responds within 1 hour
            </div>
            <h1 className="font-display font-bold text-4xl text-gray-950 mb-3">
              Contact Admin
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Have a payment issue, match problem, or general question? Reach out directly
              via WhatsApp for the fastest response, or fill the form below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: WhatsApp + trust info */}
            <div className="space-y-6">

              {/* WhatsApp CTA card */}
              <div className="bg-gradient-to-br from-[#25D366]/10 to-[#20bd5a]/5 border-2 border-[#25D366]/30 rounded-2xl p-6">
                <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-4">
                  <WaIconLarge />
                </div>
                <h3 className="font-display font-bold text-gray-900 mb-1">WhatsApp (Fastest)</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Get an instant response from admin. Available 7am–10pm daily.
                </p>
                <WhatsAppButton
                  size="md"
                  variant="primary"
                  label="Chat Admin on WhatsApp"
                  message="Hello SplitSend Admin, I need help with:"
                  fullWidth
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Opens WhatsApp · +2348168543901
                </p>
              </div>

              {/* Trust points */}
              <div className="card p-5 space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">What we can help with</h4>
                {[
                  { icon: MessageSquare, text: "Payment not confirmed after deduction" },
                  { icon: ShieldCheck, text: "Partner not responding after payment" },
                  { icon: HelpCircle, text: "Wrong contact details revealed" },
                  { icon: Clock, text: "Match expired or needs extension" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{text}</p>
                  </div>
                ))}
              </div>

              {/* Trust notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong className="block mb-1">🔒 Your data is safe</strong>
                Admin can only see information you choose to share in your message. Your WhatsApp
                number and contact details are never exposed without your consent.
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-2">
              <SupportForm userId={user?.id ?? null} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function WaIconLarge() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
