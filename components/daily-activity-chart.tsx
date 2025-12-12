"use client";

import { useState, useMemo } from "react";

type Activity = {
  activity_date: string;
  distance_km: number;
  activity_type: string;
};

type DailyActivityChartProps = {
  activities: Activity[];
  daysPerPage?: number;
};

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`}>{name}</span>
);

const CHART_HEIGHT = 140; // pixels

export function DailyActivityChart({ activities, daysPerPage = 14 }: DailyActivityChartProps) {
  const [page, setPage] = useState(0);

  // Aggregate activities by date
  const dailyData = useMemo(() => {
    const byDate: Record<string, { total: number; types: Record<string, number> }> = {};

    for (const activity of activities) {
      const date = activity.activity_date;
      if (!byDate[date]) {
        byDate[date] = { total: 0, types: {} };
      }
      byDate[date].total += Number(activity.distance_km);
      byDate[date].types[activity.activity_type] =
        (byDate[date].types[activity.activity_type] || 0) + Number(activity.distance_km);
    }

    // Sort by date descending and convert to array
    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        date,
        ...data,
      }));
  }, [activities]);

  // Calculate pagination
  const totalPages = Math.ceil(dailyData.length / daysPerPage);
  const startIdx = page * daysPerPage;
  const pageData = dailyData.slice(startIdx, startIdx + daysPerPage).reverse();

  // Find max for scaling
  const maxKm = Math.max(...dailyData.map(d => d.total), 5);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    return day;
  };

  // Get date range for header
  const getDateRange = () => {
    if (pageData.length === 0) return "";
    const first = pageData[0].date;
    const last = pageData[pageData.length - 1].date;
    const firstDate = new Date(first + "T00:00:00");
    const lastDate = new Date(last + "T00:00:00");
    return `${firstDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  };

  if (dailyData.length === 0) {
    return (
      <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10">
        <h2 className="flex items-center gap-2 font-semibold text-olive">
          <Icon name="bar_chart" className="text-xl text-sage-dark" />
          Daily Activity
        </h2>
        <div className="mt-6 py-8 text-center text-olive/60">
          No activities yet. Log your first activity to see the chart!
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-cream p-6 shadow-sm ring-1 ring-olive/10 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-olive">
          <Icon name="bar_chart" className="text-xl text-sage-dark" />
          Daily Activity
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="rounded-full p-1.5 text-olive/50 hover:bg-sage-light hover:text-sage-dark disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-olive/50"
          >
            <Icon name="chevron_left" className="text-lg" />
          </button>
          <span className="text-xs text-olive/60 min-w-[100px] text-center">
            {getDateRange()}
          </span>
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page <= 0}
            className="rounded-full p-1.5 text-olive/50 hover:bg-sage-light hover:text-sage-dark disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-olive/50"
          >
            <Icon name="chevron_right" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-2 flex">
        {/* Y-axis labels */}
        <div className="w-10 flex flex-col justify-between text-[10px] text-olive/50 pr-2" style={{ height: CHART_HEIGHT }}>
          <span>{maxKm.toFixed(1)}</span>
          <span>{(maxKm / 2).toFixed(1)}</span>
          <span>0 km</span>
        </div>

        {/* Chart area */}
        <div className="flex-1 border-l border-b border-cream-dark relative" style={{ height: CHART_HEIGHT }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-cream-dark/50" />
            <div className="border-b border-cream-dark/50" />
            <div />
          </div>

          {/* Bars container */}
          <div className="absolute inset-0 flex items-end px-1 pb-0">
            {pageData.map((day) => {
              const heightPercent = (day.total / maxKm) * 100;
              const heightPx = (day.total / maxKm) * CHART_HEIGHT;
              const dayNum = formatDate(day.date);

              // Determine dominant type for color
              const dominantType = Object.entries(day.types)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'run';

              const barColor = dominantType === 'run'
                ? 'bg-sage'
                : dominantType === 'walk'
                ? 'bg-sage-light border border-sage/30'
                : 'bg-sage-dark';

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  style={{ height: '100%' }}
                >
                  {/* Bar */}
                  <div
                    className={`w-3/4 max-w-[20px] rounded-t ${barColor} transition-all group-hover:opacity-80`}
                    style={{ height: Math.max(heightPx, day.total > 0 ? 4 : 0) }}
                  />

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-olive text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {day.total.toFixed(1)} km
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex ml-10 mt-1">
        {pageData.map((day) => (
          <div key={day.date} className="flex-1 text-center">
            <span className="text-[9px] text-olive/50">{formatDate(day.date)}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-olive/60">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sage" /> Run
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sage-light border border-sage/30" /> Walk
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sage-dark" /> Jog
        </span>
      </div>

      {/* Page indicator */}
      {totalPages > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(totalPages - 1 - i)}
              className={`h-1.5 rounded-full transition-all ${
                i === totalPages - 1 - page
                  ? 'w-4 bg-sage'
                  : 'w-1.5 bg-cream-dark hover:bg-sage-light'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
