import { SupabaseClient } from "@supabase/supabase-js";
import { Badge, UserBadge, ActivityFeedItem, PersonalBest } from "./supabase/types";

// Badge definitions with their check logic
type BadgeCheck = {
  slug: string;
  check: (stats: UserStats) => boolean;
};

type UserStats = {
  totalActivities: number;
  totalDistanceKm: number;
  currentStreak: number;
  weeksCompleted: number;
  cheersGiven: number;
  cheersReceived: number;
  weeklyDistanceKm: number;
  weeklyTarget: number;
  activityTypesThisWeek: Set<string>;
  activeDaysThisWeek: number;
  isLastDayOfWeek: boolean;
  missedLastWeek: boolean;
  metTargetThisWeek: boolean;
};

const BADGE_CHECKS: BadgeCheck[] = [
  // Milestones
  { slug: "first_activity", check: (s) => s.totalActivities >= 1 },
  { slug: "first_week", check: (s) => s.weeksCompleted >= 1 },

  // Distance achievements
  { slug: "10k_club", check: (s) => s.totalDistanceKm >= 10 },
  { slug: "25k_warrior", check: (s) => s.totalDistanceKm >= 25 },
  { slug: "distance_50", check: (s) => s.totalDistanceKm >= 50 },
  { slug: "distance_100", check: (s) => s.totalDistanceKm >= 100 },
  { slug: "distance_250", check: (s) => s.totalDistanceKm >= 250 },
  { slug: "500k_ultra", check: (s) => s.totalDistanceKm >= 500 },

  // Streaks
  { slug: "streak_2", check: (s) => s.currentStreak >= 2 },
  { slug: "streak_3", check: (s) => s.currentStreak >= 3 },
  { slug: "streak_5", check: (s) => s.currentStreak >= 5 },
  { slug: "streak_8", check: (s) => s.currentStreak >= 8 },
  { slug: "streak_10", check: (s) => s.currentStreak >= 10 },
  { slug: "streak_12", check: (s) => s.currentStreak >= 12 },

  // Social
  { slug: "team_player", check: (s) => s.cheersGiven >= 10 },
  { slug: "motivator", check: (s) => s.cheersGiven >= 50 },
  { slug: "crowd_favorite", check: (s) => s.cheersReceived >= 20 },

  // Special achievements
  { slug: "overachiever", check: (s) => s.weeklyDistanceKm >= s.weeklyTarget * 1.5 },
  { slug: "triple_threat", check: (s) => s.activityTypesThisWeek.size >= 3 },
  { slug: "perfect_week", check: (s) => s.activeDaysThisWeek >= 7 },
  { slug: "photo_finish", check: (s) => s.isLastDayOfWeek && s.metTargetThisWeek },
  { slug: "comeback_kid", check: (s) => s.missedLastWeek && s.metTargetThisWeek },
];

// Get all badges
export async function getAllBadges(supabase: SupabaseClient): Promise<Badge[]> {
  const { data } = await supabase
    .from("badges")
    .select("*")
    .order("category", { ascending: true });
  return (data as Badge[]) || [];
}

// Get user's earned badges
export async function getUserBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBadge[]> {
  const { data } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  return (data as UserBadge[]) || [];
}

// Get user stats for badge checking
export async function getUserStats(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  weekStartDate: string,
  weekEndDate: string,
  weeklyTarget: number
): Promise<UserStats> {
  // Fetch all needed data in parallel
  const [
    activitiesResult,
    weeklyResultsResult,
    cheersGivenResult,
    cheersReceivedResult,
    weekActivitiesResult,
  ] = await Promise.all([
    // Total activities and distance
    supabase
      .from("activities")
      .select("distance_km")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId),
    // Weekly results for streak
    supabase
      .from("weekly_results")
      .select("met_target, week_start_date")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .order("week_start_date", { ascending: false }),
    // Cheers given
    supabase
      .from("activity_cheers")
      .select("id", { count: "exact" })
      .eq("user_id", userId),
    // Cheers received (on user's activities)
    supabase
      .from("activity_cheers")
      .select("id, activities!inner(user_id)", { count: "exact" })
      .eq("activities.user_id", userId),
    // This week's activities
    supabase
      .from("activities")
      .select("activity_type, activity_date, distance_km")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .gte("activity_date", weekStartDate)
      .lte("activity_date", weekEndDate),
  ]);

  const activities = activitiesResult.data || [];
  const weeklyResults = weeklyResultsResult.data || [];
  const weekActivities = weekActivitiesResult.data || [];

  // Calculate total distance
  const totalDistanceKm = activities.reduce(
    (sum, a) => sum + Number(a.distance_km),
    0
  );

  // Calculate current streak
  let currentStreak = 0;
  for (const result of weeklyResults) {
    if (result.met_target) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Weeks completed (met target)
  const weeksCompleted = weeklyResults.filter((r) => r.met_target).length;

  // This week stats
  const weeklyDistanceKm = weekActivities.reduce(
    (sum, a) => sum + Number(a.distance_km),
    0
  );
  const activityTypesThisWeek = new Set(weekActivities.map((a) => a.activity_type));
  const activeDaysThisWeek = new Set(weekActivities.map((a) => a.activity_date)).size;

  // Check if last day of week
  const today = new Date();
  const endDate = new Date(weekEndDate);
  const isLastDayOfWeek =
    today.toDateString() === endDate.toDateString();

  // Check if missed last week
  const missedLastWeek =
    weeklyResults.length > 1 && !weeklyResults[1]?.met_target;

  // Met target this week
  const metTargetThisWeek = weeklyDistanceKm >= weeklyTarget;

  return {
    totalActivities: activities.length,
    totalDistanceKm,
    currentStreak,
    weeksCompleted,
    cheersGiven: cheersGivenResult.count || 0,
    cheersReceived: cheersReceivedResult.count || 0,
    weeklyDistanceKm,
    weeklyTarget,
    activityTypesThisWeek,
    activeDaysThisWeek,
    isLastDayOfWeek,
    missedLastWeek,
    metTargetThisWeek,
  };
}

// Check and award new badges
export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  weekStartDate: string,
  weekEndDate: string,
  weeklyTarget: number
): Promise<Badge[]> {
  // Get user stats
  const stats = await getUserStats(
    supabase,
    userId,
    challengeId,
    weekStartDate,
    weekEndDate,
    weeklyTarget
  );

  // Get all badges and user's existing badges
  const [allBadges, existingBadges] = await Promise.all([
    getAllBadges(supabase),
    getUserBadges(supabase, userId),
  ]);

  const existingBadgeSlugs = new Set(
    existingBadges.map((ub) => (ub.badge as Badge).slug)
  );

  // Find new badges to award
  const newBadges: Badge[] = [];

  for (const check of BADGE_CHECKS) {
    if (existingBadgeSlugs.has(check.slug)) continue;

    const badge = allBadges.find((b) => b.slug === check.slug);
    if (!badge) continue;

    if (check.check(stats)) {
      newBadges.push(badge);
    }
  }

  // Award new badges
  if (newBadges.length > 0) {
    const inserts = newBadges.map((badge) => ({
      user_id: userId,
      badge_id: badge.id,
    }));

    await supabase.from("user_badges").insert(inserts);

    // Add to activity feed
    const feedItems = newBadges.map((badge) => ({
      challenge_id: challengeId,
      user_id: userId,
      event_type: "badge",
      event_data: {
        badge_id: badge.id,
        badge_name: badge.name,
        badge_icon: badge.icon,
        badge_description: badge.description,
      },
    }));

    await supabase.from("activity_feed").insert(feedItems);
  }

  return newBadges;
}

// Get activity feed
export async function getActivityFeed(
  supabase: SupabaseClient,
  challengeId: string,
  limit = 50,
  offset = 0
): Promise<ActivityFeedItem[]> {
  const { data } = await supabase
    .from("activity_feed")
    .select("*, user:users(name, email)")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data as ActivityFeedItem[]) || [];
}

// Add activity to feed
export async function addActivityToFeed(
  supabase: SupabaseClient,
  challengeId: string,
  userId: string,
  activityData: {
    activity_id: string;
    distance_km: number;
    activity_type: string;
    duration_minutes?: number;
  }
): Promise<void> {
  await supabase.from("activity_feed").insert({
    challenge_id: challengeId,
    user_id: userId,
    event_type: "activity",
    event_data: activityData,
  });
}

// Get cheers for an activity
export async function getActivityCheers(
  supabase: SupabaseClient,
  activityId: string
) {
  const { data } = await supabase
    .from("activity_cheers")
    .select("*, user:users(name, email)")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });
  return data || [];
}

// Add/update cheer on activity
export async function addCheer(
  supabase: SupabaseClient,
  activityId: string,
  userId: string,
  emoji: string
): Promise<void> {
  // Upsert the cheer (one per user per activity)
  await supabase.from("activity_cheers").upsert(
    {
      activity_id: activityId,
      user_id: userId,
      emoji,
    },
    {
      onConflict: "activity_id,user_id",
    }
  );
}

// Remove cheer
export async function removeCheer(
  supabase: SupabaseClient,
  activityId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("activity_cheers")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", userId);
}

// Get cheer counts for multiple activities
export async function getCheerCounts(
  supabase: SupabaseClient,
  activityIds: string[]
): Promise<Record<string, { count: number; emojis: string[] }>> {
  if (activityIds.length === 0) return {};

  const { data } = await supabase
    .from("activity_cheers")
    .select("activity_id, emoji")
    .in("activity_id", activityIds);

  const counts: Record<string, { count: number; emojis: string[] }> = {};
  for (const id of activityIds) {
    counts[id] = { count: 0, emojis: [] };
  }

  for (const cheer of data || []) {
    if (counts[cheer.activity_id]) {
      counts[cheer.activity_id].count++;
      if (cheer.emoji && !counts[cheer.activity_id].emojis.includes(cheer.emoji)) {
        counts[cheer.activity_id].emojis.push(cheer.emoji);
      }
    }
  }

  return counts;
}

// Check if user has cheered an activity
export async function hasUserCheered(
  supabase: SupabaseClient,
  activityId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("activity_cheers")
    .select("emoji")
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .single();
  return data?.emoji || null;
}

// Update personal best if needed
export async function updatePersonalBest(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string,
  recordType: PersonalBest["record_type"],
  newValue: number,
  activityId?: string
): Promise<boolean> {
  // Check existing PB
  const { data: existing } = await supabase
    .from("personal_bests")
    .select("value")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .eq("record_type", recordType)
    .single();

  if (existing && existing.value >= newValue) {
    return false; // Not a new PB
  }

  // Upsert the new PB
  await supabase.from("personal_bests").upsert(
    {
      user_id: userId,
      challenge_id: challengeId,
      record_type: recordType,
      value: newValue,
      activity_id: activityId || null,
      achieved_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,challenge_id,record_type",
    }
  );

  // Add to feed if it's a new PB
  if (existing) {
    await supabase.from("activity_feed").insert({
      challenge_id: challengeId,
      user_id: userId,
      event_type: "pb",
      event_data: {
        record_type: recordType,
        old_value: existing.value,
        new_value: newValue,
      },
    });
  }

  return true;
}

// Get user's personal bests
export async function getPersonalBests(
  supabase: SupabaseClient,
  userId: string,
  challengeId: string
): Promise<PersonalBest[]> {
  const { data } = await supabase
    .from("personal_bests")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId);
  return (data as PersonalBest[]) || [];
}
