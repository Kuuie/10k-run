"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/lib/supabase/types";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

type BadgeToastProps = {
  badge: Badge;
  onClose: () => void;
};

export function BadgeToast({ badge, onClose }: BadgeToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 shadow-lg shadow-amber-500/25">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 animate-bounce-in">
          <Icon name={badge.icon} className="text-2xl text-white" />
        </div>
        <div className="text-white">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            Badge Unlocked!
          </p>
          <p className="text-lg font-bold">{badge.name}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 rounded-full p-1 hover:bg-white/20"
        >
          <Icon name="close" className="text-lg text-white/80" />
        </button>
      </div>
    </div>
  );
}

export function BadgeToastContainer({
  badges,
  onClear,
}: {
  badges: Badge[];
  onClear: () => void;
}) {
  const [queue, setQueue] = useState<Badge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (badges.length > 0) {
      setQueue((prev) => [...prev, ...badges]);
    }
  }, [badges]);

  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      setCurrentBadge(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [currentBadge, queue]);

  const handleClose = () => {
    setCurrentBadge(null);
    if (queue.length === 0) {
      onClear();
    }
  };

  if (!currentBadge) return null;

  return <BadgeToast badge={currentBadge} onClose={handleClose} />;
}
