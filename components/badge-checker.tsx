"use client";

import { useEffect, useState } from "react";
import { checkBadgesAction } from "@/app/actions";
import { Badge } from "@/lib/supabase/types";
import { BadgeToastContainer } from "./badge-toast";

export function BadgeChecker({ triggerCheck }: { triggerCheck?: boolean }) {
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // Check badges on mount
    const check = async () => {
      const result = await checkBadgesAction();
      if (result.newBadges && result.newBadges.length > 0) {
        setNewBadges(result.newBadges);
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
