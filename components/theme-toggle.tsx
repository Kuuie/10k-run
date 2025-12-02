'use client';

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { SunIcon, MoonIcon } from "@/components/icons";

const THEME_KEY = "theme-preference";
type Theme = "light" | "dark";

const setDocumentTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  if (theme === "dark") {
    root.classList.add("dark");
    body.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    body.classList.remove("dark");
    root.removeAttribute("data-theme");
  }
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored =
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem(THEME_KEY) as Theme | null)
        : null) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(stored);
    setDocumentTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
    }
    setDocumentTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        "flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100",
        "dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {theme === "dark" ? (
        <>
          <SunIcon className="h-4 w-4" /> Light
        </>
      ) : (
        <>
          <MoonIcon className="h-4 w-4" /> Dark
        </>
      )}
    </button>
  );
};
