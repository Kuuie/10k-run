export type WeekRange = {
  start: Date;
  end: Date;
};

export const getWeekRange = (date: Date, weekStartDay: number): WeekRange => {
  const day = date.getDay();
  const distanceFromStart = (day - weekStartDay + 7) % 7;
  const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  start.setUTCDate(start.getUTCDate() - distanceFromStart);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
};

export const formatWeekLabel = (range: WeekRange) => {
  const startStr = range.start.toISOString().slice(0, 10);
  const endStr = range.end.toISOString().slice(0, 10);
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
