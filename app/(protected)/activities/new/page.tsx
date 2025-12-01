import { addActivityAction } from "@/app/actions";
import { requireSession } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { formatDateLocal } from "@/lib/week";

export default async function NewActivityPage() {
  const { supabase } = await requireSession();
  const challenge = await getActiveChallenge(supabase);
  const today = formatDateLocal(new Date());

  return (
    <div className="max-w-2xl animate-slide-up">
      <h1 className="text-2xl font-semibold">Add activity</h1>
      <p className="mt-1 text-sm text-slate-600">
        Log run / walk / jog distance toward your weekly {challenge.weekly_distance_target_km} km goal.
      </p>

      <form action={addActivityAction} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Activity type
            <select
              name="activity_type"
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
              defaultValue="run"
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
              max={today}
              defaultValue={today}
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Duration (minutes, optional)
            <input
              name="duration_minutes"
              type="number"
              min="0"
              step="1"
              className="rounded-xl border border-slate-200 px-3 py-2 text-base"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Proof URL (Strava / Garmin)
          <input
            name="proof_url"
            type="url"
            placeholder="https://www.strava.com/activities/123"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Screenshot URL (optional)
          <input
            name="screenshot_url"
            type="url"
            placeholder="Upload to Supabase Storage then paste URL"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base"
          />
          <p className="text-xs text-slate-500">
            TODO: hook up OCR to auto-suggest distance from screenshot.
          </p>
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Week start: {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][challenge.week_start_day]} • Target: {challenge.weekly_distance_target_km} km
          </p>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-white transition hover:bg-indigo-500"
          >
            Save activity
          </button>
        </div>
      </form>
    </div>
  );
}
