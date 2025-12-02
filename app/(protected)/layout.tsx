import Link from "next/link";
import { redirectIfInactive } from "@/lib/challenge";
import { fetchProfile, requireSession } from "@/lib/auth";
import { signOutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { MicrotransactionButton } from "@/components/microtransaction-button";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  redirectIfInactive(profile);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-darkTheme-background dark:text-darkTheme-text-primary">
      <header className="border-b border-slate-200 bg-white dark:border-darkTheme-border dark:bg-darkTheme-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold hover:text-indigo-600">
              10K Weekly Challenge
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-darkTheme-text-secondary">
              <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-darkTheme-text-primary">
                Dashboard
              </Link>
              <Link href="/activities/new" className="hover:text-slate-900 dark:hover:text-darkTheme-text-primary">
                Add Activity
              </Link>
              <Link href="/leaderboard" className="hover:text-slate-900 dark:hover:text-darkTheme-text-primary">
                Leaderboard
              </Link>
              <Link href="/profile" className="hover:text-slate-900 dark:hover:text-darkTheme-text-primary">
                Profile
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-slate-900 dark:hover:text-darkTheme-text-primary">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 dark:text-darkTheme-text-secondary sm:inline">
              {profile?.name || profile?.email || "You"}
            </span>
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700 dark:bg-darkTheme-accent-primary dark:hover:bg-darkTheme-accent-primaryHover"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <MicrotransactionButton />
    </div>
  );
}
