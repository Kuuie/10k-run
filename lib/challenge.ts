import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActivitiesRow,
  ChallengesRow,
  Database,
  UserProfile,
  WeeklyResultsRow,
} from "./supabase/types";
import { getWeekRange } from "./week";

export const getActiveChallenge = async (
  supabase: SupabaseClient<Database>
): Promise<ChallengesRow> => {
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const start = new Date();
  const payload: Partial<ChallengesRow> = {
    name: "10K Weekly Movement Challenge",
    description: "Run / walk / jog 10 km every week.",
    start_date: start.toISOString().slice(0, 10),
    week_start_day: 0,
    weekly_distance_target_km: 10,
    created_by: null as string | null,
  };

  const { data: created, error: createError } = await supabase
    .from("challenges")
    .insert(payload)
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
};

export const getUserActivities = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  challengeId: string,
  limit = 10
) => {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .order("activity_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ActivitiesRow[];
};

export const getUserWeeklyResults = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  challengeId: string,
  limit = 12
) => {
  const { data, error } = await supabase
    .from("weekly_results")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .order("week_start_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as WeeklyResultsRow[];
};

export const getCurrentWeekLeaderboard = async (
  supabase: SupabaseClient<Database>,
  challenge: ChallengesRow
) => {
  const week = getWeekRange(new Date(), challenge.week_start_day);
  const startIso = week.start.toISOString().slice(0, 10);
  const endIso = week.end.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("activities")
    .select("user_id, distance_km, users(name,email)")
    .eq("challenge_id", challenge.id)
    .gte("activity_date", startIso)
    .lte("activity_date", endIso);

  if (error) throw error;

  const totals = new Map<
    string,
    { total: number; user: Pick<UserProfile, "name" | "email"> | null }
  >();

  (data ?? []).forEach((row) => {
    const total = totals.get(row.user_id)?.total ?? 0;
    totals.set(row.user_id, {
      total: total + Number(row.distance_km ?? 0),
      user: (row as any).users ?? null,
    });
  });

  return Array.from(totals.entries())
    .map(([userId, { total, user }]) => ({
      userId,
      total,
      status: total >= challenge.weekly_distance_target_km ? "✅" : "❌",
      name: user?.name ?? user?.email ?? "Anon",
      email: user?.email ?? "",
    }))
    .sort((a, b) => b.total - a.total);
};

export const getOverallStats = async (
  supabase: SupabaseClient<Database>,
  challenge: ChallengesRow
) => {
  const { data, error } = await supabase
    .from("weekly_results")
    .select("user_id, total_distance_km, met_target, users(name,email), week_start_date")
    .eq("challenge_id", challenge.id);

  if (error) throw error;

  const totals = new Map<
    string,
    {
      totalKm: number;
      streak: number;
      user: Pick<UserProfile, "name" | "email"> | null;
      weeks: { week_start_date: string; met_target: boolean }[];
    }
  >();

  (data ?? []).forEach((row) => {
    const current = totals.get(row.user_id) ?? {
      totalKm: 0,
      streak: 0,
      weeks: [],
      user: (row as any).users ?? null,
    };
    current.totalKm += Number(row.total_distance_km ?? 0);
    current.weeks.push({
      week_start_date: row.week_start_date,
      met_target: row.met_target,
    });
    totals.set(row.user_id, current);
  });

  return Array.from(totals.entries()).map(([userId, entry]) => ({
    userId,
    totalKm: entry.totalKm,
    weeks: entry.weeks,
    name: entry.user?.name ?? entry.user?.email ?? "Anon",
    email: entry.user?.email ?? "",
  }));
};

export const redirectIfInactive = (profile: UserProfile | null) => {
  if (profile && profile.active === false) {
    redirect("/?inactive=1");
  }
};
