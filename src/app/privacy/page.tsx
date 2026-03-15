import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getServerUser } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants";

export const metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
};

export default async function PrivacyPage() {
  const user = await getServerUser();
  return (
    <>
      <Navbar user={user ? { email: user.email ?? "", id: user.id } : null} />
      <main className="min-h-screen bg-white py-16">
        <div className="page-container max-w-3xl">
          <h1 className="font-display font-bold text-4xl text-gray-950 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="space-y-8 text-sm leading-relaxed text-gray-700">
            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Data We Collect</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account:</strong> Email address and optional phone number on signup</li>
                <li><strong>Request:</strong> First name, profession, location (state/city), destination country, preferred send date, courier preference, document type, notes</li>
                <li><strong>Private contact:</strong> Full name and WhatsApp number — stored encrypted, revealed only after verified mutual payment</li>
                <li><strong>Payment:</strong> Flutterwave transaction references and status (we never store card details)</li>
                <li><strong>Support messages:</strong> Name, WhatsApp, email, and message content you submit voluntarily</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">How We Use Your Data</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Matching you with compatible document-sending partners</li>
                <li>Processing and verifying your ₦2,000 connection fee via Flutterwave</li>
                <li>Revealing contact details only after both parties' payments are confirmed</li>
                <li>Sending in-app notifications about your matches</li>
                <li>Responding to support requests</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Data Minimization</h2>
              <p>Your WhatsApp number and full name are <strong>never shown publicly</strong>. They are stored securely and only revealed to one specific matched user after both payments are verified by our server. Public listings show only first name, profession, city, state, category, and destination — never contact details.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Third Parties</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Flutterwave:</strong> Handles payment processing. See <a href="https://flutterwave.com/us/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Flutterwave Privacy Policy</a></li>
                <li><strong>Supabase:</strong> Hosts our database with Row Level Security policies</li>
                <li>We do not sell or share your data with advertisers</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Your Rights</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>You may delete your requests at any time from your dashboard</li>
                <li>To request full account deletion, contact admin on WhatsApp</li>
                <li>You may request a copy of your data by contacting support</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Contact</h2>
              <p>Privacy questions: <a href="https://wa.me/2348168543901" className="text-blue-600 underline">wa.me/2348168543901</a> or via our <a href="/support" className="text-blue-600 underline">support page</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
