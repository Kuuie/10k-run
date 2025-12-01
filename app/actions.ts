'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getActiveChallenge } from "@/lib/challenge";
import { recomputeWeeklyResult } from "@/lib/weekly";
import type { ChallengesRow, TablesInsert } from "@/lib/supabase/types";

export type SignInState = {
  message?: string;
  error?: string;
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
    week_start_day: 0,
    weekly_distance_target_km: 10,
    created_by: userId,
  };

  const { data: created, error: createError } = await supabase
    .from("challenges")
    .insert([payload])
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
  const base =
    process.env.SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
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
    activity_type: (formData.get("activity_type") as string) ?? "run",
    proof_url: (formData.get("proof_url") as string) || null,
    screenshot_url: (formData.get("screenshot_url") as string) || null,
  };

  await supabase.from("activities").insert(payload);
  await recomputeWeeklyResult(supabase, {
    userId: session.user.id,
    challenge,
    activityDate: payload.activity_date,
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

  const challenge = await getActiveChallenge(supabase);
  const payload = {
    activity_date: String(formData.get("activity_date") ?? "").slice(0, 10),
    distance_km: Number(formData.get("distance_km") ?? 0),
    duration_minutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : null,
    activity_type: (formData.get("activity_type") as string) ?? "run",
    proof_url: (formData.get("proof_url") as string) || null,
    screenshot_url: (formData.get("screenshot_url") as string) || null,
  };

  await supabase
    .from("activities")
    .update(payload)
    .eq("id", activityId)
    .eq("user_id", session.user.id);

  await recomputeWeeklyResult(supabase, {
    userId: session.user.id,
    challenge,
    activityDate: payload.activity_date,
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
  const challenge = await getActiveChallenge(supabase);

  const { data: activity } = await supabase
    .from("activities")
    .select("activity_date")
    .eq("id", activityId)
    .maybeSingle();

  await supabase.from("activities").delete().eq("id", activityId);

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
