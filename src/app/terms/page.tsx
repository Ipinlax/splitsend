import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getServerUser } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants";

export const metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: "SplitSend Terms of Service — understand your rights and obligations when using our platform.",
};

export default async function TermsPage() {
  const user = await getServerUser();

  return (
    <>
      <Navbar user={user ? { email: user.email ?? "", id: user.id } : null} />
      <main className="min-h-screen bg-white py-16">
        <div className="page-container max-w-3xl">
          <h1 className="font-display font-bold text-4xl text-gray-950 mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">1. About SplitSend</h2>
              <p>SplitSend is a matching platform that connects individuals in Nigeria who need to send physical documents abroad via courier services (DHL, UPS, FedEx, or similar). SplitSend is <strong>not a courier company</strong>. We do not handle, book, insure, or guarantee any shipment.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">2. The Connection Fee</h2>
              <p>SplitSend charges a <strong>₦2,000 connection fee per user</strong> to reveal matched partner contact details. This fee covers platform operation and matching services only. Both users must pay before contact details are revealed. The connection fee is separate from and does not include courier or shipping costs.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">3. No Shipping Liability</h2>
              <p>SplitSend is not responsible for:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Lost, delayed, or damaged shipments</li>
                <li>Courier company failures or refusals</li>
                <li>Immigration, customs, or regulatory issues with documents</li>
                <li>Disputes between matched users about shipment arrangements</li>
                <li>Any outcome of the physical document delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">4. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and truthful information in your requests</li>
                <li>Coordinate shipment details directly with your matched partner</li>
                <li>Verify your documents meet courier and destination requirements</li>
                <li>Not send fraudulent, illegal, or prohibited items</li>
                <li>Contact SplitSend admin immediately via WhatsApp if problems arise</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">5. Prohibited Use</h2>
              <p>You may not use SplitSend to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Post fake or misleading requests</li>
                <li>Defraud matched partners</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Circumvent the connection fee system</li>
                <li>Create multiple accounts to game matching</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">6. Refunds</h2>
              <p>The ₦2,000 connection fee is generally non-refundable once both users' contact details have been revealed. If a technical issue prevents correct reveal, contact admin on WhatsApp immediately at <a href="https://wa.me/2348168543901" className="text-blue-600 underline">wa.me/2348168543901</a>. Refund decisions are at the sole discretion of SplitSend admin.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">7. Account Suspension</h2>
              <p>SplitSend reserves the right to suspend or delete accounts that violate these terms, post fraudulent listings, receive multiple verified reports, or engage in abusive behavior.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">8. Contact</h2>
              <p>For any questions, disputes, or support needs, contact admin via WhatsApp: <a href="https://wa.me/2348168543901" className="text-blue-600 underline">wa.me/2348168543901</a> or through our <a href="/support" className="text-blue-600 underline">support page</a>.</p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
