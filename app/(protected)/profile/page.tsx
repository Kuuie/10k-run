import { redirect } from "next/navigation";
import { requireSession, fetchProfile } from "@/lib/auth";
import { updateProfileAction } from "@/app/actions";

export default async function ProfilePage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  if (!profile) redirect("/");

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">
          Profile
        </p>
        <h1 className="text-3xl font-semibold">Your details</h1>
        <p className="text-slate-600">
          Set the name shown across dashboard and leaderboard.
        </p>
      </div>

      <form
        action={updateProfileAction}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Name
          <input
            name="name"
            defaultValue={profile.name ?? ""}
            placeholder="e.g. Andrew"
            className="rounded-xl border border-slate-200 px-4 py-3 text-base"
          />
        </label>
        <div className="text-sm text-slate-500">Email: {profile.email}</div>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2 text-white transition hover:bg-indigo-500"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
