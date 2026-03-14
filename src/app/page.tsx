import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import LandingPage from "@/components/landing/LandingPage";
import { getServerUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerUser();

  return (
    <>
      <Navbar user={user ? { email: user.email ?? "", id: user.id } : null} />
      <LandingPage />
      <Footer />
    </>
  );
}
