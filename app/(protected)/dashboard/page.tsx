import Link from "next/link";
import { requireSession, fetchProfile } from "@/lib/auth";
import {
  getActiveChallenge,
  getUserActivities,
  getUserWeeklyResults,
} from "@/lib/challenge";
import {
  DEFAULT_TZ,
  calculateStreak,
  formatDateLocal,
  formatDateLocalTz,
  getWeekRange,
} from "@/lib/week";
import { deleteActivityAction } from "@/app/actions";
import { CheckIcon, XIcon } from "@/components/icons";

const ProgressBar = ({ value, target }: { value: number; target: number }) => {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="w-full rounded-full bg-slate-100 dark:bg-[#1F2025]">
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

  const now = new Date();
  const week = getWeekRange(now, challenge.week_start_day);
  const thisWeek = weeklyResults.find(
    (w) => w.week_start_date === formatDateLocal(week.start)
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
  const today = now;
  const dayPills = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week.start);
    d.setDate(d.getDate() + i);
    const iso = formatDateLocalTz(d, DEFAULT_TZ);
    return {
      iso,
      label: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      isToday: iso === formatDateLocalTz(today, DEFAULT_TZ),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 animate-slide-up">
          Hello, {displayName}
        </p>
        <h1 className="text-3xl font-semibold animate-slide-up delay-1">Dashboard</h1>
        <p className="text-slate-600 dark:text-[#9CA3AF] animate-slide-up delay-2">
          Track your weekly 10 km progress, streaks, and recent activities.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-900 shadow-sm animate-slide-up delay-2 dark:border-[#1F2025] dark:bg-[#16181D] dark:text-[#E5E7EB]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-[#0E0F12] dark:text-indigo-200">
              This week
            </span>
            <span className="font-semibold">
              {formatDateLocal(week.start)} → {formatDateLocal(week.end)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dayPills.map((day) => (
              <span
                key={day.iso}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  day.isToday
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-white text-indigo-700 dark:bg-[#0E0F12] dark:text-indigo-200"
                }`}
              >
                {day.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 animate-slide-up delay-3">
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-3 dark:border-[#1F2025] dark:bg-[#16181D]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-[#E5E7EB]">This Week</p>
              <p className="text-2xl font-semibold">
                {totalKm.toFixed(1)} km / {challenge.weekly_distance_target_km} km
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                metTarget
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
              }`}
            >
              {metTarget ? (
                <>
                  <CheckIcon className="h-4 w-4" /> Goal reached
                </>
              ) : (
                <>
                  <XIcon className="h-4 w-4" /> {toGo.toFixed(1)} km to go
                </>
              )}
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={Number(totalKm)}
              target={Number(challenge.weekly_distance_target_km)}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-[#9CA3AF]">
            <span>
              Week window: {week.start.toISOString().slice(0, 10)} →{" "}
              {week.end.toISOString().slice(0, 10)}
            </span>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Add activity
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-4 dark:border-[#1F2025] dark:bg-[#16181D]">
          <p className="text-sm font-medium text-slate-700 dark:text-[#E5E7EB]">Current streak</p>
          <p className="mt-2 text-3xl font-semibold">{streak} week(s)</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#9CA3AF]">
            Consecutive weeks hitting {challenge.weekly_distance_target_km} km
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1F2025] dark:bg-[#16181D]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent weeks</h2>
            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#9CA3AF]">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200">
                <CheckIcon className="h-3.5 w-3.5" /> Met
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200">
                <XIcon className="h-3.5 w-3.5" /> Missed
              </span>
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {weeklyResults.slice(0, 8).map((weekResult) => (
              <div
                key={weekResult.week_start_date}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-[#1F2025] dark:bg-[#13151A]"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-[#E5E7EB]">
                    Week of {weekResult.week_start_date}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                    Total: {Number(weekResult.total_distance_km).toFixed(1)} km
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${
                    weekResult.met_target
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200"
                  }`}
                >
                  {weekResult.met_target ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5" /> Met
                    </>
                  ) : (
                    <>
                      <XIcon className="h-3.5 w-3.5" /> Missed
                    </>
                  )}
                </span>
              </div>
            ))}
            {weeklyResults.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-[#9CA3AF]">
                Log your first activity to start your streak.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1F2025] dark:bg-[#16181D]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activities</h2>
            <Link href="/activities/new" className="text-sm text-indigo-600 dark:text-indigo-300">
              Add
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => {
              const deleteAction = async () => {
                "use server";
                await deleteActivityAction(activity.id);
              };
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-[#1F2025] dark:bg-[#13151A]"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {activity.activity_type.toUpperCase()} •{" "}
                      {Number(activity.distance_km).toFixed(1)} km
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                      {activity.activity_date}
                      {activity.duration_minutes
                        ? ` • ${activity.duration_minutes} min`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      href={`/activities/${activity.id}/edit`}
                      className="text-indigo-600 dark:text-indigo-300"
                    >
                      Edit
                    </Link>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        className="text-red-500 dark:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-[#9CA3AF]">
                No activities yet. Start with a walk, jog, or run.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
