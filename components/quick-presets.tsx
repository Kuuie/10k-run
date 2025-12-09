"use client";

import { useState } from "react";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

type Preset = {
  id: string;
  name: string;
  distance_km: number;
  duration_minutes: number | null;
  activity_type: "run" | "walk" | "jog";
};

// Default presets for users without saved ones
const DEFAULT_PRESETS: Preset[] = [
  { id: "default-1", name: "Quick 5K", distance_km: 5, duration_minutes: 30, activity_type: "run" },
  { id: "default-2", name: "Morning Walk", distance_km: 3, duration_minutes: 45, activity_type: "walk" },
  { id: "default-3", name: "10K Run", distance_km: 10, duration_minutes: 60, activity_type: "run" },
];

type QuickPresetsProps = {
  presets?: Preset[];
  onSelect: (preset: Preset) => void;
};

export function QuickPresets({ presets = DEFAULT_PRESETS, onSelect }: QuickPresetsProps) {
  const displayPresets = presets.length > 0 ? presets : DEFAULT_PRESETS;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-olive/70 uppercase tracking-wide">Quick add</p>
      <div className="flex flex-wrap gap-2">
        {displayPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className="flex items-center gap-1.5 rounded-full bg-sage-light px-3 py-1.5 text-sm font-medium text-sage-dark transition hover:bg-sage hover:text-white"
          >
            <Icon
              name={
                preset.activity_type === "run"
                  ? "directions_run"
                  : preset.activity_type === "walk"
                  ? "directions_walk"
                  : "sprint"
              }
              className="text-base"
            />
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
