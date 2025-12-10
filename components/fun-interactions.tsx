"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Confetti particle
const ConfettiParticle = ({ x, color, delay }: { x: number; color: string; delay: number }) => (
  <div
    className="fixed pointer-events-none z-50"
    style={{
      left: `${x}%`,
      top: 0,
      animation: `confetti-fall ${2 + Math.random()}s ease-out forwards`,
      animationDelay: `${delay}ms`,
    }}
  >
    <div
      className="w-3 h-3 rounded-sm"
      style={{
        backgroundColor: color,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  </div>
);

// Confetti explosion hook
export const useConfetti = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const idRef = useRef(0);

  const explode = useCallback(() => {
    const colors = ["#84a98c", "#52796f", "#f4a261", "#e76f51", "#2a9d8f", "#e9c46a"];
    const newParticles = Array.from({ length: 50 }, () => ({
      id: idRef.current++,
      x: 10 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 300,
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 3000);
  }, []);

  const ConfettiContainer = () => (
    <>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} x={p.x} color={p.color} delay={p.delay} />
      ))}
    </>
  );

  return { explode, ConfettiContainer };
};

// Wiggle button that explodes after enough clicks
export const WiggleButton = ({
  children,
  onClick,
  className = "",
  explodeAfter = 5,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  explodeAfter?: number;
}) => {
  const [clicks, setClicks] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { explode, ConfettiContainer } = useConfetti();

  const handleClick = () => {
    setClicks((c) => c + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    if ((clicks + 1) >= explodeAfter) {
      explode();
      setClicks(0);
    }

    onClick?.();
  };

  const animationClass = clicks >= explodeAfter - 2
    ? "animate-wiggle-more"
    : clicks >= explodeAfter - 3
    ? "animate-shake"
    : "animate-wiggle";

  return (
    <>
      <ConfettiContainer />
      <button
        onClick={handleClick}
        className={`${className} ${animating ? animationClass : ""} btn-fun`}
      >
        {children}
      </button>
    </>
  );
};

// Floating emoji on click
export const FloatingEmoji = ({
  children,
  emoji = "🎉",
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  emoji?: string;
  className?: string;
  onClick?: () => void;
}) => {
  const [floaters, setFloaters] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newFloater = { id: idRef.current++, x, y };
      setFloaters((prev) => [...prev, newFloater]);

      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== newFloater.id));
      }, 600);
    }
    onClick?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} onClick={handleClick}>
      {children}
      {floaters.map((f) => (
        <span
          key={f.id}
          className="absolute pointer-events-none text-lg"
          style={{
            left: f.x,
            top: f.y,
            animation: "float-up 0.6s ease-out forwards",
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

// Progress ring that celebrates when complete
export const CelebratoryProgressRing = ({
  progress,
  total,
  target,
  onComplete,
}: {
  progress: number;
  total: number;
  target: number;
  onComplete?: () => void;
}) => {
  const [celebrated, setCelebrated] = useState(false);
  const { explode, ConfettiContainer } = useConfetti();
  const percentage = Math.min(100, Math.round((total / target) * 100));
  const isComplete = percentage >= 100;

  useEffect(() => {
    if (isComplete && !celebrated) {
      setCelebrated(true);
      explode();
      onComplete?.();
    }
  }, [isComplete, celebrated, explode, onComplete]);

  const radius = 70;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <ConfettiContainer />
      <div className={`relative flex items-center justify-center ${isComplete ? "animate-bounce-pop" : ""}`}>
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
            stroke={isComplete ? "url(#gradient-complete)" : "url(#gradient)"}
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
          <span className={`text-3xl font-bold ${isComplete ? "text-orange-500 animate-tada" : "text-olive"}`}>
            {total.toFixed(1)}
          </span>
          <span className="text-sm text-olive/70">of {target} km</span>
          {isComplete && <span className="text-lg mt-1">🎉</span>}
        </div>
      </div>
    </>
  );
};

// Streak counter with fire animation
export const StreakCounter = ({ streak }: { streak: number }) => {
  const [tapped, setTapped] = useState(false);
  const { explode, ConfettiContainer } = useConfetti();

  const handleTap = () => {
    setTapped(true);
    if (streak >= 3) {
      explode();
    }
    setTimeout(() => setTapped(false), 800);
  };

  return (
    <>
      <ConfettiContainer />
      <div
        onClick={handleTap}
        className={`cursor-pointer select-none ${tapped ? "animate-tada" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-sage-light ${streak >= 3 ? "animate-pulse-glow" : ""}`}>
            <span className={`material-icons-round text-xl text-sage-dark ${tapped && streak >= 2 ? "animate-spin-slow" : ""}`}>
              local_fire_department
            </span>
          </div>
          <div>
            <p className={`text-2xl font-bold text-olive ${tapped ? "animate-bounce-pop" : ""}`}>
              {streak}
              {streak >= 5 && <span className="ml-1 text-lg">🔥</span>}
            </p>
            <p className="text-xs text-olive/70">Week streak</p>
          </div>
        </div>
      </div>
    </>
  );
};

// Activity card with delete wiggle
export const ActivityCard = ({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete?: () => void;
}) => {
  const [shaking, setShaking] = useState(false);
  const [deleteClicks, setDeleteClicks] = useState(0);

  const handleDelete = () => {
    setDeleteClicks((c) => c + 1);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);

    if (deleteClicks >= 2) {
      onDelete?.();
    }
  };

  return (
    <div className={`${shaking ? "animate-shake" : ""}`}>
      {children}
    </div>
  );
};
