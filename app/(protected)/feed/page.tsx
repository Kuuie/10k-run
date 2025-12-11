import { requireSession } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { getActivityFeed } from "@/lib/gamification";
import Link from "next/link";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function FeedItem({
  item,
}: {
  item: {
    id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
    user?: { name: string | null; email: string };
  };
}) {
  const userName = item.user?.name || item.user?.email?.split("@")[0] || "Someone";
  const data = item.event_data;

  switch (item.event_type) {
    case "activity":
      return (
        <div className="flex items-start gap-3 rounded-xl bg-cream p-4 shadow-sm ring-1 ring-olive/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-light">
            <Icon
              name={
                data.activity_type === "run"
                  ? "directions_run"
                  : data.activity_type === "walk"
                  ? "directions_walk"
                  : "sprint"
              }
              className="text-xl text-sage-dark"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-olive">
              <span className="font-semibold">{userName}</span> logged a{" "}
              <span className="font-semibold">
                {Number(data.distance_km).toFixed(1)} km
              </span>{" "}
              {String(data.activity_type)}
            </p>
            <p className="mt-0.5 text-xs text-olive/60">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      );

    case "badge":
      return (
        <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-sm ring-1 ring-amber-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200">
            <Icon
              name={String(data.badge_icon) || "emoji_events"}
              className="text-xl text-amber-700"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">{userName}</span> earned the{" "}
              <span className="font-semibold">{String(data.badge_name)}</span>{" "}
              badge!
            </p>
            <p className="mt-0.5 text-xs text-amber-700/70">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      );

    case "pb":
      const recordTypeLabels: Record<string, string> = {
        longest_activity: "longest activity",
        fastest_pace: "fastest pace",
        most_weekly_km: "weekly distance",
        longest_streak: "streak",
      };
      return (
        <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 p-4 shadow-sm ring-1 ring-purple-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-200">
            <Icon name="military_tech" className="text-xl text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-purple-900">
              <span className="font-semibold">{userName}</span> set a new{" "}
              <span className="font-semibold">
                {recordTypeLabels[String(data.record_type)] || "personal best"}
              </span>{" "}
              record!
            </p>
            <p className="mt-0.5 text-xs text-purple-700/70">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      );

    case "streak":
      return (
        <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 p-4 shadow-sm ring-1 ring-orange-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200">
            <Icon name="local_fire_department" className="text-xl text-orange-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-orange-900">
              <span className="font-semibold">{userName}</span> is on a{" "}
              <span className="font-semibold">{String(data.streak_count)}-week</span>{" "}
              streak!
            </p>
            <p className="mt-0.5 text-xs text-orange-700/70">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default async function FeedPage() {
  const { supabase } = await requireSession();
  const challenge = await getActiveChallenge(supabase);
  const feedItems = await getActivityFeed(supabase, challenge.id, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dark">
          Team Activity
        </p>
        <h1 className="text-3xl font-semibold text-olive">Activity Feed</h1>
        <p className="text-olive/70">
          See what your team has been up to.
        </p>
      </div>

      {/* Feed */}
      {feedItems.length === 0 ? (
        <div className="rounded-2xl bg-cream p-8 text-center shadow-sm ring-1 ring-olive/10 animate-slide-up delay-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light">
            <Icon name="feed" className="text-3xl text-sage-dark" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-olive">No activity yet</h2>
          <p className="mt-1 text-sm text-olive/70">
            Activity from you and your teammates will show up here.
          </p>
          <Link
            href="/activities/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2 text-sm font-medium text-white shadow-md hover:bg-sage-dark"
          >
            <Icon name="add" className="text-lg" />
            Log Activity
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {feedItems.map((item) => (
            <FeedItem key={item.id} item={item as any} />
          ))}
        </div>
      )}
    </div>
  );
}
