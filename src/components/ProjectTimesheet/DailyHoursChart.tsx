import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateForDisplay } from "../../utils/dateUtils";

export interface DailyPoint {
  date: string;
  /** Total for the day, across every contributor */
  hours: number;
  /** Hours logged that day, keyed by user id */
  byUser: Record<string, number>;
}

export interface DailySeries {
  userId: string;
  displayName: string;
  color: string;
}

interface DailyHoursChartProps {
  points: DailyPoint[];
  /** One stack segment per contributor, in stacking order (bottom first) */
  series: DailySeries[];
}

/**
 * Recharts reads series values by key off the row object, and a user id can
 * contain characters it would treat as a path (dots, brackets). Series are
 * flattened onto positional keys instead, so the id never reaches a dataKey.
 */
const seriesKey = (index: number) => `s${index}`;

interface TooltipRow {
  displayName: string;
  color: string;
  hours: number;
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload?: { date?: string; hours?: number } }>;
  series: DailySeries[];
}> = ({ active, payload, series }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point?.date) return null;

  // Rebuilt from the row rather than the payload so zero-hour contributors are
  // dropped and the rest read largest first, whatever the stacking order
  const rows: TooltipRow[] = series
    .map((s) => ({
      displayName: s.displayName,
      color: s.color,
      hours: (point as DailyPoint).byUser?.[s.userId] ?? 0,
    }))
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-popover-foreground">
        {formatDateForDisplay(point.date)}
      </p>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.displayName} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: row.color }}
            />
            <span className="mr-3 truncate text-popover-foreground">
              {row.displayName}
            </span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {row.hours.toFixed(2)}h
            </span>
          </div>
        ))}
      </div>
      {rows.length > 1 && (
        <div className="mt-1 flex items-center gap-2 border-t pt-1 font-semibold text-popover-foreground">
          <span>Total</span>
          <span className="ml-auto tabular-nums">
            {(point.hours ?? 0).toFixed(2)}h
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Hours per day across the selected range, stacked by contributor. The stack
 * keeps the daily total readable as the bar height while showing who made it
 * up; the legend below names every contributor drawn.
 */
export const DailyHoursChart: React.FC<DailyHoursChartProps> = ({
  points,
  series,
}) => {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No time logged in this range
      </p>
    );
  }

  const data = points.map((point) => {
    const row: Record<string, string | number | Record<string, number>> = {
      ...point,
      // Compact tick: day of month only, the panel subtitle carries the range
      tick: point.date.slice(8, 10),
    };
    series.forEach((s, index) => {
      row[seriesKey(index)] = point.byUser[s.userId] ?? 0;
    });
    return row;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="currentColor" opacity={0.12} />
          <XAxis
            dataKey="tick"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.65 }}
            interval="preserveStartEnd"
            minTickGap={4}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.65 }}
            width={38}
          />
          <Tooltip
            cursor={{ fill: "currentColor", opacity: 0.06 }}
            content={<ChartTooltip series={series} />}
          />
          {series.map((s, index) => (
            <Bar
              key={s.userId}
              dataKey={seriesKey(index)}
              name={s.displayName}
              stackId="hours"
              fill={s.color}
              maxBarSize={28}
              // A rounded cap only reads right on an unstacked bar: on a stack
              // it would land on whichever contributor happens to be top that
              // day, so the caps come off as soon as there is more than one
              radius={series.length === 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2">
          {series.map((s) => (
            <span
              key={s.userId}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="max-w-[160px] truncate">{s.displayName}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
