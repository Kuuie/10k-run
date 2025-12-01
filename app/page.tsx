import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SignInForm } from "@/components/sign-in-form";

export default async function Home({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createServerSupabaseClient();
  const token =
    (typeof searchParams?.code === "string" && searchParams?.code) ||
    (typeof searchParams?.token === "string" && searchParams?.token) ||
    (typeof searchParams?.token_hash === "string" && searchParams?.token_hash);

  if (token) {
    await supabase.auth.exchangeCodeForSession(token);
    const next =
      (typeof searchParams?.next === "string" && searchParams?.next) ||
      "/dashboard";
    redirect(next);
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 rounded-3xl bg-white px-8 py-12 shadow-sm sm:px-12 sm:py-14 animate-fade-in">
        <div className="flex flex-col gap-4 animate-slide-up">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 delay-1">
            Team Challenge
          </span>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl animate-slide-up delay-2">
            10K Weekly Movement Challenge
          </h1>
          <p className="max-w-3xl text-lg text-slate-600 animate-slide-up delay-3">
            Run, walk, or jog 10 km every week. Track your streaks, share proof,
            and stay accountable with your crew.
          </p>
          {session?.user && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 animate-slide-up delay-4">
              Signed in. Head to your{" "}
              <Link href="/dashboard" className="font-semibold text-indigo-600">
                dashboard
              </Link>
              .
            </div>
          )}
        </div>

        {!session?.user && <div className="animate-slide-up delay-2"><SignInForm /></div>}

        <div className="grid gap-4 sm:grid-cols-3 animate-slide-up delay-3">
          {[
            "Track weekly totals and streaks automatically",
            "Upload proof via links or screenshots",
            "Admin invite-only access with overrides",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm"
            >
              ✅ {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
