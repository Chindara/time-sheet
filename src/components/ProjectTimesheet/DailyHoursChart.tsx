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
  hours: number;
}

interface DailyHoursChartProps {
  points: DailyPoint[];
}

/**
 * Hours per day across the selected range. One series, so no legend — the
 * panel title names it. Hover gives the exact date and hours.
 */
export const DailyHoursChart: React.FC<DailyHoursChartProps> = ({ points }) => {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No time logged in this range
      </p>
    );
  }

  const data = points.map((point) => ({
    ...point,
    // Compact tick: day of month only, the panel subtitle carries the range
    tick: point.date.slice(8, 10),
  }));

  return (
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
          formatter={(value: number) => [`${value.toFixed(2)}h`, "Hours"]}
          labelFormatter={(_label, payload) =>
            payload?.[0]?.payload?.date
              ? formatDateForDisplay(payload[0].payload.date)
              : ""
          }
        />
        <Bar
          dataKey="hours"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
