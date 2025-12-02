import { addActivityAction } from "@/app/actions";
import { requireSession } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { todayLocalIso } from "@/lib/week";
import { PendingButton } from "@/components/pending-button";

export default async function NewActivityPage() {
  const { supabase } = await requireSession();
  const challenge = await getActiveChallenge(supabase);
  const today = todayLocalIso();

  return (
    <div className="max-w-2xl animate-slide-up">
      <h1 className="text-2xl font-semibold">Add activity</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-darkTheme-text-secondary">
        Log run / walk / jog distance toward your weekly {challenge.weekly_distance_target_km} km goal.
      </p>

      <form action={addActivityAction} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
            Activity type
            <select
              name="activity_type"
              className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
              defaultValue="run"
            >
              <option value="run">Run</option>
              <option value="walk">Walk</option>
              <option value="jog">Jog</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
            Date
            <input
              name="activity_date"
              type="date"
              max={today}
              defaultValue={today}
              className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
            Distance (km)
            <input
              name="distance_km"
              type="number"
              min="0.1"
              step="0.1"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
            Duration (minutes, optional)
            <input
              name="duration_minutes"
              type="number"
              min="0"
              step="1"
              className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
          Proof URL (Strava / Garmin)
          <input
            name="proof_url"
            type="url"
            placeholder="https://www.strava.com/activities/123"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-darkTheme-text-primary">
          Screenshot URL (optional)
          <input
            name="screenshot_url"
            type="url"
            placeholder="Upload to Supabase Storage then paste URL"
            className="rounded-xl border border-slate-200 px-3 py-2 text-base dark:border-darkTheme-border dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
          />
          <p className="text-xs text-slate-500 dark:text-darkTheme-text-secondary">
            TODO: hook up OCR to auto-suggest distance from screenshot.
          </p>
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-darkTheme-text-secondary">
            Week start: {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][challenge.week_start_day]} • Target: {challenge.weekly_distance_target_km} km
          </p>
          <PendingButton label="Save activity" />
        </div>
      </form>
    </div>
  );
}
