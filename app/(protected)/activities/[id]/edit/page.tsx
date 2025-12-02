import { notFound } from "next/navigation";
import { deleteActivityAction, updateActivityAction } from "@/app/actions";
import { fetchProfile, requireSession } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { todayLocalIso } from "@/lib/week";
import type { ActivitiesRow } from "@/lib/supabase/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PendingButton } from "@/components/pending-button";

export default async function EditActivityPage({
  params,
}: {
  params: { id: string };
}) {
  if (!params.id || !/^[0-9a-fA-F-]{36}$/.test(params.id)) {
    notFound();
  }
  const { supabase, userId } = await requireSession();
  const profile = await fetchProfile(supabase, userId);
  const challenge = await getActiveChallenge(supabase);
  const adminClient = createAdminSupabaseClient();
  let activity: ActivitiesRow | null = null;
  try {
    const client = profile?.role === "admin" ? adminClient : supabase;
    const query = client.from("activities").select("*").eq("id", params.id);
    if (profile?.role !== "admin") {
      query.eq("user_id", userId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) activity = data as ActivitiesRow;
  } catch (err) {
    console.error("Failed to load activity", err);
  }

  if (!activity) {
    return (
      <div className="max-w-2xl animate-slide-up">
        <h1 className="text-2xl font-semibold">Activity not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          Either this activity does not exist or you do not have access.
        </p>
      </div>
    );
  }

  const activityData = activity as ActivitiesRow;
  const deleteAction = deleteActivityAction.bind(null, params.id);
  const updateAction = updateActivityAction.bind(null, params.id);

  return (
    <div className="max-w-2xl animate-slide-up">
      <h1 className="text-2xl font-semibold">Edit activity</h1>
      <form
        action={updateAction}
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Activity type
            <select
              name="activity_type"
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
              defaultValue={activityData?.activity_type ?? "run"}
            >
              <option value="run">Run</option>
              <option value="walk">Walk</option>
              <option value="jog">Jog</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date
            <input
              name="activity_date"
              type="date"
              defaultValue={activityData?.activity_date ?? todayLocalIso()}
              max={todayLocalIso()}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Distance (km)
            <input
              name="distance_km"
              type="number"
              min="0.1"
              step="0.1"
              required
              defaultValue={activityData?.distance_km ?? 0}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Duration (minutes)
            <input
              name="duration_minutes"
              type="number"
              min="0"
              step="1"
              defaultValue={activityData?.duration_minutes ?? undefined}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Proof URL
          <input
            name="proof_url"
            type="url"
            defaultValue={activityData?.proof_url ?? undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Screenshot URL
          <input
            name="screenshot_url"
            type="url"
            defaultValue={activityData?.screenshot_url ?? undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
          <p className="text-xs text-slate-500">
            TODO: add OCR to parse distance from uploaded screenshots.
          </p>
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Week start: {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][challenge.week_start_day]} • Target:{" "}
            {challenge.weekly_distance_target_km} km
          </p>
          <div className="flex gap-3">
            <button
              formAction={deleteAction}
              className="rounded-xl border border-red-200 px-4 py-2 text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
            <PendingButton label="Save changes" />
          </div>
        </div>
      </form>
    </div>
  );
}
