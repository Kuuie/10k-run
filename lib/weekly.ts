import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivitiesRow, ChallengesRow, Database } from "./supabase/types";
import { getWeekRange } from "./week";

export const recomputeWeeklyResult = async (
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    challenge: ChallengesRow;
    activityDate: string;
  }
) => {
  const { userId, challenge, activityDate } = params;
  const range = getWeekRange(new Date(activityDate), challenge.week_start_day);
  const startIso = range.start.toISOString().slice(0, 10);
  const endIso = range.end.toISOString().slice(0, 10);

  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("distance_km")
    .eq("user_id", userId)
    .eq("challenge_id", challenge.id)
    .gte("activity_date", startIso)
    .lte("activity_date", endIso);

  if (activitiesError) throw activitiesError;

  const total = (activities as ActivitiesRow[] | null)?.reduce(
    (sum, row) => sum + Number(row.distance_km ?? 0),
    0
  ) as number;

  const { data: existing } = await supabase
    .from("weekly_results")
    .select("id, overridden_by_admin, met_target")
    .eq("user_id", userId)
    .eq("challenge_id", challenge.id)
    .eq("week_start_date", startIso)
    .maybeSingle();

  const metTarget =
    (existing as any)?.overridden_by_admin && (existing as any)?.met_target !== null
      ? (existing as any)?.met_target
      : total >= Number(challenge.weekly_distance_target_km);

  const { error: upsertError } = await supabase
    .from("weekly_results")
    .upsert({
      id: (existing as any)?.id,
      user_id: userId,
      challenge_id: challenge.id,
      week_start_date: startIso,
      week_end_date: endIso,
      total_distance_km: total,
      met_target: metTarget,
      overridden_by_admin: (existing as any)?.overridden_by_admin ?? false,
    } as any);

  if (upsertError) throw upsertError;
};
