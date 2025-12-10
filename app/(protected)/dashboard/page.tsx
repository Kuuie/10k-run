import Link from "next/link";
import { requireSession, fetchProfile } from "@/lib/auth";
import {
  getActiveChallenge,
  getUserActivities,
  getUserWeeklyResults,
  getTeamWeeklyProgress,
  getUserRollover,
} from "@/lib/challenge";
import {
  calculateStreak,
  formatDateLocal,
  getWeekRange,
} from "@/lib/week";
import { getDailyQuote } from "@/lib/quotes";
import { deleteActivityAction } from "@/app/actions";
import { InstallPrompt } from "@/components/install-prompt";

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

// Circular Progress Ring
const ProgressRing = ({
  progress,
  total,
  target,
}: {
  progress: number;
  total: number;
  target: number;
}) => {
  const percentage = Math.min(100, Math.round((total / target) * 100));
  const radius = 70;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        {/* Background circle */}
        <circle
          className="stroke-cream-dark"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke="url(#gradient)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#84a98c" />
            <stop offset="100%" stopColor="#52796f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-olive">{total.toFixed(1)}</span>
        <span className="text-sm text-olive/70">of {target} km</span>
      </div>
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
    "there";

  const challenge = await getActiveChallenge(supabase);
  const now = new Date();
  const week = getWeekRange(now, challenge.week_start_day);
  const weekStartIso = formatDateLocal(week.start);

  const [weeklyResults, activities, teamProgress, rolloverKm] = await Promise.all([
    getUserWeeklyResults(supabase, userId, challenge.id, 12),
    getUserActivities(supabase, userId, challenge.id, 5),
    getTeamWeeklyProgress(supabase, challenge),
    getUserRollover(supabase, userId, challenge.id, weekStartIso),
  ]);
  const dailyQuote = getDailyQuote();

  const thisWeek = weeklyResults.find(
    (w) => w.week_start_date === weekStartIso
  );
  const totalKm = Number(thisWeek?.total_distance_km ?? 0);
  const metTarget = thisWeek?.met_target ?? false;
  const baseTargetKm = Number(challenge.weekly_distance_target_km);
  const targetKm = baseTargetKm + rolloverKm; // Include rollover in target
  const toGo = Math.max(0, targetKm - totalKm);
  const progressPct = Math.min(100, Math.round((totalKm / targetKm) * 100));

  const streak = calculateStreak(
    weeklyResults.map((w) => ({
      week_start_date: w.week_start_date,
      met_target: w.met_target,
    })),
    new Date(challenge.start_date),
    challenge.week_start_day
  );

  return (
    <div className="space-y-6">
      {/* Hero Card with Progress Ring */}
      <div className="animate-scale-in rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover">
        <div className="flex flex-col items-center text-center">
          {/* Greeting */}
          <p className="text-sm text-olive/70">Hey {displayName.split(" ")[0]}!</p>
          <h1 className="mt-1 text-xl font-semibold text-olive">
            {metTarget ? "Goal reached! 🎉" : `${toGo.toFixed(1)} km to go`}
          </h1>

          {/* Progress Ring */}
          <div className="my-6">
            <ProgressRing progress={progressPct} total={totalKm} target={targetKm} />
          </div>

          {/* Week dates */}
          <p className="text-sm text-olive/60">
            {formatDateLocal(week.start)} – {formatDateLocal(week.end)}
          </p>

          {/* Rollover indicator */}
          {rolloverKm > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <Icon name="history" className="text-sm" />
              +{rolloverKm.toFixed(1)} km rollover from excused week
            </div>
          )}

          {/* Add Activity Button */}
          <Link
            href="/activities/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-medium text-white shadow-lg shadow-sage/25 transition hover:bg-sage-dark active:scale-95"
          >
            <Icon name="add" className="text-xl" />
            Log Activity
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="animate-slide-up delay-1 rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
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

        <div className="animate-slide-up delay-2 rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
              <Icon name="directions_run" className="text-xl text-sage-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">{activities.length}</p>
              <p className="text-xs text-olive/70">Activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="animate-slide-up delay-3 rounded-2xl bg-cream shadow-sm ring-1 ring-olive/10 card-hover">
        <div className="flex items-center justify-between border-b border-cream-dark px-4 py-3">
          <h2 className="font-semibold text-olive">Recent Activities</h2>
          <Link
            href="/activities/new"
            className="flex items-center gap-1 text-sm font-medium text-sage-dark"
          >
            <Icon name="add" className="text-lg" />
            Add
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-light">
              <Icon name="directions_run" className="text-2xl text-sage-dark" />
            </div>
            <p className="mt-3 text-sm text-olive/70">No activities yet</p>
            <Link
              href="/activities/new"
              className="mt-2 inline-block text-sm font-medium text-sage-dark"
            >
              Log your first activity
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream-dark">
            {activities.map((activity) => {
              const deleteAction = async () => {
                "use server";
                await deleteActivityAction(activity.id);
              };

              const iconName =
                activity.activity_type === "run"
                  ? "directions_run"
                  : activity.activity_type === "walk"
                  ? "directions_walk"
                  : "sprint";

              return (
                <div key={activity.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
                      <Icon name={iconName} className="text-xl text-sage-dark" />
                    </div>
                    <div>
                      <p className="font-medium text-olive">
                        {Number(activity.distance_km).toFixed(1)} km
                        <span className="ml-1 font-normal text-olive/70">
                          {activity.activity_type}
                        </span>
                      </p>
                      <p className="text-sm text-olive/60">
                        {activity.activity_date}
                        {activity.duration_minutes && ` · ${activity.duration_minutes} min`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Link
                      href={`/activities/${activity.id}/edit`}
                      className="rounded-full p-2 text-olive/50 hover:bg-sage-light hover:text-sage-dark"
                    >
                      <Icon name="edit" className="text-lg" />
                    </Link>
                    <form action={deleteAction}>
                      <button
                        type="submit"
                        className="rounded-full p-2 text-olive/50 hover:bg-red-50 hover:text-red-500"
                      >
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly History */}
      {weeklyResults.length > 0 && (
        <div className="animate-slide-up delay-4 rounded-2xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <h2 className="font-semibold text-olive">History</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {weeklyResults.slice(0, 8).map((result) => (
              <div
                key={result.week_start_date}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                  result.met_target
                    ? "bg-sage-light text-sage-dark"
                    : "bg-cream-dark text-olive/60"
                }`}
              >
                {result.met_target && <Icon name="check" className="text-sm" />}
                <span className="font-medium">{result.week_start_date.slice(5)}</span>
                <span>{Number(result.total_distance_km).toFixed(1)}km</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Progress */}
      {teamProgress.participantCount > 0 && (
        <div className="animate-slide-up delay-5 rounded-2xl bg-cream p-4 shadow-sm ring-1 ring-olive/10 card-hover">
          <h2 className="flex items-center gap-2 font-semibold text-olive">
            <Icon name="groups" className="text-lg text-sage-dark" />
            Team This Week
          </h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-olive">{teamProgress.totalKm.toFixed(1)} km</p>
              <p className="text-xs text-olive/70">{teamProgress.participantCount} active participant{teamProgress.participantCount !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1 rounded-lg bg-sage-light px-3 py-1.5 text-sm font-medium text-sage-dark"
            >
              <Icon name="leaderboard" className="text-base" />
              View board
            </Link>
          </div>
        </div>
      )}

      {/* Daily Motivation */}
      <div className="animate-slide-up delay-5 rounded-2xl bg-gradient-to-br from-sage to-sage-dark p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <Icon name="format_quote" className="text-2xl opacity-50" />
          <div>
            <p className="text-sm font-medium italic leading-relaxed">
              "{dailyQuote.quote.length > 150 ? dailyQuote.quote.slice(0, 150) + '...' : dailyQuote.quote}"
            </p>
            <p className="mt-2 text-xs opacity-75">— {dailyQuote.author}</p>
          </div>
        </div>
      </div>

      {/* Install App Prompt */}
      <InstallPrompt className="animate-slide-up delay-5" />
    </div>
  );
}
