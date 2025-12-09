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

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

const rankMeta = [
  {
    label: "1",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-700",
    rowBg: "bg-amber-50/50 dark:bg-amber-900/20",
    icon: "emoji_events",
    iconColor: "text-amber-500",
  },
  {
    label: "2",
    bg: "bg-slate-100 dark:bg-slate-700/50",
    text: "text-slate-600 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-600",
    rowBg: "bg-slate-50/50 dark:bg-slate-800/30",
    icon: "workspace_premium",
    iconColor: "text-slate-400",
  },
  {
    label: "3",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-700",
    rowBg: "bg-orange-50/40 dark:bg-orange-900/20",
    icon: "military_tech",
    iconColor: "text-orange-400",
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

      <div className="rounded-2xl border border-cream-dark bg-cream p-4 sm:p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-olive">This week</h2>
          <span className="text-xs text-olive/60">
            {formatDateLocalTz(currentWeek.start, DEFAULT_TZ).slice(5)} → {formatDateLocalTz(currentWeek.end, DEFAULT_TZ).slice(5)}
          </span>
        </div>

        {/* Mobile card layout */}
        <div className="space-y-3">
          {weekly.map((row, idx) => {
            const meta = rankMeta[idx];
            const isOnTrack = row.status === "✅";

            return (
              <div
                key={row.userId}
                className={`rounded-xl p-3 ${
                  meta ? meta.rowBg : "bg-sage-light/20"
                } border border-cream-dark`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {meta ? (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg} ${meta.border} border`}>
                        <Icon name={meta.icon} className={`text-xl ${meta.iconColor}`} />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark text-olive/60 font-semibold">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-olive truncate ${idx === 0 ? "font-semibold" : ""}`}>
                      {row.name}
                    </p>
                    <p className="text-xs text-olive/60 truncate">{row.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-olive">{row.total.toFixed(1)} km</p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isOnTrack ? "text-sage-dark" : "text-rose-600"
                      }`}
                    >
                      {isOnTrack ? (
                        <><CheckIcon className="h-3 w-3" /> On track</>
                      ) : (
                        <><XIcon className="h-3 w-3" /> Behind</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {weekly.length === 0 && (
            <div className="py-8 text-center text-olive/60">
              No activities logged this week yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-cream-dark bg-cream p-4 sm:p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-olive">Overall</h2>
          <span className="text-xs text-olive/60">
            From {challenge.start_date}
          </span>
        </div>

        {/* Mobile card layout */}
        <div className="space-y-3">
          {overallWithStreak.map((row, idx) => {
            const meta = rankMeta[idx];

            return (
              <div
                key={row.userId}
                className={`rounded-xl p-3 ${
                  meta ? meta.rowBg : "bg-sage-light/20"
                } border border-cream-dark`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {meta ? (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg} ${meta.border} border`}>
                        <Icon name={meta.icon} className={`text-xl ${meta.iconColor}`} />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark text-olive/60 font-semibold">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-olive truncate ${idx === 0 ? "font-semibold" : ""}`}>
                      {row.name}
                    </p>
                    <p className="text-xs text-olive/60 truncate">{row.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-olive">{Number(row.totalKm).toFixed(1)} km</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-sage-dark">
                      <Icon name="local_fire_department" className="text-sm text-orange-500" />
                      {row.streak} week{row.streak !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {overallWithStreak.length === 0 && (
            <div className="py-8 text-center text-olive/60">
              Stats will appear once results are logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
