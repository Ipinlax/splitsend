import Link from "next/link";
import { Package, Twitter, Linkedin, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/constants";
import WhatsAppButton from "./WhatsAppButton";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand + disclaimer */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                Split<span className="text-blue-400">Send</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs">
              Nigeria&apos;s platform for splitting courier costs on document shipments abroad.
              Save money. Send together.
            </p>

            <div className="bg-amber-900/30 border border-amber-700/40 text-amber-400 rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              SplitSend only facilitates user matching. We are not a courier company and do
              not handle, insure, or guarantee any shipment.
            </div>

            {/* WhatsApp trust notice */}
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
              <p className="text-xs text-green-300 mb-3 font-medium">
                If you have any problem, contact admin on WhatsApp immediately.
              </p>
              <WhatsAppButton
                size="sm"
                variant="primary"
                label="Chat Admin on WhatsApp"
                message="Hello SplitSend Admin, I need help."
              />
            </div>

            <div className="flex gap-3 pt-1">
              <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/browse", label: "Find Partner" },
                { href: "/post-request", label: "Post Request" },
                { href: "/dashboard", label: "My Dashboard" },
                { href: "/login", label: "Sign In" },
                { href: "/signup", label: "Create Account" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support & Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/support" className="hover:text-white transition-colors">Contact Admin</Link>
              </li>
              <li>
                <a
                  href="https://wa.me/2348168543901"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400 transition-colors flex items-center gap-1.5"
                >
                  <WaIcon /> WhatsApp Support
                </a>
              </li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved. Made with ❤️ in Nigeria.</p>
          <p>Payments secured by <span className="text-white font-medium">Paystack</span></p>
        </div>
      </div>
    </footer>
  );
}

function WaIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
