import { requireSession, fetchProfile } from "@/lib/auth";
import {
  getActiveChallenge,
  getUserActivities,
  getUserWeeklyResults,
} from "@/lib/challenge";
import { calculateStreak, formatDateLocal, getWeekRange } from "@/lib/week";
import { getDailyQuote } from "@/lib/quotes";
import Link from "next/link";

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

export default async function StatsPage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  const challenge = await getActiveChallenge(supabase);

  // Get all activities and weekly results for comprehensive stats
  const [activities, weeklyResults] = await Promise.all([
    getUserActivities(supabase, userId, challenge.id, 1000), // Get all
    getUserWeeklyResults(supabase, userId, challenge.id, 52), // Up to a year
  ]);

  // Calculate stats
  const totalKm = activities.reduce((sum, a) => sum + Number(a.distance_km), 0);
  const totalActivities = activities.length;
  const totalMinutes = activities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0);
  const weeksCompleted = weeklyResults.filter(w => w.met_target).length;

  const streak = calculateStreak(
    weeklyResults.map((w) => ({
      week_start_date: w.week_start_date,
      met_target: w.met_target,
    })),
    new Date(challenge.start_date),
    challenge.week_start_day
  );

  // Personal bests
  const longestRun = activities.length > 0
    ? Math.max(...activities.map(a => Number(a.distance_km)))
    : 0;

  const fastestPace = activities
    .filter(a => a.duration_minutes && Number(a.duration_minutes) > 0)
    .map(a => Number(a.duration_minutes) / Number(a.distance_km))
    .filter(p => !isNaN(p) && isFinite(p));

  const bestPace = fastestPace.length > 0 ? Math.min(...fastestPace) : null;

  // Activity breakdown by type
  const byType = activities.reduce((acc, a) => {
    acc[a.activity_type] = (acc[a.activity_type] || 0) + Number(a.distance_km);
    return acc;
  }, {} as Record<string, number>);

  // Weekly trend (last 8 weeks)
  const recentWeeks = weeklyResults.slice(0, 8).reverse();
  const maxWeekKm = Math.max(...recentWeeks.map(w => Number(w.total_distance_km)), challenge.weekly_distance_target_km);

  // Best week
  const bestWeek = weeklyResults.length > 0
    ? weeklyResults.reduce((best, w) =>
        Number(w.total_distance_km) > Number(best.total_distance_km) ? w : best
      )
    : null;

  const displayName = profile?.name || profile?.email?.split("@")[0] || "You";
  const dailyQuote = getDailyQuote();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dark">
          Your journey
        </p>
        <h1 className="text-3xl font-semibold text-olive">Stats & Insights</h1>
        <p className="text-olive/70">
          Track your progress and celebrate your achievements.
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up delay-1">
        <div className="rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
              <Icon name="straighten" className="text-xl text-sage-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">{totalKm.toFixed(1)}</p>
              <p className="text-xs text-olive/70">Total km</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
              <Icon name="local_fire_department" className="text-xl text-sage-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">{streak}</p>
              <p className="text-xs text-olive/70">Week streak</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
              <Icon name="emoji_events" className="text-xl text-sage-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">{weeksCompleted}</p>
              <p className="text-xs text-olive/70">Weeks completed</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
              <Icon name="directions_run" className="text-xl text-sage-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">{totalActivities}</p>
              <p className="text-xs text-olive/70">Activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-2">
        <h2 className="flex items-center gap-2 font-semibold text-olive">
          <Icon name="military_tech" className="text-xl text-sage-dark" />
          Personal Bests
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-sage-light/50 p-4">
            <p className="text-sm text-olive/70">Longest activity</p>
            <p className="text-xl font-bold text-olive">{longestRun.toFixed(1)} km</p>
          </div>
          <div className="rounded-xl bg-sage-light/50 p-4">
            <p className="text-sm text-olive/70">Best pace</p>
            <p className="text-xl font-bold text-olive">
              {bestPace ? `${Math.floor(bestPace)}:${String(Math.round((bestPace % 1) * 60)).padStart(2, '0')} /km` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-sage-light/50 p-4">
            <p className="text-sm text-olive/70">Best week</p>
            <p className="text-xl font-bold text-olive">
              {bestWeek ? `${Number(bestWeek.total_distance_km).toFixed(1)} km` : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-sage-light/50 p-4">
            <p className="text-sm text-olive/70">Total time</p>
            <p className="text-xl font-bold text-olive">
              {totalMinutes > 60
                ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                : `${totalMinutes}m`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      {recentWeeks.length > 0 && (
        <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-3">
          <h2 className="flex items-center gap-2 font-semibold text-olive">
            <Icon name="trending_up" className="text-xl text-sage-dark" />
            Weekly Trend
          </h2>
          <div className="mt-4 flex items-end gap-2 h-32">
            {recentWeeks.map((week, i) => {
              const height = (Number(week.total_distance_km) / maxWeekKm) * 100;
              const metTarget = week.met_target;
              return (
                <div key={week.week_start_date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${metTarget ? 'bg-sage' : 'bg-cream-dark'}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-olive/60">
                    {week.week_start_date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-olive/60">
            <span>Target: {challenge.weekly_distance_target_km} km</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sage" /> Met
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cream-dark" /> Missed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Breakdown */}
      {Object.keys(byType).length > 0 && (
        <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-4">
          <h2 className="flex items-center gap-2 font-semibold text-olive">
            <Icon name="pie_chart" className="text-xl text-sage-dark" />
            Activity Breakdown
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, km]) => {
                const percent = (km / totalKm) * 100;
                const icon = type === "run" ? "directions_run" : type === "walk" ? "directions_walk" : "sprint";
                return (
                  <div key={type} className="flex items-center gap-3">
                    <Icon name={icon} className="text-lg text-sage-dark" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-olive">{type}</span>
                        <span className="text-olive/70">{km.toFixed(1)} km</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-cream-dark overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sage transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="rounded-2xl bg-gradient-to-br from-sage to-sage-dark p-6 text-white shadow-lg animate-slide-up delay-5">
        <div className="flex items-start gap-3">
          <Icon name="format_quote" className="text-3xl opacity-50" />
          <div>
            <p className="text-lg font-medium italic">
              "{dailyQuote.quote}"
            </p>
            <p className="mt-2 text-sm opacity-75">— {dailyQuote.author}</p>
          </div>
        </div>
      </div>

      {/* Milestones / Achievement Hints */}
      <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-5">
        <h2 className="flex items-center gap-2 font-semibold text-olive">
          <Icon name="emoji_events" className="text-xl text-sage-dark" />
          Next Milestones
        </h2>
        <div className="mt-4 space-y-3">
          {totalKm < 50 && (
            <div className="flex items-center gap-3 rounded-lg bg-sage-light/30 p-3">
              <Icon name="straighten" className="text-sage-dark" />
              <div className="flex-1">
                <p className="text-sm font-medium text-olive">Half Century</p>
                <p className="text-xs text-olive/70">{(50 - totalKm).toFixed(1)} km to go</p>
              </div>
              <div className="text-xs text-sage-dark">{Math.round((totalKm / 50) * 100)}%</div>
            </div>
          )}
          {totalKm >= 50 && totalKm < 100 && (
            <div className="flex items-center gap-3 rounded-lg bg-sage-light/30 p-3">
              <Icon name="workspace_premium" className="text-sage-dark" />
              <div className="flex-1">
                <p className="text-sm font-medium text-olive">Century Club</p>
                <p className="text-xs text-olive/70">{(100 - totalKm).toFixed(1)} km to go</p>
              </div>
              <div className="text-xs text-sage-dark">{Math.round((totalKm / 100) * 100)}%</div>
            </div>
          )}
          {streak < 3 && (
            <div className="flex items-center gap-3 rounded-lg bg-sage-light/30 p-3">
              <Icon name="local_fire_department" className="text-sage-dark" />
              <div className="flex-1">
                <p className="text-sm font-medium text-olive">On Fire (3 week streak)</p>
                <p className="text-xs text-olive/70">{3 - streak} more week(s) to go</p>
              </div>
            </div>
          )}
          {streak >= 3 && streak < 5 && (
            <div className="flex items-center gap-3 rounded-lg bg-sage-light/30 p-3">
              <Icon name="bolt" className="text-sage-dark" />
              <div className="flex-1">
                <p className="text-sm font-medium text-olive">Unstoppable (5 week streak)</p>
                <p className="text-xs text-olive/70">{5 - streak} more week(s) to go</p>
              </div>
            </div>
          )}
          {totalKm >= 100 && streak >= 5 && (
            <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 p-3 ring-1 ring-amber-200">
              <Icon name="stars" className="text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">You're crushing it!</p>
                <p className="text-xs text-amber-700">Keep up the amazing work</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
