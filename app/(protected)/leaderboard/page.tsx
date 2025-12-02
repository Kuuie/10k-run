import { requireSession } from "@/lib/auth";
import {
  getActiveChallenge,
  getCurrentWeekLeaderboard,
  getOverallStats,
} from "@/lib/challenge";
import {
  DEFAULT_TZ,
  calculateStreak,
  formatDateLocal,
  formatDateLocalTz,
  getWeekRange,
} from "@/lib/week";

const rankMeta = [
  {
    label: "1",
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  {
    label: "2",
    bg: "bg-slate-50",
    text: "text-slate-800",
    border: "border-slate-200",
  },
  {
    label: "3",
    bg: "bg-amber-100/60",
    text: "text-amber-900",
    border: "border-amber-300/80",
  },
];

export default async function LeaderboardPage() {
  const { supabase } = await requireSession();
  const challenge = await getActiveChallenge(supabase);
  const currentWeek = getWeekRange(new Date(), challenge.week_start_day);

  const [weekly, overall] = await Promise.all([
    getCurrentWeekLeaderboard(supabase, challenge),
    getOverallStats(supabase, challenge),
  ]);

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">
          Team board
        </p>
        <h1 className="text-3xl font-semibold">Leaderboard</h1>
        <p className="text-slate-600">
          Current week standings and overall streaks.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-2 dark:border-[#1F2025] dark:bg-[#16181D]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">This week</h2>
          <span className="text-xs text-slate-500">
            {formatDateLocalTz(currentWeek.start, DEFAULT_TZ)} → {formatDateLocalTz(currentWeek.end, DEFAULT_TZ)}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-[#1F2025]">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-[#1F2025]">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-[#13151A] dark:text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1F2025] dark:bg-[#16181D]">
              {weekly.map((row, idx) => {
                const meta = rankMeta[idx];
                const rankBadge = meta ? (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm ${meta.bg} ${meta.text} ${meta.border} dark:bg-[#1F2025] dark:border-[#2a2c32] dark:text-[#E5E7EB]`}
                  >
                    {meta.label}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    #{idx + 1}
                  </span>
                );

                return (
                  <tr
                    key={row.userId}
                    className={`${meta ? `${meta.bg} ${meta.border}` : ""} odd:bg-white even:bg-slate-50 dark:odd:bg-[#16181D] dark:even:bg-[#13151A]`}
                  >
                    <td className="px-4 py-3">{rankBadge}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <span className={idx === 0 ? "font-semibold" : ""}>
                          {row.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                          {row.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.total.toFixed(1)} km</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "✅"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900/50"
                            : "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-900/50"
                        }`}
                      >
                        {row.status === "✅" ? "On track" : "Not met"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {weekly.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-slate-600 dark:text-[#9CA3AF]"
                  >
                    No activities logged this week yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-3 dark:border-[#1F2025] dark:bg-[#16181D]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overall</h2>
          <span className="text-xs text-slate-500">
            From {challenge.start_date}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-[#1F2025]">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-[#1F2025]">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-[#13151A] dark:text-[#9CA3AF]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Current streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1F2025] dark:bg-[#16181D]">
              {overall.map((row, idx) => {
                const meta = rankMeta[idx];
                const rankBadge = meta ? (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm ${meta.bg} ${meta.text} ${meta.border} dark:bg-[#1F2025] dark:border-[#2a2c32] dark:text-[#E5E7EB]`}
                  >
                    {meta.label}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    #{idx + 1}
                  </span>
                );

                const streak = calculateStreak(
                  row.weeks,
                  new Date(challenge.start_date),
                  challenge.week_start_day
                );
                return (
                  <tr
                    key={row.userId}
                    className={`${meta ? `${meta.bg} ${meta.border}` : ""} odd:bg-white even:bg-slate-50 dark:odd:bg-[#16181D] dark:even:bg-[#13151A]`}
                  >
                    <td className="px-4 py-3">{rankBadge}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <span className={idx === 0 ? "font-semibold" : ""}>
                          {row.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                          {row.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {Number(row.totalKm).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3">{streak} week(s)</td>
                  </tr>
                );
              })}
              {overall.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-slate-600 dark:text-[#9CA3AF]"
                  >
                    Stats will appear once results are logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
