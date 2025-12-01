import { redirect } from "next/navigation";
import {
  inviteUserAction,
  overrideWeeklyResultAction,
  toggleUserActiveAction,
} from "@/app/actions";
import { requireSession, fetchProfile } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";

export default async function AdminPage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  if (profile?.role !== "admin") redirect("/dashboard");

  const challenge = await getActiveChallenge(supabase);

  // Wrap server action to satisfy form action typing (drop returned payload).
  const inviteAction = async (formData: FormData) => {
    await inviteUserAction(formData);
  };

  const [{ data: users }, { data: weeklyResults }] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase
      .from("weekly_results")
      .select("*, users(name,email)")
      .eq("challenge_id", challenge.id)
      .order("week_start_date", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">
          Admin
        </p>
        <h1 className="text-3xl font-semibold">Control panel</h1>
        <p className="text-slate-600">
          Manage users, invites, and weekly overrides.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                const toggleAction = toggleUserActiveAction.bind(
                  null,
                  userRow.id,
                  !userRow.active
                );
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                const setTrue = overrideWeeklyResultAction.bind(
                  null,
                  wr.id,
                  true
                );
                const setFalse = overrideWeeklyResultAction.bind(
                  null,
                  wr.id,
                  false
                );
                const user = (wr as any).users;
                return (
                  <tr key={wr.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user?.name || user?.email || "User"}
                    </td>
                    <td className="px-4 py-3">
                      {wr.week_start_date} → {wr.week_end_date}
                    </td>
                    <td className="px-4 py-3">
                      {Number(wr.total_distance_km).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3">
                      {wr.met_target ? "✅" : "❌"}
                      {wr.overridden_by_admin && (
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
