import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Badge, UserBadge, ActivitiesRow, WeeklyResultsRow } from "./supabase/types";
import { calculateStreak, getCurrentWeekRange, formatDateLocal } from "./week";

// Badge definitions with check functions
export const BADGE_CHECKS: Record<string, {
  check: (ctx: BadgeContext) => boolean;
  slug: string;
}> = {
  first_activity: {
    slug: "first_activity",
    check: (ctx) => ctx.totalActivities >= 1,
  },
  first_week: {
    slug: "first_week",
    check: (ctx) => ctx.weeksCompleted >= 1,
  },
  streak_3: {
    slug: "streak_3",
    check: (ctx) => ctx.streak >= 3,
  },
  streak_5: {
    slug: "streak_5",
    check: (ctx) => ctx.streak >= 5,
  },
  streak_10: {
    slug: "streak_10",
    check: (ctx) => ctx.streak >= 10,
  },
  distance_50: {
    slug: "distance_50",
    check: (ctx) => ctx.totalKm >= 50,
  },
  distance_100: {
    slug: "distance_100",
    check: (ctx) => ctx.totalKm >= 100,
  },
  distance_250: {
    slug: "distance_250",
    check: (ctx) => ctx.totalKm >= 250,
  },
  early_bird: {
    slug: "early_bird",
    check: (ctx) => ctx.hasEarlyBird,
  },
  consistent: {
    slug: "consistent",
    check: (ctx) => ctx.hasConsistentWeek,
  },
};

export type BadgeContext = {
  totalActivities: number;
  totalKm: number;
  weeksCompleted: number;
  streak: number;
  hasEarlyBird: boolean;
  hasConsistentWeek: boolean;
};

export function buildBadgeContext(
  activities: ActivitiesRow[],
  weeklyResults: WeeklyResultsRow[],
  challengeStartDate: Date,
  weekStartDay: number,
  targetKm: number
): BadgeContext {
  const totalActivities = activities.length;
  const totalKm = activities.reduce((sum, a) => sum + Number(a.distance_km), 0);
  const weeksCompleted = weeklyResults.filter(w => w.met_target).length;

  const streak = calculateStreak(
    weeklyResults.map(w => ({ week_start_date: w.week_start_date, met_target: w.met_target })),
    challengeStartDate,
    weekStartDay
  );

  // Check for early bird (target met by Wednesday)
  const hasEarlyBird = checkEarlyBird(activities, weeklyResults, weekStartDay, targetKm);

  // Check for consistent week (5+ different days)
  const hasConsistentWeek = checkConsistentWeek(activities, weekStartDay);

  return {
    totalActivities,
    totalKm,
    weeksCompleted,
    streak,
    hasEarlyBird,
    hasConsistentWeek,
  };
}

function checkEarlyBird(
  activities: ActivitiesRow[],
  weeklyResults: WeeklyResultsRow[],
  weekStartDay: number,
  targetKm: number
): boolean {
  // Group activities by week and check if any week hit target by Wednesday
  const actsByWeek = new Map<string, number>();

  for (const act of activities) {
    const actDate = new Date(act.activity_date + "T00:00:00Z");
    const week = getCurrentWeekRange(weekStartDay);
    // Get which day of week (0-6, where weekStartDay is 0)
    const dayOfWeek = (actDate.getUTCDay() - weekStartDay + 7) % 7;

    // We need to track cumulative by week and day
    // Simplified: check if target was met and activity was logged early
    const weekKey = formatDateLocal(new Date(act.activity_date));

    // For simplicity, just check if they have activities on Mon-Wed that sum to target
    if (dayOfWeek <= 2) { // Mon, Tue, Wed (first 3 days of week)
      // Group by actual week start
      const week = getCurrentWeekRange(weekStartDay);
      const weekStart = formatDateLocal(week.start);
      const current = actsByWeek.get(weekStart) || 0;
      actsByWeek.set(weekStart, current + Number(act.distance_km));
    }
  }

  return Array.from(actsByWeek.values()).some(km => km >= targetKm);
}

function checkConsistentWeek(activities: ActivitiesRow[], weekStartDay: number): boolean {
  // Check if any week has activities on 5+ different days
  const weekDays = new Map<string, Set<string>>();

  for (const act of activities) {
    const actDate = new Date(act.activity_date + "T00:00:00Z");
    // Get week start for this activity
    const week = getCurrentWeekRange(weekStartDay);
    const weekKey = formatDateLocal(week.start);

    if (!weekDays.has(weekKey)) {
      weekDays.set(weekKey, new Set());
    }
    weekDays.get(weekKey)!.add(act.activity_date);
  }

  return Array.from(weekDays.values()).some(days => days.size >= 5);
}

export async function getUserBadges(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(UserBadge & { badge: Badge })[]> {
  // Using any to work around table not being in generated types yet
  const { data, error } = await (supabase as any)
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user badges:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    badge_id: row.badge_id,
    earned_at: row.earned_at,
    badge: row.badges,
  }));
}

export async function getAllBadges(
  supabase: SupabaseClient<Database>
): Promise<Badge[]> {
  // Using any to work around table not being in generated types yet
  const { data, error } = await (supabase as any)
    .from("badges")
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }

  return (data || []) as Badge[];
}

export async function awardBadge(
  supabase: SupabaseClient<Database>,
  userId: string,
  badgeId: string
): Promise<boolean> {
  // Using any to work around table not being in generated types yet
  const { error } = await (supabase as any)
    .from("user_badges")
    .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: "user_id,badge_id" });

  if (error) {
    console.error("Error awarding badge:", error);
    return false;
  }
  return true;
}

export async function checkAndAwardBadges(
  supabase: SupabaseClient<Database>,
  userId: string,
  context: BadgeContext,
  existingBadges: UserBadge[]
): Promise<string[]> {
  // Get all available badges
  const allBadges = await getAllBadges(supabase);
  const earnedSlugs = new Set(existingBadges.map(ub => ub.badge?.slug));
  const newlyEarned: string[] = [];

  for (const badge of allBadges) {
    if (earnedSlugs.has(badge.slug)) continue;

    const checkFn = BADGE_CHECKS[badge.slug];
    if (checkFn && checkFn.check(context)) {
      const success = await awardBadge(supabase, userId, badge.id);
      if (success) {
        newlyEarned.push(badge.slug);
      }
    }
  }

  return newlyEarned;
}
