"use client";

import { useState } from "react";
import Link from "next/link";
import { useConfetti, StreakCounter, FloatingEmoji } from "./fun-interactions";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

// Fun progress ring with celebration
export const FunProgressRing = ({
  total,
  target,
  metTarget,
}: {
  total: number;
  target: number;
  metTarget: boolean;
}) => {
  const [taps, setTaps] = useState(0);
  const { explode, ConfettiContainer } = useConfetti();
  const percentage = Math.min(100, Math.round((total / target) * 100));

  const radius = 70;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleTap = () => {
    setTaps((t) => t + 1);
    if (taps >= 4 || metTarget) {
      explode();
      setTaps(0);
    }
  };

  const animClass = taps >= 3 ? "animate-wiggle-more" : taps >= 1 ? "animate-jelly" : "";

  return (
    <>
      <ConfettiContainer />
      <div
        onClick={handleTap}
        className={`relative flex items-center justify-center cursor-pointer select-none ${animClass} ${metTarget ? "animate-pulse-glow rounded-full" : ""}`}
      >
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            className="stroke-cream-dark"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={metTarget ? "url(#gradient-complete)" : "url(#gradient)"}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#84a98c" />
              <stop offset="100%" stopColor="#52796f" />
            </linearGradient>
            <linearGradient id="gradient-complete" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f4a261" />
              <stop offset="100%" stopColor="#e76f51" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${metTarget ? "text-orange-500" : "text-olive"}`}>
            {total.toFixed(1)}
          </span>
          <span className="text-sm text-olive/70">of {target} km</span>
        </div>
      </div>
    </>
  );
};

// Fun streak counter
export const FunStreakCounter = ({ streak }: { streak: number }) => {
  return <StreakCounter streak={streak} />;
};

// Fun Log Activity button
export const FunLogButton = () => {
  const [clicks, setClicks] = useState(0);
  const { explode, ConfettiContainer } = useConfetti();

  const handleClick = () => {
    setClicks((c) => c + 1);
    if (clicks >= 4) {
      explode();
      setClicks(0);
    }
  };

  const animClass = clicks >= 3 ? "animate-wiggle-more" : clicks >= 1 ? "animate-bounce-pop" : "";

  return (
    <>
      <ConfettiContainer />
      <Link
        href="/activities/new"
        onClick={handleClick}
        className={`mt-4 inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-medium text-white shadow-lg shadow-sage/25 transition hover:bg-sage-dark active:scale-95 btn-fun ${animClass}`}
      >
        <Icon name="add" className="text-xl" />
        Log Activity
      </Link>
    </>
  );
};

// Fun activity item with floating emoji on tap
export const FunActivityItem = ({
  activity,
  deleteAction,
}: {
  activity: {
    id: string;
    distance_km: number;
    activity_type: string;
    activity_date: string;
    duration_minutes: number | null;
  };
  deleteAction: () => Promise<void>;
}) => {
  const [taps, setTaps] = useState(0);
  const [floaters, setFloaters] = useState<{ id: number; emoji: string }[]>([]);
  const { explode, ConfettiContainer } = useConfetti();

  const iconName =
    activity.activity_type === "run"
      ? "directions_run"
      : activity.activity_type === "walk"
      ? "directions_walk"
      : "sprint";

  const emojis = ["🏃", "💪", "⚡", "🔥", "✨", "🌟"];

  const handleTap = () => {
    setTaps((t) => t + 1);
    const newFloater = {
      id: Date.now(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    };
    setFloaters((f) => [...f, newFloater]);
    setTimeout(() => {
      setFloaters((f) => f.filter((fl) => fl.id !== newFloater.id));
    }, 600);

    if (taps >= 6) {
      explode();
      setTaps(0);
    }
  };

  const animClass = taps >= 4 ? "animate-wiggle-more" : taps >= 2 ? "animate-jelly" : "";

  return (
    <>
      <ConfettiContainer />
      <div
        className={`flex items-center justify-between px-4 py-3 relative ${animClass}`}
        onClick={handleTap}
      >
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute left-1/2 top-1/2 pointer-events-none text-xl"
            style={{ animation: "float-up 0.6s ease-out forwards" }}
          >
            {f.emoji}
          </span>
        ))}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-sage-light ${taps >= 3 ? "animate-spin-slow" : ""}`}>
            <Icon name={iconName} className="text-xl text-sage-dark" />
          </div>
          <div>
            <p className="font-medium text-olive">
              {Number(activity.distance_km).toFixed(1)} km
              <span className="ml-1 font-normal text-olive/70">
                {activity.activity_type}
              </span>
            </p>
            <p className="text-sm text-olive/60">
              {activity.activity_date}
              {activity.duration_minutes && ` · ${activity.duration_minutes} min`}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Link
            href={`/activities/${activity.id}/edit`}
            className="rounded-full p-2 text-olive/50 hover:bg-sage-light hover:text-sage-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="edit" className="text-lg" />
          </Link>
          <form action={deleteAction} onClick={(e) => e.stopPropagation()}>
            <button
              type="submit"
              className="rounded-full p-2 text-olive/50 hover:bg-red-50 hover:text-red-500"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

// Fun quote card
export const FunQuoteCard = ({ quote, author }: { quote: string; author: string }) => {
  const [taps, setTaps] = useState(0);
  const { explode, ConfettiContainer } = useConfetti();

  const handleTap = () => {
    setTaps((t) => t + 1);
    if (taps >= 4) {
      explode();
      setTaps(0);
    }
  };

  const animClass = taps >= 3 ? "animate-wiggle-more" : taps >= 1 ? "animate-jelly" : "";

  return (
    <>
      <ConfettiContainer />
      <div
        onClick={handleTap}
        className={`animate-slide-up delay-5 rounded-2xl bg-gradient-to-br from-sage to-sage-dark p-5 text-white shadow-lg cursor-pointer select-none ${animClass}`}
      >
        <div className="flex items-start gap-3">
          <Icon name="format_quote" className={`text-2xl opacity-50 ${taps >= 2 ? "animate-spin-slow" : ""}`} />
          <div>
            <p className="text-sm font-medium italic leading-relaxed">
              "{quote.length > 150 ? quote.slice(0, 150) + "..." : quote}"
            </p>
            <p className="mt-2 text-xs opacity-75">— {author}</p>
          </div>
        </div>
      </div>
    </>
  );
};
