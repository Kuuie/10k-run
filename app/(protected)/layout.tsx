import { redirectIfInactive } from "@/lib/challenge";
import { fetchProfile, requireSession } from "@/lib/auth";
import { signOutAction } from "@/app/actions";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { MobileHeader } from "@/components/mobile-header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  redirectIfInactive(profile);

  const isAdmin = profile?.role === "admin";
  const userName = profile?.name || profile?.email?.split("@")[0] || "You";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <DesktopHeader isAdmin={isAdmin} initials={initials} signOutAction={signOutAction} />

      {/* Mobile Header */}
      <MobileHeader initials={initials} />

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
