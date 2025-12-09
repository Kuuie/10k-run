import { redirect } from "next/navigation";
import { requireSession, fetchProfile } from "@/lib/auth";
import { updateProfileAction } from "@/app/actions";
import { PasswordSetupForm } from "@/components/password-setup-form";

export default async function ProfilePage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  if (!profile) redirect("/");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dark">
          Profile
        </p>
        <h1 className="text-3xl font-semibold text-olive">Your details</h1>
        <p className="text-olive/70">
          Manage your profile and login settings.
        </p>
      </div>

      <form
        action={updateProfileAction}
        className="space-y-4 rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-1"
      >
        <h2 className="text-lg font-medium text-olive">Basic Info</h2>
        <label className="flex flex-col gap-2 text-sm font-medium text-olive">
          Name
          <input
            name="name"
            defaultValue={profile.name ?? ""}
            placeholder="e.g. Andrew"
            className="rounded-xl border border-cream-dark bg-background px-4 py-3 text-base text-olive"
          />
        </label>
        <div className="text-sm text-olive/60">Email: {profile.email}</div>
        <button
          type="submit"
          className="rounded-xl bg-sage px-5 py-2 text-white transition hover:bg-sage-dark"
        >
          Save profile
        </button>
      </form>

      <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-2">
        <h2 className="mb-1 text-lg font-medium text-olive">Password Login</h2>
        <p className="mb-4 text-sm text-olive/70">
          Set up a password to sign in without a magic link. You can use either method after setting this up.
        </p>
        <PasswordSetupForm />
      </div>
    </div>
  );
}
