export type WeekRange = {
  start: Date;
  end: Date;
};

export const formatDateLocal = (date: Date) =>
  date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export const formatDateLocalTz = (date: Date, timeZone?: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);

export const getWeekRange = (date: Date, weekStartDay: number): WeekRange => {
  const day = date.getDay();
  const distanceFromStart = (day - weekStartDay + 7) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - distanceFromStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

export const formatWeekLabel = (range: WeekRange) => {
  const startStr = formatDateLocal(range.start);
  const endStr = formatDateLocal(range.end);
  return `${startStr} → ${endStr}`;
};

export const getCurrentWeekRange = (weekStartDay: number) =>
  getWeekRange(new Date(), weekStartDay);

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
