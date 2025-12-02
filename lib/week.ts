export type WeekRange = {
  start: Date;
  end: Date;
};

export const DEFAULT_TZ = (() => {
  const tz =
    process.env.NEXT_PUBLIC_TIME_ZONE ||
    process.env.TIME_ZONE ||
    process.env.TZ ||
    "Australia/Melbourne";
  // Guard against invalid values like empty string or ":UTC".
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return "Australia/Melbourne";
  }
})();

const getDatePartsInTz = (date: Date, timeZone = DEFAULT_TZ) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  parts.forEach((p) => {
    if (p.type === "year" || p.type === "month" || p.type === "day") {
      map[p.type] = p.value;
    }
  });
  return map;
};

export const formatDateLocal = (date: Date) =>
  formatDateLocalTz(date, DEFAULT_TZ);

export const formatDateLocalTz = (date: Date, timeZone = DEFAULT_TZ) => {
  const map = getDatePartsInTz(date, timeZone);
  return `${map.year}-${map.month}-${map.day}`;
};

export const todayLocalIso = (timeZone = DEFAULT_TZ) =>
  formatDateLocalTz(new Date(), timeZone);

const zonedStartOfDay = (date: Date, timeZone = DEFAULT_TZ) => {
  const map = getDatePartsInTz(date, timeZone);
  // Construct a stable UTC date for the local (timeZone) midnight to avoid host TZ drift.
  return new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)));
};

const weekdayIndexInTz = (date: Date, timeZone = DEFAULT_TZ) => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
};

export const getWeekRange = (
  date: Date,
  weekStartDay: number,
  timeZone = DEFAULT_TZ
): WeekRange => {
  const day = weekdayIndexInTz(date, timeZone);
  const distanceFromStart = (day - weekStartDay + 7) % 7;
  const start = zonedStartOfDay(date, timeZone);
  start.setUTCDate(start.getUTCDate() - distanceFromStart);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
};

export const formatWeekLabel = (range: WeekRange) => {
  const startStr = formatDateLocal(range.start);
  const endStr = formatDateLocal(range.end);
  return `${startStr} → ${endStr}`;
};

export const getCurrentWeekRange = (weekStartDay: number, timeZone = DEFAULT_TZ) =>
  getWeekRange(new Date(), weekStartDay, timeZone);

export const calculateStreak = (
  weeklyResults: { week_start_date: string; met_target: boolean }[],
  startDate: Date,
  weekStartDay: number
) => {
  let streak = 0;
  const start = new Date(startDate);
  const todayRange = getCurrentWeekRange(weekStartDay);
  const weeksByStart = new Map(
    weeklyResults.map((w) => [w.week_start_date, w.met_target])
  );

  let cursor = todayRange.start;
  while (cursor >= start) {
    const key = cursor.toISOString().slice(0, 10);
    const met = weeksByStart.get(key);
    if (!met) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  return streak;
};
