import { redirect } from "next/navigation";
import {
  inviteUserAction,
  overrideWeeklyResultAction,
  toggleUserActiveAction,
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
          "id, user_id, week_start_date, week_end_date, total_distance_km, met_target, overridden_by_admin, users(name,email)"
        )
        .eq("challenge_id", challenge.id)
        .order("week_start_date", { ascending: false })
        .limit(20),
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
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">
          Admin
        </p>
        <h1 className="text-3xl font-semibold">Control panel</h1>
        <p className="text-slate-600">
          Manage users, invites, and weekly overrides.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invite user</h2>
          <span className="text-xs text-slate-500">
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
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
          <input
            type="text"
            name="name"
            placeholder="Name (optional)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500"
          >
            Send invite
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Users</h2>
          <span className="text-xs text-slate-500">Toggle active/inactive</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(users ?? []).map((u) => {
                const userRow = u as any;
                const toggleAction = async () => {
                  "use server";
                  await toggleUserActiveAction(userRow.id, !userRow.active);
                };
                return (
                  <tr key={userRow.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {userRow.name || "—"}
                    </td>
                    <td className="px-4 py-3">{userRow.email}</td>
                    <td className="px-4 py-3">{userRow.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          userRow.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {userRow.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-indigo-600"
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
                    className="px-4 py-4 text-center text-slate-600"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activities</h2>
          <span className="text-xs text-slate-500">Latest 50 entries</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Logged at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentActivities.map((act) => {
                const a = act as any;
                const user = a.users;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>{user?.name || user?.email || "User"}</span>
                        <span className="text-xs text-slate-500">
                          {user?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{a.activity_date}</td>
                    <td className="px-4 py-3">
                      {Number(a.distance_km ?? 0).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3">
                      {a.duration_minutes ? `${a.duration_minutes} min` : "—"}
                    </td>
                    <td className="px-4 py-3 uppercase text-slate-700">
                      {a.activity_type || "run"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {a.created_at?.replace("T", " ").replace("Z", "")}
                    </td>
                  </tr>
                );
              })}
              {recentActivities.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-slate-600"
                  >
                    No activities yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weekly overrides</h2>
          <span className="text-xs text-slate-500">
            Flip met_target with admin override
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Met target</th>
                <th className="px-4 py-3">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
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
                const user = wrRow.users;
                return (
                  <tr key={wrRow.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user?.name || user?.email || "User"}
                    </td>
                    <td className="px-4 py-3">
                      {wrRow.week_start_date} → {wrRow.week_end_date}
                    </td>
                    <td className="px-4 py-3">
                      {Number(wrRow.total_distance_km).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3">
                      {wrRow.met_target ? "✅" : "❌"}
                      {wrRow.overridden_by_admin && (
                        <span className="ml-2 text-xs text-amber-600">
                          (overridden)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <form action={setTrue}>
                          <button className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Set ✅
                          </button>
                        </form>
                        <form action={setFalse}>
                          <button className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Set ❌
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(weeklyResults ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-slate-600"
                  >
                    No weekly results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
