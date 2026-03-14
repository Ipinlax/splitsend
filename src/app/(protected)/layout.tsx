import { redirect } from "next/navigation";
import { getServerUserWithProfile } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userWithProfile = await getServerUserWithProfile();

  if (!userWithProfile) {
    redirect("/login");
  }

  return (
    <>
      <Navbar
        user={{
          email: userWithProfile.user.email ?? "",
          id: userWithProfile.user.id,
        }}
      />
      <main className="min-h-screen bg-gray-50">{children}</main>
      <Footer />
    </>
  );
}
