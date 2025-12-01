import Link from "next/link";
import { requireSession, fetchProfile } from "@/lib/auth";
import {
  getActiveChallenge,
  getUserActivities,
  getUserWeeklyResults,
} from "@/lib/challenge";
import { calculateStreak, getWeekRange } from "@/lib/week";

const ProgressBar = ({ value, target }: { value: number; target: number }) => {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default async function DashboardPage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    profile?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "You";
  const challenge = await getActiveChallenge(supabase);
  const weeklyResults = await getUserWeeklyResults(
    supabase,
    userId,
    challenge.id,
    12
  );
  const activities = await getUserActivities(
    supabase,
    userId,
    challenge.id,
    8
  );

  const week = getWeekRange(new Date(), challenge.week_start_day);
  const thisWeek = weeklyResults.find(
    (w) => w.week_start_date === week.start.toISOString().slice(0, 10)
  );
  const totalKm = thisWeek?.total_distance_km ?? 0;
  const metTarget = thisWeek?.met_target ?? false;
  const streak = calculateStreak(
    weeklyResults.map((w) => ({
      week_start_date: w.week_start_date,
      met_target: w.met_target,
    })),
    new Date(challenge.start_date),
    challenge.week_start_day
  );

  const toGo = Math.max(0, Number(challenge.weekly_distance_target_km) - totalKm);
  const today = new Date();
  const dayPills = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week.start);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      isToday:
        d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 animate-slide-up">
          Hello, {displayName}
        </p>
        <h1 className="text-3xl font-semibold animate-slide-up delay-1">Dashboard</h1>
        <p className="text-slate-600 animate-slide-up delay-2">
          Track your weekly 10 km progress, streaks, and recent activities.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-900 shadow-sm animate-slide-up delay-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              This week
            </span>
            <span className="font-semibold">
              {week.start.toISOString().slice(0, 10)} →{" "}
              {week.end.toISOString().slice(0, 10)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dayPills.map((day) => (
              <span
                key={day.iso}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  day.isToday
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-indigo-700"
                }`}
              >
                {day.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 animate-slide-up delay-3">
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">This Week</p>
              <p className="text-2xl font-semibold">
                {totalKm.toFixed(1)} km / {challenge.weekly_distance_target_km} km
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                metTarget
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {metTarget ? "Goal reached ✅" : `${toGo.toFixed(1)} km to go`}
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={Number(totalKm)}
              target={Number(challenge.weekly_distance_target_km)}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>
              Week window: {week.start.toISOString().slice(0, 10)} →{" "}
              {week.end.toISOString().slice(0, 10)}
            </span>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500"
            >
              Add activity
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-4">
          <p className="text-sm font-medium text-slate-700">Current streak</p>
          <p className="mt-2 text-3xl font-semibold">{streak} week(s)</p>
          <p className="mt-1 text-sm text-slate-600">
            Consecutive weeks hitting {challenge.weekly_distance_target_km} km
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent weeks</h2>
            <span className="text-xs text-slate-500">
              ✅ met / ❌ missed
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {weeklyResults.slice(0, 8).map((weekResult) => (
              <div
                key={weekResult.week_start_date}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    Week of {weekResult.week_start_date}
                  </p>
                  <p className="text-xs text-slate-500">
                    Total: {Number(weekResult.total_distance_km).toFixed(1)} km
                  </p>
                </div>
                <span className="text-lg">
                  {weekResult.met_target ? "✅" : "❌"}
                </span>
              </div>
            ))}
            {weeklyResults.length === 0 && (
              <p className="text-sm text-slate-600">
                Log your first activity to start your streak.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activities</h2>
            <Link href="/activities/new" className="text-sm text-indigo-600">
              Add
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {activity.activity_type.toUpperCase()} •{" "}
                    {Number(activity.distance_km).toFixed(1)} km
                  </p>
                  <p className="text-xs text-slate-500">
                    {activity.activity_date}
                    {activity.duration_minutes
                      ? ` • ${activity.duration_minutes} min`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/activities/${activity.id}/edit`}
                  className="text-xs text-indigo-600"
                >
                  Edit
                </Link>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-slate-600">
                No activities yet. Start with a walk, jog, or run.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
