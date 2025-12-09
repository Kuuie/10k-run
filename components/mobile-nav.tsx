'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

export function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/stats", label: "Stats", icon: "insights" },
    { href: "/leaderboard", label: "Board", icon: "leaderboard" },
    { href: "/profile", label: "Profile", icon: "person" },
  ];

  if (isAdmin) {
    links.push({ href: "/admin", label: "Admin", icon: "settings" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream-dark bg-cream/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2 pb-safe">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-sage-dark" : "text-olive/50 hover:text-olive"
              }`}
            >
              <Icon name={link.icon} className={`text-2xl ${isActive ? "" : ""}`} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
