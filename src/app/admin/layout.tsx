import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUserWithProfile, isAdminUserId } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  Flag, CreditCard, Settings, Package, LogOut
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const up = await getServerUserWithProfile();

  // Double-check admin server-side — never trust middleware alone
  if (!up || !isAdminUserId(up.user.id) || up.profile.role !== "admin") {
    logger.security.unauthorizedAccess(up?.user.id ?? null, "admin layout");
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/requests", label: "Requests", icon: FileText },
    { href: "/admin/matches", label: "Matches", icon: Package },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/messages", label: "Support Messages", icon: MessageSquare },
    { href: "/admin/reports", label: "Reports", icon: Flag },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm">SplitSend</span>
              <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors group"
            >
              <item.icon className="w-4 h-4 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-500 truncate">{up.user.email}</p>
            <span className="badge-blue text-[10px] mt-0.5">Admin</span>
          </div>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
