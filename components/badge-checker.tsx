"use client";

import { useEffect, useState } from "react";
import { checkBadgesAction } from "@/app/actions";
import { Badge } from "@/lib/supabase/types";
import { BadgeToastContainer } from "./badge-toast";

const SHOWN_BADGES_KEY = "shown_badge_ids";

function getShownBadgeIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(SHOWN_BADGES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markBadgesAsShown(badgeIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = getShownBadgeIds();
    badgeIds.forEach((id) => existing.add(id));
    localStorage.setItem(SHOWN_BADGES_KEY, JSON.stringify([...existing]));
  } catch {
    // Ignore localStorage errors
  }
}

export function BadgeChecker({ triggerCheck }: { triggerCheck?: boolean }) {
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // Check badges on mount
    const check = async () => {
      const result = await checkBadgesAction();
      if (result.newBadges && result.newBadges.length > 0) {
        // Filter out badges that have already been shown
        const shownIds = getShownBadgeIds();
        const unseenBadges = result.newBadges.filter(
          (badge) => !shownIds.has(badge.id)
        );

        if (unseenBadges.length > 0) {
          // Mark these badges as shown before displaying
          markBadgesAsShown(unseenBadges.map((b) => b.id));
          setNewBadges(unseenBadges);
        }
      }
    };
    check();
  }, [triggerCheck]);

  return (
    <BadgeToastContainer
      badges={newBadges}
      onClear={() => setNewBadges([])}
    />
  );
}
