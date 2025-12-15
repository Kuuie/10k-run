import { redirect } from "next/navigation";
import { requireSession, fetchProfile } from "@/lib/auth";
import { updateProfileAction, disconnectStravaAction } from "@/app/actions";
import { PasswordSetupForm } from "@/components/password-setup-form";
import { StravaConnectButton } from "@/components/strava-connect-button";
import { getStravaConnection } from "@/lib/strava";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ strava?: string }>;
}) {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  if (!profile) redirect("/");

  const stravaConnection = await getStravaConnection(supabase, userId);
  const params = await searchParams;
  const stravaStatus = params.strava;

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

      <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-3">
        <h2 className="mb-1 text-lg font-medium text-olive">Strava Integration</h2>
        <p className="mb-4 text-sm text-olive/70">
          Connect your Strava account to automatically import your activities.
        </p>

        {stravaStatus === "connected" && (
          <div className="mb-4 rounded-lg bg-sage-light/50 p-3 text-sm text-sage-dark">
            Successfully connected! Your recent activities have been imported.
          </div>
        )}

        {stravaStatus === "error" && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            Failed to connect to Strava. Please try again.
          </div>
        )}

        <StravaConnectButton
          isConnected={!!stravaConnection}
          connectedAt={stravaConnection?.created_at}
          onDisconnect={disconnectStravaAction}
        />
      </div>
    </div>
  );
}
