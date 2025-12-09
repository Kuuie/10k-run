"use client";

import { useState } from "react";
import { PendingButton } from "./pending-button";
import { QuickPresets } from "./quick-presets";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

type ActivityFormProps = {
  action: (formData: FormData) => Promise<void>;
  today: string;
  weekStartDay: number;
  targetKm: number;
};

export function ActivityForm({ action, today, weekStartDay, targetKm }: ActivityFormProps) {
  const [activityType, setActivityType] = useState("run");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [activityDate, setActivityDate] = useState(today);

  const handlePresetSelect = (preset: {
    name: string;
    distance_km: number;
    duration_minutes: number | null;
    activity_type: "run" | "walk" | "jog";
  }) => {
    setActivityType(preset.activity_type);
    setDistanceKm(preset.distance_km.toString());
    if (preset.duration_minutes) {
      setDurationMinutes(preset.duration_minutes.toString());
    }
  };

  return (
    <form action={action} className="mt-6 space-y-4 rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover animate-slide-up delay-1">
      {/* Quick Presets */}
      <QuickPresets onSelect={handlePresetSelect} />

      <div className="border-t border-cream-dark pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-olive">
            Activity type
            <select
              name="activity_type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
            >
              <option value="run">Run</option>
              <option value="walk">Walk</option>
              <option value="jog">Jog</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-olive">
            Date
            <input
              name="activity_date"
              type="date"
              max={today}
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
              required
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-olive">
            Distance (km)
            <input
              name="distance_km"
              type="number"
              min="0.1"
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              required
              className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-olive">
            Duration (minutes, optional)
            <input
              name="duration_minutes"
              type="number"
              min="0"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
            />
          </label>
        </div>
        <div className="mt-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-olive">
            Proof URL (Strava / Garmin)
            <input
              name="proof_url"
              type="url"
              placeholder="https://www.strava.com/activities/123"
              className="rounded-xl border border-cream-dark bg-background px-3 py-2 text-base text-olive"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-olive/60">
            Week start: {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][weekStartDay]} • Target: {targetKm} km
          </p>
          <PendingButton label="Save activity" />
        </div>
      </div>
    </form>
  );
}
