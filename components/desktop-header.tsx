"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

type DesktopHeaderProps = {
  isAdmin: boolean;
  initials: string;
  signOutAction: () => Promise<void>;
};

export function DesktopHeader({ isAdmin, initials, signOutAction }: DesktopHeaderProps) {
  return (
    <header className="sticky top-0 z-50 hidden border-b border-cream-dark bg-cream/80 backdrop-blur-xl md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-xs font-bold text-white">
              10K
            </div>
            <span className="font-semibold text-olive">Challenge</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-olive/70 hover:bg-sage-light/50 hover:text-olive"
            >
              Dashboard
            </Link>
            <Link
              href="/stats"
              className="rounded-lg px-3 py-2 text-sm font-medium text-olive/70 hover:bg-sage-light/50 hover:text-olive"
            >
              Stats
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-olive/70 hover:bg-sage-light/50 hover:text-olive"
            >
              Leaderboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-olive/70 hover:bg-sage-light/50 hover:text-olive"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/activities/new"
            className="rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage-dark"
          >
            + Log Activity
          </Link>
          <ThemeToggle />
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-light text-sm font-medium text-sage-dark hover:bg-sage/30"
          >
            {initials}
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-olive/60 hover:bg-sage-light/50 hover:text-olive"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
