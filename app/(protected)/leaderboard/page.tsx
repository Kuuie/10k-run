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
import { CheckIcon, XIcon } from "@/components/icons";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const rankMeta = [
  {
    label: "1",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    rowBg: "bg-amber-50/50",
  },
  {
    label: "2",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-300",
    rowBg: "bg-slate-50/50",
  },
  {
    label: "3",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    rowBg: "bg-orange-50/40",
  },
];

export default async function LeaderboardPage() {
  await requireSession(); // ensure authenticated
  const supabase = createServiceSupabaseClient();
  const challenge = await getActiveChallenge(supabase);
  const currentWeek = getWeekRange(new Date(), challenge.week_start_day);

  const [weekly, overall] = await Promise.all([
    getCurrentWeekLeaderboard(supabase, challenge),
    getOverallStats(supabase, challenge),
  ]);

  const overallWithStreak = overall
    .map((row) => ({
      ...row,
      streak: calculateStreak(
        row.weeks,
        new Date(challenge.start_date),
        challenge.week_start_day
      ),
    }))
    .sort((a, b) => {
      if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
      return (b.streak ?? 0) - (a.streak ?? 0);
    });

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dark">
          Team board
        </p>
        <h1 className="text-3xl font-semibold text-olive">Leaderboard</h1>
        <p className="text-olive/70">
          Current week standings and overall streaks.
        </p>
      </div>

      <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-olive">This week</h2>
          <span className="text-xs text-olive/60">
            {formatDateLocalTz(currentWeek.start, DEFAULT_TZ)} → {formatDateLocalTz(currentWeek.end, DEFAULT_TZ)}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-cream-dark">
          <table className="min-w-full divide-y divide-cream-dark text-sm">
            <thead className="bg-sage-light/50 text-left text-xs font-semibold uppercase tracking-wide text-olive">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark bg-cream">
              {weekly.map((row, idx) => {
                const meta = rankMeta[idx];
                const rankBadge = meta ? (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm ${meta.bg} ${meta.text} ${meta.border}`}
                  >
                    {meta.label}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-olive/50">
                    #{idx + 1}
                  </span>
                );

                return (
                  <tr
                    key={row.userId}
                    className={
                      meta
                        ? meta.rowBg
                        : "odd:bg-cream even:bg-sage-light/20"
                    }
                  >
                    <td className="px-4 py-3">{rankBadge}</td>
                    <td className="px-4 py-3 font-medium text-olive">
                      <div className="flex items-center gap-2">
                        <span className={idx === 0 ? "font-semibold" : ""}>
                          {row.name}
                        </span>
                        <span className="text-xs text-olive/60">
                          {row.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-olive">{row.total.toFixed(1)} km</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                          row.status === "✅"
                            ? "bg-sage-light text-sage-dark border-sage"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {row.status === "✅" ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5" /> On track
                          </>
                        ) : (
                          <>
                            <XIcon className="h-3.5 w-3.5" /> Not met
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {weekly.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-olive/60"
                  >
                    No activities logged this week yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-olive">Overall</h2>
          <span className="text-xs text-olive/60">
            From {challenge.start_date}
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-cream-dark">
          <table className="min-w-full divide-y divide-cream-dark text-sm">
            <thead className="bg-sage-light/50 text-left text-xs font-semibold uppercase tracking-wide text-olive">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total km</th>
                <th className="px-4 py-3">Current streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark bg-cream">
              {overallWithStreak.map((row, idx) => {
                const meta = rankMeta[idx];
                const rankBadge = meta ? (
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm ${meta.bg} ${meta.text} ${meta.border}`}
                  >
                    {meta.label}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-olive/50">
                    #{idx + 1}
                  </span>
                );

                return (
                  <tr
                    key={row.userId}
                    className={
                      meta
                        ? meta.rowBg
                        : "odd:bg-cream even:bg-sage-light/20"
                    }
                  >
                    <td className="px-4 py-3">{rankBadge}</td>
                    <td className="px-4 py-3 font-medium text-olive">
                      <div className="flex items-center gap-2">
                        <span className={idx === 0 ? "font-semibold" : ""}>
                          {row.name}
                        </span>
                        <span className="text-xs text-olive/60">
                          {row.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-olive">
                      {Number(row.totalKm).toFixed(1)} km
                    </td>
                    <td className="px-4 py-3 text-olive">{row.streak} week(s)</td>
                  </tr>
                );
              })}
              {overallWithStreak.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-olive/60"
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
