import Link from "next/link";
import { Package } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Split<span className="text-blue-600">Send</span>
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer note */}
      <div className="p-6 text-center text-xs text-gray-400">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
      </div>
    </div>
  );
}
