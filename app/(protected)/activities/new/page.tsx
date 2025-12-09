import { addActivityAction } from "@/app/actions";
import { requireSession } from "@/lib/auth";
import { getActiveChallenge } from "@/lib/challenge";
import { todayLocalIso } from "@/lib/week";
import { ActivityForm } from "@/components/activity-form";

export default async function NewActivityPage() {
  const { supabase } = await requireSession();
  const challenge = await getActiveChallenge(supabase);
  const today = todayLocalIso();

  return (
    <div className="max-w-2xl animate-slide-up">
      <h1 className="text-2xl font-semibold text-olive">Add activity</h1>
      <p className="mt-1 text-sm text-olive/70">
        Log run / walk / jog distance toward your weekly {challenge.weekly_distance_target_km} km goal.
      </p>

      <ActivityForm
        action={addActivityAction}
        today={today}
        weekStartDay={challenge.week_start_day}
        targetKm={challenge.weekly_distance_target_km}
      />
    </div>
  );
}
