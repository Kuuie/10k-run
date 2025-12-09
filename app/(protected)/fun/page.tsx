import { requireSession, fetchProfile } from "@/lib/auth";
import {
  getActiveChallenge,
  getUserActivities,
  getUserWeeklyResults,
} from "@/lib/challenge";
import {
  calculateStreak,
  formatDateLocal,
  getWeekRange,
} from "@/lib/week";
import { CoachChat } from "@/components/coach-chat";
import Link from "next/link";

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

const featureRequests = [
  {
    icon: "photo_camera",
    title: "Screenshot OCR",
    description: "Auto-detect distance from run app screenshots",
    status: "planned",
  },
  {
    icon: "sync",
    title: "Strava Sync",
    description: "Automatically import activities from Strava",
    status: "planned",
  },
  {
    icon: "emoji_events",
    title: "Achievements",
    description: "Unlock badges for milestones and streaks",
    status: "idea",
  },
  {
    icon: "groups",
    title: "Team Challenges",
    description: "Compete with friends in group challenges",
    status: "idea",
  },
  {
    icon: "notifications",
    title: "Reminders",
    description: "Get notified when you're falling behind",
    status: "idea",
  },
  {
    icon: "dark_mode",
    title: "Dark Mode",
    description: "Easy on the eyes for night owls",
    status: "idea",
  },
];

export default async function FunPage() {
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const challenge = await getActiveChallenge(supabase);
  const weeklyResults = await getUserWeeklyResults(supabase, userId, challenge.id, 12);
  const activities = await getUserActivities(supabase, userId, challenge.id, 5);

  const now = new Date();
  const week = getWeekRange(now, challenge.week_start_day);
  const thisWeek = weeklyResults.find(
    (w) => w.week_start_date === formatDateLocal(week.start)
  );
  const totalKm = Number(thisWeek?.total_distance_km ?? 0);
  const targetKm = Number(challenge.weekly_distance_target_km);

  const streak = calculateStreak(
    weeklyResults.map((w) => ({
      week_start_date: w.week_start_date,
      met_target: w.met_target,
    })),
    new Date(challenge.start_date),
    challenge.week_start_day
  );

  const coachStats = {
    totalKm,
    targetKm,
    toGo: Math.max(0, targetKm - totalKm),
    streak,
    weekStart: formatDateLocal(week.start),
    weekEnd: formatDateLocal(week.end),
    activities: activities.map((a) => ({
      activity_date: a.activity_date,
      distance_km: Number(a.distance_km),
      duration_minutes: a.duration_minutes ? Number(a.duration_minutes) : null,
      activity_type: a.activity_type,
    })),
    userEmail: user?.email || null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-olive">Fun Zone</h1>
        <p className="text-olive/60">Extra features and coming soon</p>
      </div>

      {/* Coach Chat */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-olive">
          <Icon name="psychology" className="text-xl text-sage" />
          AI Coach
        </h2>
        <CoachChat stats={coachStats} />
      </div>

      {/* Feature Requests */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-olive">
          <Icon name="lightbulb" className="text-xl text-sage" />
          Coming Soon
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {featureRequests.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-light">
                <Icon name={feature.icon} className="text-xl text-sage-dark" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-olive">{feature.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      feature.status === "planned"
                        ? "bg-sage-light text-sage-dark"
                        : "bg-cream-dark text-olive/60"
                    }`}
                  >
                    {feature.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-olive/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Feature Link */}
      <div className="rounded-xl bg-gradient-to-r from-sage to-sage-dark p-4 text-white">
        <div className="flex items-center gap-3">
          <Icon name="campaign" className="text-2xl" />
          <div className="flex-1">
            <p className="font-semibold">Have an idea?</p>
            <p className="text-sm text-sage-light">We'd love to hear your feature suggestions</p>
          </div>
          <Link
            href="mailto:feedback@10kchallenge.app?subject=Feature%20Request"
            className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
          >
            <Icon name="mail" className="text-lg" />
            Send idea
          </Link>
        </div>
      </div>
    </div>
  );
}
