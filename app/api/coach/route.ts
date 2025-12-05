import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

type ChatHistory = { role: "assistant" | "user"; content: string }[];

type StatsPayload = {
  totalKm: number;
  targetKm: number;
  toGo: number;
  streak: number;
  weekStart: string;
  weekEnd: string;
  activities?: {
    activity_date: string;
    distance_km: number;
    duration_minutes: number | null;
    activity_type: string;
  }[];
  userEmail?: string | null;
};

type RateRecord = {
  hourStart: number;
  hourCount: number;
  dayStart: number;
  dayCount: number;
};

const rateStore = new Map<string, RateRecord>();
const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 20;

const getDayStart = (now: Date) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const checkAndIncrementRate = (userId: string) => {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);
  const hourTs = hourStart.getTime();
  const dayTs = getDayStart(now);

  const existing = rateStore.get(userId);
  const record: RateRecord = existing ?? {
    hourStart: hourTs,
    hourCount: 0,
    dayStart: dayTs,
    dayCount: 0,
  };

  if (record.hourStart !== hourTs) {
    record.hourStart = hourTs;
    record.hourCount = 0;
  }
  if (record.dayStart !== dayTs) {
    record.dayStart = dayTs;
    record.dayCount = 0;
  }

  if (record.hourCount >= HOURLY_LIMIT || record.dayCount >= DAILY_LIMIT) {
    return { allowed: false };
  }

  record.hourCount += 1;
  record.dayCount += 1;
  rateStore.set(userId, record);
  return { allowed: true };
};

const buildPrompt = (
  stats: StatsPayload,
  history: ChatHistory,
  userMessage: string | undefined,
  hasImage: boolean,
  modelName: string
) => {
  const recentLines = history
    .slice(-6)
    .map((m) => `${m.role === "assistant" ? "Coach" : "User"}: ${m.content}`)
    .join("\n");

  const recentActivities = (stats.activities ?? [])
    .slice(0, 8)
    .map(
      (a) =>
        `${a.activity_date}: ${a.activity_type.toUpperCase()} ${a.distance_km.toFixed(1)} km${
          a.duration_minutes ? ` in ${a.duration_minutes} min` : ""
        }`
    )
    .join("; ");

  const roastyNote =
    stats.userEmail && stats.userEmail.toLowerCase() === "haquanghuytran@gmail.com"
      ? "User is Huy. You may be a bit extra cheeky with Huy, but never mean or personal—keep it playful and kind."
      : "Keep it kind and lightly cheeky.";

  return [
    {
      role: "system",
      content: `
You are Coach Kuro, a playful running coach for a 10 km weekly challenge.
Tone: upbeat, brief (1-2 sentences), personable, quirky, encouraging, lightly cheeky, never mean. ${roastyNote}
Strict safety: no health/appearance/weight/body comments; no profanity; no shaming; no unsafe content.
When asked for a plan, be specific and actionable: suggest distance per session, an easy/interval/long mix, target pace/time based on recent runs, and simple heat/hydration tips if relevant. For “wake up early” help, give concrete, playful steps (bedtime target, alarms, outfit ready, first 5 minutes) with upbeat encouragement.
If asked about your model or version, answer explicitly: “I’m running on ${modelName} today.” Keep it brief.
Respond with a single short, specific message only.`,
    },
    {
      role: "user",
      content: [
        `Stats: ${stats.totalKm.toFixed(1)} km / ${stats.targetKm.toFixed(1)} km.`,
        `Remaining: ${Math.max(0, stats.toGo).toFixed(1)} km.`,
        `Streak: ${stats.streak} week(s).`,
        `Week window: ${stats.weekStart} → ${stats.weekEnd}.`,
        recentActivities ? `Recent activities: ${recentActivities}.` : "No recent activities recorded.",
        userMessage ? `User says: "${userMessage}".` : "User did not ask anything specific.",
        recentLines ? `Recent chat:\n${recentLines}` : "No recent chat yet.",
        hasImage
          ? "An image screenshot of a run is provided—extract distance (km) and time (minutes). State what you see and ask if the user wants to add this activity."
          : "Give a fun, concise reply (1-2 sentences), encouraging and slightly cheeky but kind.",
      ].join(" "),
    },
  ];
};

export async function POST(req: Request) {
  try {
    const { session } = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { history, stats, userMessage, imageData } = (await req.json()) as {
      history?: ChatHistory;
      stats?: StatsPayload;
      userMessage?: string;
      imageData?: string;
    };

    if (!stats || typeof stats.totalKm !== "number" || typeof stats.targetKm !== "number") {
      return NextResponse.json({ error: "Missing stats" }, { status: 400 });
    }

    const rate = checkAndIncrementRate(userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "You’ve hit your hype quota for now — try again later!" },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key missing" },
        { status: 500 }
      );
    }

    const textModel = process.env.OPENAI_MODEL || "gpt-4o";
    const visionModel = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    const model = imageData ? visionModel : textModel;

    const messages = buildPrompt(stats, history ?? [], userMessage, Boolean(imageData), model);

    const payload = imageData
      ? {
          model,
          messages: [
            {
              role: "system",
              content: messages[0].content,
            },
            {
              role: "user",
              content: [
                { type: "text", text: messages[1].content },
                { type: "image_url", image_url: { url: imageData } },
              ],
            },
          ],
          temperature: 0.8,
          max_tokens: 120,
        }
      : {
          model,
          messages,
          temperature: 0.8,
          max_tokens: 120,
        };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("OpenAI error", response.status, err);

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "You’ve hit the coach’s quota (OpenAI limit). Check billing or try later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Coach is busy—please try again soon." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const message: string | undefined =
      data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "No response from coach" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Coach route error", error);
    return NextResponse.json(
      { error: "Coach stumbled—try again in a moment." },
      { status: 500 }
    );
  }
}
