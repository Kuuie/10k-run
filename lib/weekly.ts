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

  // Get rollover from excused weeks prior to this week
  const { data: excusedWeeks } = await supabase
    .from("weekly_results")
    .select("id, rollover_km")
    .eq("user_id", userId)
    .eq("challenge_id", challenge.id)
    .eq("excused", true)
    .lt("week_start_date", startIso)
    .gt("rollover_km", 0);

  const totalRollover = (excusedWeeks || []).reduce(
    (sum, row) => sum + Number((row as any).rollover_km || 0),
    0
  );

  const baseTarget = Number(challenge.weekly_distance_target_km);
  const targetWithRollover = baseTarget + totalRollover;

  const metTarget =
    (existing as any)?.overridden_by_admin && (existing as any)?.met_target !== null
      ? (existing as any)?.met_target
      : total >= targetWithRollover;

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

  // If user met target including rollover, clear the rollover from excused weeks
  if (total >= targetWithRollover && excusedWeeks && excusedWeeks.length > 0) {
    const excusedIds = excusedWeeks.map((w) => (w as any).id);
    await (supabase.from("weekly_results") as any)
      .update({ rollover_km: 0 })
      .in("id", excusedIds);
  }
};
