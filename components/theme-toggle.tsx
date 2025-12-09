"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        setResolvedTheme("light");
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const cycleTheme = () => {
    // Cycle: system -> dark -> light -> system
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-olive/70"
        title="Theme"
      >
        <span className="material-icons-round text-lg">light_mode</span>
        <span className="hidden text-xs sm:inline">Light</span>
      </button>
    );
  }

  const icon = resolvedTheme === "dark" ? "dark_mode" : "light_mode";
  const label = theme === "system" ? "Auto" : theme === "dark" ? "Dark" : "Light";

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-olive/70 transition hover:bg-sage-light/50 hover:text-olive"
      title={`Theme: ${label}`}
    >
      <span className="material-icons-round text-lg">{icon}</span>
      <span className="hidden text-xs sm:inline">{label}</span>
    </button>
  );
}
