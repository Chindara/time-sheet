import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ActivityType } from "../../models/TimeEntry";

const ACTIVITY_COLORS: Record<string, string> = {
  [ActivityType.Design]: "#6366f1",
  [ActivityType.Requirements]: "#14b8a6",
  [ActivityType.Documentation]: "#f59e0b",
  [ActivityType.Development]: "#3b82f6",
  [ActivityType.CodeReview]: "#8b5cf6",
  [ActivityType.BugFixing]: "#ef4444",
  [ActivityType.Deployment]: "#f97316",
  [ActivityType.Testing]: "#10b981",
};

interface ActivityDonutChartProps {
  activityHours: Map<string, number>;
  totalHours: number;
}

export const ActivityDonutChart: React.FC<ActivityDonutChartProps> = ({
  activityHours,
  totalHours,
}) => {
  if (activityHours.size === 0 || totalHours === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  const chartData = Array.from(activityHours.entries()).map(
    ([name, hours]) => ({
      name,
      value: hours,
      percentage: ((hours / totalHours) * 100).toFixed(1),
    }),
  );

  return (
    <div className="space-y-3">
      <ResponsiveContainer
        width="100%"
        height={180}
      >
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={ACTIVITY_COLORS[entry.name] ?? "#6b7280"}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value.toFixed(2)}h`]} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend table */}
      <div className="w-full text-xs">
        <div className="divide-y">
          {chartData.map((entry) => (
            <div
              key={entry.name}
              className="grid grid-cols-[1fr_auto] gap-x-3 px-1 py-1 items-center"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: ACTIVITY_COLORS[entry.name] ?? "#6b7280",
                  }}
                />
                <span className="truncate">{entry.name}</span>
              </div>
              <span className="text-right tabular-nums text-muted-foreground shrink-0">
                {entry.value.toFixed(2)}h ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
