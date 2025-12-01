'use client';

import { useEffect, useMemo, useState } from "react";

const phrases = ["Keep moving", "10K time", "Cluck yeah", "Run run run", "Streak on"];
const sprites = ["🐔", "🐥", "🐤", "🦆"];

export const ChickenRunner = () => {
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(true);
  const [burst, setBurst] = useState(false);
  const [speed] = useState(() => 0.3 + Math.random() * 0.7); // rem per tick
  const label = useMemo(() => phrases[Math.floor(Math.random() * phrases.length)], []);
  const sprite = useMemo(() => sprites[Math.floor(Math.random() * sprites.length)], []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setPos((p) => (p > 100 ? -10 : p + speed));
    }, 16);
    return () => clearInterval(id);
  }, [running, speed]);

  const onClick = () => {
    setBurst(true);
    setRunning(false);
    setTimeout(() => {
      setBurst(false);
      setPos(0);
      setRunning(true);
    }, 1200);
  };

  return (
    <div className="runner-track">
      <div
        className="runner"
        style={{ transform: `translateX(${pos}vw)` }}
        onClick={onClick}
      >
        {!burst ? (
          <>
            <div className="runner-sprite">{sprite}</div>
            <div className="text-xs font-semibold text-slate-700">{label}</div>
            <div className="runner-dust" />
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
            💥 Feathers everywhere!
          </div>
        )}
      </div>
    </div>
  );
};
