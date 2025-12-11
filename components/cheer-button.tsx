"use client";

import { useState, useTransition } from "react";
import { cheerActivityAction, removeCheerAction } from "@/app/actions";

const CHEER_EMOJIS = ["🔥", "💪", "🎉", "⚡", "👏"];

type CheerButtonProps = {
  activityId: string;
  initialCheerCount: number;
  initialEmojis: string[];
  userCheer: string | null;
  isOwnActivity?: boolean;
};

export function CheerButton({
  activityId,
  initialCheerCount,
  initialEmojis,
  userCheer,
  isOwnActivity = false,
}: CheerButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [cheerCount, setCheerCount] = useState(initialCheerCount);
  const [emojis, setEmojis] = useState<string[]>(initialEmojis);
  const [myCheer, setMyCheer] = useState<string | null>(userCheer);

  const handleCheer = (emoji: string) => {
    setShowPicker(false);
    startTransition(async () => {
      if (myCheer === emoji) {
        // Remove cheer
        await removeCheerAction(activityId);
        setMyCheer(null);
        setCheerCount((c) => Math.max(0, c - 1));
        setEmojis((e) => e.filter((em) => em !== emoji));
      } else {
        // Add/update cheer
        await cheerActivityAction(activityId, emoji);
        if (!myCheer) {
          setCheerCount((c) => c + 1);
        }
        setMyCheer(emoji);
        if (!emojis.includes(emoji)) {
          setEmojis((e) => [...e, emoji]);
        }
      }
    });
  };

  if (isOwnActivity) {
    // Show only cheer count for own activities
    if (cheerCount === 0) return null;
    return (
      <div className="flex items-center gap-1 text-sm text-olive/60">
        {emojis.slice(0, 3).map((emoji, i) => (
          <span key={i} className="text-base">
            {emoji}
          </span>
        ))}
        {cheerCount > 0 && <span>{cheerCount}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={isPending}
        className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm transition ${
          myCheer
            ? "bg-sage-light text-sage-dark"
            : "text-olive/50 hover:bg-sage-light hover:text-sage-dark"
        } ${isPending ? "opacity-50" : ""}`}
      >
        {myCheer ? (
          <span className="text-base">{myCheer}</span>
        ) : (
          <span className="material-icons-round text-lg">add_reaction</span>
        )}
        {cheerCount > 0 && <span>{cheerCount}</span>}
      </button>

      {/* Emoji picker */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-50 flex gap-1 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-olive/10 animate-pop-in">
            {CHEER_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleCheer(emoji)}
                className={`rounded-full p-1.5 text-lg transition hover:bg-sage-light hover:scale-110 ${
                  myCheer === emoji ? "bg-sage-light" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
