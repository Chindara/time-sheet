import React from "react";

export interface ContributorTotal {
  userId: string;
  displayName: string;
  hours: number;
}

interface ContributorBarsProps {
  contributors: ContributorTotal[];
  totalHours: number;
  /**
   * Bar colour per user id, shared with the daily chart so one person reads as
   * the same colour in both. Missing ids fall back to the theme accent.
   */
  colors?: Map<string, string>;
}

/**
 * Hours per contributor as a labelled bar list. Bars are scaled against the top
 * contributor rather than the project total, so short bars stay readable; the
 * share of the project total is stated numerically beside each name.
 */
export const ContributorBars: React.FC<ContributorBarsProps> = ({
  contributors,
  totalHours,
  colors,
}) => {
  if (contributors.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No contributors in this range
      </p>
    );
  }

  const peak = Math.max(...contributors.map((c) => c.hours));

  return (
    <div className="space-y-3">
      {contributors.map((contributor) => (
        <div key={contributor.userId}>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="truncate font-medium">
              {contributor.displayName}
            </span>
            <span className="flex-1" />
            <span className="shrink-0 font-semibold tabular-nums">
              {contributor.hours.toFixed(2)}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {totalHours === 0
                ? "0.0%"
                : `${((contributor.hours / totalHours) * 100).toFixed(1)}%`}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-sm bg-muted">
            <div
              className={`h-full rounded-sm${
                colors?.get(contributor.userId) ? "" : " bg-primary"
              }`}
              style={{
                width: peak === 0 ? "0%" : `${(contributor.hours / peak) * 100}%`,
                backgroundColor: colors?.get(contributor.userId),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
