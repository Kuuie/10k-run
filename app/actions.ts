'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getActiveChallenge } from "@/lib/challenge";
import { recomputeWeeklyResult } from "@/lib/weekly";
import type {
  ActivitiesRow,
  ChallengesRow,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/types";
import { fetchProfile } from "@/lib/auth";

export type SignInState = {
  message?: string;
  error?: string;
};

const getSiteBase = () => {
  const envUrl =
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    process.env.NEXT_PUBLIC_SITE_URL;
  const trimmed = (envUrl || "").replace(/\/$/, "");
  if (trimmed) return trimmed;
  return process.env.NODE_ENV === "production"
    ? "https://10k-run.vercel.app"
    : "http://localhost:3000";
};

const getOrCreateChallenge = async (
  userId: string | null,
  fallbackName = "10K Weekly Movement Challenge"
): Promise<ChallengesRow> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const start = new Date();
  const payload: TablesInsert<"challenges"> = {
    name: fallbackName,
    description: "Run / walk / jog 10 km every week.",
    start_date: start.toISOString().slice(0, 10),
    week_start_day: 1, // Monday start
    weekly_distance_target_km: 10,
    created_by: userId,
  };

  const { data: created, error: createError } = await supabase
    .from("challenges")
    // Using any here to avoid overly narrow inferred types from supabase-js.
    .insert(payload as any)
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
};

export const signInWithEmail = async (
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> => {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { error: "Supabase URL or anon key is not configured" };
  }

  const supabase = await createServerSupabaseClient();
  const base = getSiteBase();
  const redirectTo = `${base}/auth/callback?next=/dashboard`;

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      return { error: error.message };
    }
    return { message: "Check your email for the sign-in link." };
  } catch (err: any) {
    return { error: err?.message || "Sign-in request failed" };
  }
};

export const signInWithPassword = async (
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> => {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { error: "Email is required" };
  }
  if (!password) {
    return { error: "Password is required" };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
  } catch (err: any) {
    return { error: err?.message || "Sign-in failed" };
  }

  redirect("/dashboard");
};

export const signUpWithPassword = async (
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> => {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email) {
    return { error: "Email is required" };
  }
  if (!password) {
    return { error: "Password is required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createServerSupabaseClient();
  const base = getSiteBase();
  const redirectTo = `${base}/auth/callback?next=/dashboard`;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { name },
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { message: "Check your email to confirm your account." };
  } catch (err: any) {
    return { error: err?.message || "Sign-up failed" };
  }
};

export const updatePasswordAction = async (
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> => {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password) {
    return { error: "Password is required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { message: "Password updated successfully!" };
};

export const signOutAction = async () => {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
};

export const addActivityAction = async (formData: FormData) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const challenge = await getOrCreateChallenge(session.user.id);
  const payload = {
    user_id: session.user.id,
    challenge_id: challenge.id,
    activity_date: String(formData.get("activity_date") ?? "").slice(0, 10),
    distance_km: Number(formData.get("distance_km") ?? 0),
    duration_minutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : null,
    activity_type:
      ((formData.get("activity_type") as ActivitiesRow["activity_type"]) ??
        "run") as ActivitiesRow["activity_type"],
    proof_url: (formData.get("proof_url") as string) || null,
    screenshot_url: (formData.get("screenshot_url") as string) || null,
  };

  await supabase.from("activities").insert(payload);
  await recomputeWeeklyResult(supabase, {
    userId: session.user.id,
    challenge,
    activityDate: payload.activity_date || String(formData.get("activity_date") ?? "").slice(0, 10),
  });

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  redirect("/dashboard");
};

export const updateActivityAction = async (
  activityId: string,
  formData: FormData
) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");
  const profile = await fetchProfile(supabase, session.user.id);
  const adminClient = createAdminSupabaseClient();

  const challenge = await getActiveChallenge(supabase);
  const payload: TablesUpdate<"activities"> = {
    activity_date: String(formData.get("activity_date") ?? "").slice(0, 10),
    distance_km: Number(formData.get("distance_km") ?? 0),
    duration_minutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : null,
    activity_type:
      ((formData.get("activity_type") as ActivitiesRow["activity_type"]) ??
        "run") as ActivitiesRow["activity_type"],
    proof_url: (formData.get("proof_url") as string) || null,
    screenshot_url: (formData.get("screenshot_url") as string) || null,
  };

  if (profile?.role === "admin") {
    const adminActivities = adminClient.from("activities" as any);
    await (adminActivities as any)
      .update(payload as any)
      .eq("id", activityId);
  } else {
    await supabase
      .from("activities")
      .update(payload)
      .eq("id", activityId)
      .eq("user_id", session.user.id);
  }

  await recomputeWeeklyResult(supabase, {
    userId: session.user.id,
    challenge,
    activityDate:
      payload.activity_date || String(formData.get("activity_date") ?? "").slice(0, 10),
  });

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  redirect("/dashboard");
};

export const deleteActivityAction = async (activityId: string) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");
  const profile = await fetchProfile(supabase, session.user.id);
  const adminClient = createAdminSupabaseClient();
  const challenge = await getActiveChallenge(supabase);

  const { data: activity } = await supabase
    .from("activities")
    .select("activity_date")
    .eq("id", activityId)
    .maybeSingle();

  if (profile?.role === "admin") {
    await adminClient.from("activities").delete().eq("id", activityId);
  } else {
    await supabase
      .from("activities")
      .delete()
      .eq("id", activityId)
      .eq("user_id", session.user.id);
  }

  if (activity?.activity_date) {
    await recomputeWeeklyResult(supabase, {
      userId: session.user.id,
      challenge,
      activityDate: activity.activity_date,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
};

export const updateProfileAction = async (formData: FormData) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const name = String(formData.get("name") ?? "").trim() || null;
  await supabase.from("users").update({ name }).eq("id", session.user.id);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
};

export const disconnectStravaAction = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { error: "Not authenticated" };

  await supabase.from("strava_connections").delete().eq("user_id", session.user.id);
  revalidatePath("/profile");
  return { success: true };
};

export const inviteUserAction = async (formData: FormData) => {
  const adminClient = createAdminSupabaseClient();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!email) return { error: "Email is required" };

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name },
  });
  if (error) return { error: error.message };

  const supabase = await createServerSupabaseClient();
  await supabase.from("users").upsert({
    id: data.user.id,
    email,
    name: name || null,
  });

  revalidatePath("/admin");
  return { message: "Invite sent" };
};

export const toggleUserActiveAction = async (
  userId: string,
  nextActive: boolean
) => {
  const supabase = await createServerSupabaseClient();
  await supabase.from("users").update({ active: nextActive }).eq("id", userId);
  revalidatePath("/admin");
};

export const overrideWeeklyResultAction = async (
  resultId: string,
  metTarget: boolean
) => {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("weekly_results")
    .update({ met_target: metTarget, overridden_by_admin: true })
    .eq("id", resultId);
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
};

export const createWeeklyResultAction = async (
  userId: string,
  weekStartDate: string,
  weekEndDate: string
) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();
  const challenge = await getActiveChallenge(supabase);

  // Check if result already exists
  const { data: existing } = await adminClient
    .from("weekly_results")
    .select("id")
    .eq("user_id", userId)
    .eq("challenge_id", challenge.id)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (existing) {
    return { error: "Weekly result already exists" };
  }

  // Create empty weekly result
  await (adminClient.from("weekly_results") as any).insert({
    user_id: userId,
    challenge_id: challenge.id,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    total_distance_km: 0,
    met_target: false,
    overridden_by_admin: false,
    excused: false,
    rollover_km: 0,
  });

  revalidatePath("/admin");
  return { message: "Weekly result created" };
};

export const excuseWeekAction = async (
  resultId: string,
  excuse: boolean
) => {
  const supabase = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  // Get the weekly result to calculate rollover
  const { data: result } = await adminClient
    .from("weekly_results")
    .select("*, challenges(weekly_distance_target_km)")
    .eq("id", resultId)
    .single();

  if (!result) return;

  const target = Number((result as any).challenges?.weekly_distance_target_km ?? 10);
  const actual = Number((result as any).total_distance_km ?? 0);
  const rollover = excuse ? Math.max(0, target - actual) : 0;

  await (adminClient.from("weekly_results") as any)
    .update({
      excused: excuse,
      rollover_km: rollover,
      // When excused, mark as met for streak purposes
      met_target: excuse ? true : actual >= target,
      overridden_by_admin: true,
    })
    .eq("id", resultId);

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
};

export const clearRolloverAction = async (resultId: string) => {
  const adminClient = createAdminSupabaseClient();

  await (adminClient.from("weekly_results") as any)
    .update({ rollover_km: 0 })
    .eq("id", resultId);

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
};

// Gamification actions
import {
  checkAndAwardBadges,
  addCheer as addCheerLib,
  removeCheer as removeCheerLib,
  addActivityToFeed,
  updatePersonalBest,
} from "@/lib/gamification";
import { getWeekRange, formatDateLocal } from "@/lib/week";

export const cheerActivityAction = async (
  activityId: string,
  emoji: string
) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { error: "Not authenticated" };

  await addCheerLib(supabase, activityId, session.user.id, emoji);
  revalidatePath("/dashboard");
  revalidatePath("/feed");
  return { success: true };
};

export const removeCheerAction = async (activityId: string) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { error: "Not authenticated" };

  await removeCheerLib(supabase, activityId, session.user.id);
  revalidatePath("/dashboard");
  revalidatePath("/feed");
  return { success: true };
};

export const checkBadgesAction = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return { newBadges: [] };

  const challenge = await getActiveChallenge(supabase);
  const now = new Date();
  const week = getWeekRange(now, challenge.week_start_day);
  const weekStartIso = formatDateLocal(week.start);
  const weekEndIso = formatDateLocal(week.end);

  const newBadges = await checkAndAwardBadges(
    supabase,
    session.user.id,
    challenge.id,
    weekStartIso,
    weekEndIso,
    Number(challenge.weekly_distance_target_km)
  );

  if (newBadges.length > 0) {
    revalidatePath("/stats");
    revalidatePath("/dashboard");
  }

  return { newBadges };
};
