"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CoachStats = {
  totalKm: number;
  targetKm: number;
  toGo: number;
  streak: number;
  weekStart: string;
  weekEnd: string;
  activities: {
    activity_date: string;
    distance_km: number;
    duration_minutes: number | null;
    activity_type: string;
  }[];
  userEmail?: string | null;
};

type Message = {
  role: "coach" | "user";
  content: string;
};

type ApiMessage = {
  role: "assistant" | "user";
  content: string;
};

type Props = {
  stats: CoachStats;
};

const INITIAL_COACH_LINE =
  "Coach Kuro here! I’ll keep you hyped and honest—let’s crush this week.";

export function CoachChat({ stats }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: INITIAL_COACH_LINE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [droppedImage, setDroppedImage] = useState<{ name: string; preview: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const recentApiHistory: ApiMessage[] = useMemo(
    () =>
      messages.slice(-10).map((m) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.content,
      })),
    [messages]
  );

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleCoachResponse = async (userText?: string, imageData?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          history: recentApiHistory,
          userMessage: userText ?? "",
          imageData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          data?.error ||
          "You’ve hit your hype quota for now — try again later!";
        addMessage({ role: "coach", content: errorMsg });
        return;
      }

      const data = (await res.json()) as { message?: string };
      if (data?.message) {
        addMessage({ role: "coach", content: data.message });
      } else {
        addMessage({
          role: "coach",
          content: "Staying quiet, but I’m still cheering you on!",
        });
      }
    } catch (error) {
      console.error("Coach chat error", error);
      addMessage({
        role: "coach",
        content: "I’m catching my breath—try again in a bit!",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    addMessage({ role: "user", content: trimmed });
    await handleCoachResponse(trimmed);
  };

  const handleWeeklyHype = async () => {
    addMessage({ role: "coach", content: "Summoning hype..." });
    await handleCoachResponse();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    const file = e.dataTransfer.files[0];
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setDroppedImage({ name: file.name, preview: url });
    addMessage({
      role: "coach",
      content: "Got your screenshot—analyzing it for distance and time...",
    });

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleCoachResponse(undefined, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-darkTheme-border dark:bg-darkTheme-elevated">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Coach Chat</h2>
          <p className="text-sm text-slate-500 dark:text-darkTheme-text-secondary">
            Fun, encouraging, lightly cheeky—but always kind.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-darkTheme-card dark:text-darkTheme-text-primary dark:hover:bg-darkTheme-elevated"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <button
            type="button"
            className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 dark:bg-darkTheme-accent-primary dark:hover:bg-darkTheme-accent-primaryHover"
            onClick={handleWeeklyHype}
            disabled={loading}
          >
            Weekly Hype
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="mt-3 text-xs text-slate-500 dark:text-darkTheme-text-secondary">
          Coach is chilling. Expand to chat.
        </div>
      ) : (
        <>
      <div
        ref={listRef}
        className="mt-4 h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-100 p-3 dark:border-darkTheme-border dark:bg-darkTheme-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
              msg.role === "coach"
                ? "ml-0 mr-auto bg-indigo-50 text-indigo-900 dark:bg-darkTheme-elevated dark:text-darkTheme-text-primary"
                : "ml-auto mr-0 bg-slate-100 text-slate-900 dark:bg-darkTheme-card dark:text-darkTheme-text-primary"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-darkTheme-text-secondary">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Coach is thinking...
          </div>
        )}
      </div>

      {droppedImage && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-sm text-indigo-900 dark:border-darkTheme-border dark:bg-darkTheme-card dark:text-darkTheme-text-primary">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-xs uppercase tracking-wide text-indigo-700 dark:text-darkTheme-text-secondary">
              Screenshot detected
            </div>
            <button
              type="button"
              className="text-xs text-indigo-600 hover:underline dark:text-darkTheme-text-secondary"
              onClick={() => {
                setDroppedImage(null);
              }}
            >
              Clear
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <img
              src={droppedImage.preview}
              alt={droppedImage.name}
              className="h-16 w-16 rounded-lg object-cover ring-1 ring-indigo-200 dark:ring-darkTheme-border"
            />
            <div className="flex-1 space-y-1 text-xs text-slate-600 dark:text-darkTheme-text-secondary">
              Coach is analyzing the screenshot for distance/time and will ask to confirm adding it.
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask your coach for a pep talk..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-darkTheme-border dark:bg-darkTheme-card dark:text-darkTheme-text-primary dark:focus:ring-darkTheme-accent-primary/30"
        />
        <button
          type="button"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 dark:bg-darkTheme-accent-primary dark:hover:bg-darkTheme-accent-primaryHover"
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
        </>
      )}
    </div>
  );
}
