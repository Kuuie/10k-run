"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

type MobileHeaderProps = {
  initials: string;
};

export function MobileHeader({ initials }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-cream-dark bg-cream/80 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage text-xs font-bold text-white">
            10K
          </div>
          <span className="font-semibold text-olive">Challenge</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/activities/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sage text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-light text-sm font-medium text-sage-dark"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
