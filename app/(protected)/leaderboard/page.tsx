import { requireSession } from "@/lib/auth";
import {
  getActiveChallenge,
  getCurrentWeekLeaderboard,
  getOverallStats,
} from "@/lib/challenge";
import {
  calculateStreak,
  formatDateLocal,
  formatDateLocalTz,
  getWeekRange,
} from "@/lib/week";

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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">This week</h2>
          <span className="text-xs text-slate-500">
            {formatDateLocalTz(currentWeek.start, Intl.DateTimeFormat().resolvedOptions().timeZone)} → {formatDateLocalTz(currentWeek.end, Intl.DateTimeFormat().resolvedOptions().timeZone)}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {weekly.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {row.name}
                    <span className="ml-2 text-xs text-slate-500">
                      {row.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.total.toFixed(1)} km</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {weekly.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-slate-600"
                  >
                    No activities logged this week yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-up delay-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overall</h2>
          <span className="text-xs text-slate-500">
            From {challenge.start_date}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Current streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {overall.map((row) => {
                const streak = calculateStreak(
                  row.weeks,
                  new Date(challenge.start_date),
                  challenge.week_start_day
                );
                return (
                  <tr key={row.userId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.name}
                      <span className="ml-2 text-xs text-slate-500">
                        {row.email}
                      </span>
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
                    colSpan={3}
                    className="px-4 py-4 text-center text-slate-600"
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
