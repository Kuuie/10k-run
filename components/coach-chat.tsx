"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Material Icon component
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

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
  "Hey! I'm Coach Kuro. Ask me for tips, motivation, or just chat!";

export function CoachChat({ stats }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", content: INITIAL_COACH_LINE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleCoachResponse = async (userText?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          history: recentApiHistory,
          userMessage: userText ?? "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          data?.error ||
          "Coach is taking a breather — try again later!";
        addMessage({ role: "coach", content: errorMsg });
        return;
      }

      const data = (await res.json()) as { message?: string };
      if (data?.message) {
        addMessage({ role: "coach", content: data.message });
      } else {
        addMessage({
          role: "coach",
          content: "Still cheering you on!",
        });
      }
    } catch (error) {
      console.error("Coach chat error", error);
      addMessage({
        role: "coach",
        content: "I'm catching my breath — try again in a bit!",
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

  const handleQuickHype = async () => {
    addMessage({ role: "user", content: "Give me a pep talk!" });
    await handleCoachResponse("Give me an encouraging pep talk to help me stay motivated!");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl bg-cream shadow-sm ring-1 ring-olive/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-dark px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage to-sage-dark">
            <Icon name="psychology" className="text-xl text-white" />
          </div>
          <div>
            <p className="font-semibold text-olive">Coach Kuro</p>
            <p className="text-xs text-olive/60">AI-powered motivation</p>
          </div>
        </div>
        <button
          onClick={handleQuickHype}
          disabled={loading}
          className="flex items-center gap-1 rounded-full bg-sage-light px-3 py-1.5 text-sm font-medium text-sage-dark transition hover:bg-sage/30 disabled:opacity-50"
        >
          <Icon name="bolt" className="text-base" />
          Hype me
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
        style={{ minHeight: "300px" }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "coach"
                  ? "bg-sage-light text-olive"
                  : "bg-sage text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-olive/60">
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-sage" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sage" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-sage" style={{ animationDelay: "300ms" }} />
            </span>
            Coach is typing...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-cream-dark p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask for tips, motivation..."
            className="flex-1 rounded-full bg-sage-light/50 px-4 py-2.5 text-sm text-olive outline-none placeholder:text-olive/50 focus:ring-2 focus:ring-sage/30"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-white transition hover:bg-sage-dark disabled:opacity-50"
          >
            <Icon name="send" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
