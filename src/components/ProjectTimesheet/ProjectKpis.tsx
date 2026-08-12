import React from "react";
import { ProjectSummary } from "../../utils/breakdown";
import { cn } from "@/lib/utils";

interface ProjectKpisProps {
  summary: ProjectSummary;
  /** Hours per day across the range, oldest first, for the sparkline */
  dailyHours: number[];
}

const Tile: React.FC<{
  label: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}> = ({ label, children, foot }) => (
  <div className="rounded-md border bg-card p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="mt-1 text-3xl font-semibold tracking-tight">{children}</div>
    {foot && <div className="mt-0.5 text-xs text-muted-foreground">{foot}</div>}
  </div>
);

export const ProjectKpis: React.FC<ProjectKpisProps> = ({
  summary,
  dailyHours,
}) => {
  const peak = Math.max(...dailyHours, 0);
  const underEstimate = summary.estimateRemaining >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Total hours"
        foot={`across ${summary.workItems} work item${summary.workItems === 1 ? "" : "s"}`}
      >
        <span className="tabular-nums">{summary.totalHours.toFixed(2)}</span>
      </Tile>

      <Tile
        label="Contributors"
        foot={
          summary.contributors > 0
            ? `${(summary.totalHours / summary.contributors).toFixed(2)} h average each`
            : undefined
        }
      >
        <span className="tabular-nums">{summary.contributors}</span>
      </Tile>

      <Tile label="Hours / working day">
        <span className="tabular-nums">
          {summary.hoursPerWorkingDay.toFixed(1)}
        </span>
        {dailyHours.length > 0 && peak > 0 && (
          <div className="mt-2 flex h-6 items-end gap-0.5" aria-hidden="true">
            {dailyHours.map((hours, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-t-sm bg-primary",
                  index === dailyHours.length - 1 ? "opacity-100" : "opacity-40",
                )}
                style={{ height: `${Math.max((hours / peak) * 100, 2)}%` }}
              />
            ))}
          </div>
        )}
      </Tile>

      <Tile
        label="Logged vs. estimate"
        foot={
          summary.estimateUsedPercent === null ? (
            "no Original Estimate set"
          ) : (
            <>
              <span
                className={cn(
                  "font-semibold",
                  underEstimate ? "text-green-700" : "text-destructive",
                )}
              >
                {Math.abs(summary.estimateRemaining).toFixed(2)} h
              </span>{" "}
              {underEstimate ? "under" : "over"}{" "}
              {summary.originalEstimate.toFixed(2)} h estimated
            </>
          )
        }
      >
        {summary.estimateUsedPercent === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="tabular-nums">
            {summary.estimateUsedPercent.toFixed(0)}
            <span className="ml-0.5 text-base font-medium text-muted-foreground">
              %
            </span>
          </span>
        )}
      </Tile>
    </div>
  );
};
