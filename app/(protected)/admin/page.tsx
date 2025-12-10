import { redirect } from "next/navigation";
import {
  inviteUserAction,
  overrideWeeklyResultAction,
  toggleUserActiveAction,
  excuseWeekAction,
} from "@/app/actions";
import { requireSession, fetchProfile } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  if (profile?.role !== "admin") redirect("/dashboard");

  const challenge = await getActiveChallenge(supabase);
  // Wrap invite action to satisfy form typing (ignore returned payload).
  const inviteAction = async (formData: FormData) => {
    "use server";
    await inviteUserAction(formData);
  };

  let users: any[] = [];
  let weeklyResults: any[] = [];
  let recentActivities: any[] = [];
  try {
    const adminClient = createAdminSupabaseClient();
    const [u, w, a] = await Promise.all([
      adminClient
        .from("users")
        .select("id, email, name, role, active, created_at")
        .order("created_at", { ascending: false }),
      adminClient
        .from("weekly_results")
        .select(
          "id, user_id, week_start_date, week_end_date, total_distance_km, met_target, overridden_by_admin, excused, rollover_km, users(name,email)"
        )
        .eq("challenge_id", challenge.id)
        .order("week_start_date", { ascending: false })
        .limit(30),
      adminClient
        .from("activities")
        .select(
          "id, user_id, activity_date, distance_km, duration_minutes, activity_type, created_at, users(name,email)"
        )
        .eq("challenge_id", challenge.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (u.error) throw u.error;
    if (w.error) throw w.error;
    if (a.error) throw a.error;
    users = u.data ?? [];
    weeklyResults = w.data ?? [];
    recentActivities = a.data ?? [];
  } catch (err) {
    console.error("Admin data load failed", err);
  }

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dark">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-olive">Control panel</h1>
        <p className="text-olive/70">
          Manage users, invites, and weekly overrides.
        </p>
      </div>

      <section className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-olive">Invite user</h2>
          <span className="text-xs text-olive/60">
            Sends Supabase magic link invite
          </span>
        </div>
        <form
          action={inviteAction}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="user@company.com"
            className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
          />
          <input
            type="text"
            name="name"
            placeholder="Name (optional)"
            className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
          />
          <button
            type="submit"
            className="rounded-xl bg-sage px-4 py-2 text-white transition hover:bg-sage-dark"
          >
            Send invite
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-olive">Users</h2>
          <span className="text-xs text-olive/60">Toggle active/inactive</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-cream-dark">
          <table className="min-w-full divide-y divide-cream-dark text-sm">
            <thead className="bg-sage-light/50 text-left text-xs font-semibold uppercase tracking-wide text-olive">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark bg-cream">
              {(users ?? []).map((u) => {
                const userRow = u as any;
                const toggleAction = async () => {
                  "use server";
                  await toggleUserActiveAction(userRow.id, !userRow.active);
                };
                return (
                  <tr key={userRow.id}>
                    <td className="px-4 py-3 font-medium text-olive">
                      {userRow.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-olive">{userRow.email}</td>
                    <td className="px-4 py-3 text-olive">{userRow.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          userRow.active
                            ? "bg-sage-light text-sage-dark"
                            : "bg-cream-dark text-olive/60"
                        }`}
                      >
                        {userRow.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-sage-dark"
                        >
                          Set {userRow.active ? "inactive" : "active"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {(users ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-olive/60"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-olive">Recent activities</h2>
          <span className="text-xs text-olive/60">Latest 50 entries</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-cream-dark">
          <table className="min-w-full divide-y divide-cream-dark text-sm">
            <thead className="bg-sage-light/50 text-left text-xs font-semibold uppercase tracking-wide text-olive">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Logged at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark bg-cream">
              {recentActivities.map((act) => {
                const a = act as any;
                const user = a.users;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-olive">
                      <div className="flex flex-col">
                        <span>{user?.name || user?.email || "User"}</span>
                        <span className="text-xs text-olive/60">
                          {user?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-olive">{a.activity_date}</td>
                    <td className="px-4 py-3 text-olive">
                      {Number(a.distance_km ?? 0).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3 text-olive">
                      {a.duration_minutes ? `${a.duration_minutes} min` : "—"}
                    </td>
                    <td className="px-4 py-3 uppercase text-olive">
                      {a.activity_type || "run"}
                    </td>
                    <td className="px-4 py-3 text-olive/60 text-xs">
                      {a.created_at?.replace("T", " ").replace("Z", "")}
                    </td>
                  </tr>
                );
              })}
              {recentActivities.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-olive/60"
                  >
                    No activities yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-cream-dark bg-cream p-4 sm:p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-olive">Weekly Results</h2>
          <span className="text-xs text-olive/60">
            Override or excuse weeks
          </span>
        </div>

        <div className="space-y-3">
          {(weeklyResults ?? []).map((wr) => {
            const wrRow = wr as any;
            const setTrue = async () => {
              "use server";
              await overrideWeeklyResultAction(wrRow.id, true);
            };
            const setFalse = async () => {
              "use server";
              await overrideWeeklyResultAction(wrRow.id, false);
            };
            const excuseAction = async () => {
              "use server";
              await excuseWeekAction(wrRow.id, true);
            };
            const unexcuseAction = async () => {
              "use server";
              await excuseWeekAction(wrRow.id, false);
            };
            const user = wrRow.users;
            const isExcused = wrRow.excused;
            const rollover = Number(wrRow.rollover_km ?? 0);

            return (
              <div
                key={wrRow.id}
                className={`rounded-xl border p-3 ${
                  isExcused
                    ? "border-amber-300 bg-amber-50/50"
                    : wrRow.met_target
                    ? "border-sage bg-sage-light/30"
                    : "border-cream-dark bg-cream-dark/30"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-olive truncate">
                        {user?.name || user?.email || "User"}
                      </span>
                      {isExcused && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Excused
                        </span>
                      )}
                      {wrRow.overridden_by_admin && !isExcused && (
                        <span className="text-xs text-sage-dark">(overridden)</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-olive/70">
                      <span>{wrRow.week_start_date.slice(5)}</span>
                      <span className="font-medium text-olive">
                        {Number(wrRow.total_distance_km).toFixed(1)} km
                      </span>
                      <span>{wrRow.met_target ? "✅" : "❌"}</span>
                      {rollover > 0 && (
                        <span className="text-amber-600 text-xs">
                          +{rollover.toFixed(1)} km rollover
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isExcused ? (
                      <form action={unexcuseAction}>
                        <button className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                          Remove excuse
                        </button>
                      </form>
                    ) : (
                      <form action={excuseAction}>
                        <button className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                          Excuse week
                        </button>
                      </form>
                    )}
                    <form action={setTrue}>
                      <button className="rounded-lg bg-sage-light px-3 py-1.5 text-xs font-semibold text-sage-dark hover:bg-sage/30">
                        ✅
                      </button>
                    </form>
                    <form action={setFalse}>
                      <button className="rounded-lg bg-cream-dark px-3 py-1.5 text-xs font-semibold text-olive hover:bg-cream-dark/80">
                        ❌
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
          {(weeklyResults ?? []).length === 0 && (
            <div className="py-8 text-center text-olive/60">
              No weekly results yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
