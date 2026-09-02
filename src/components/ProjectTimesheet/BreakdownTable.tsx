import React from "react";
import { AlertCircle, Lock } from "lucide-react";
import { BreakdownRow, GroupBy, GROUP_BY_COLUMN } from "../../utils/breakdown";
import { activityColor } from "../../utils/activityColors";
import { ACCENT_COLOR } from "../../utils/palette";

interface BreakdownTableProps {
  rows: BreakdownRow[];
  groupBy: GroupBy;
  /**
   * Distinct work item totals for the footer. Passed in rather than summed from
   * the rows, because a work item can appear in more than one row when grouping
   * by contributor or activity.
   */
  totalWorkItems: number;
  totalClosedWorkItems: number;
  /**
   * True when the work item lookup failed outright. The rows look the same as a
   * permissions problem, so the label must not claim "no read access".
   */
  metadataFailed?: boolean;
  /** Work item ids are rendered as links into Boards when a base URL is known */
  workItemUrl?: (id: number) => string;
}

/** Whether the grouping produces rows that map to a work item */
const showsWorkItemCounts = (groupBy: GroupBy) =>
  groupBy === "feature" || groupBy === "workItem";

const ActivityMix: React.FC<{ row: BreakdownRow }> = ({ row }) => {
  if (row.activityMix.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex h-2 gap-0.5" role="img" aria-label={
      row.activityMix
        .map((slice) => `${slice.activity} ${slice.hours.toFixed(2)} hours`)
        .join(", ")
    }>
      {row.activityMix.map((slice) => (
        <span
          key={slice.activity}
          title={`${slice.activity} — ${slice.hours.toFixed(2)}h`}
          className="min-w-[3px] rounded-sm"
          style={{
            flexGrow: slice.hours,
            flexBasis: 0,
            backgroundColor: activityColor(slice.activity),
          }}
        />
      ))}
    </div>
  );
};

export const BreakdownTable: React.FC<BreakdownTableProps> = ({
  rows,
  groupBy,
  totalWorkItems,
  totalClosedWorkItems,
  metadataFailed = false,
  workItemUrl,
}) => {
  const total = rows.reduce((sum, row) => sum + row.hours, 0);
  const withCounts = showsWorkItemCounts(groupBy);

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No time entries found for the selected filters
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-semibold">{GROUP_BY_COLUMN[groupBy]}</th>
            <th className="w-[120px] px-3 py-2 font-semibold">
              {withCounts ? "Progress" : "Work items"}
            </th>
            <th className="w-[100px] px-3 py-2 font-semibold">Logged by</th>
            <th className="w-[140px] px-3 py-2 font-semibold">Activity mix</th>
            <th className="w-[90px] px-3 py-2 text-right font-semibold">Hours</th>
            <th className="w-[70px] px-3 py-2 text-right font-semibold">Share</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b hover:bg-muted/20">
              <td className="px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  {row.restricted ? (
                    metadataFailed ? (
                      <AlertCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )
                  ) : (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: ACCENT_COLOR }}
                      aria-hidden="true"
                    />
                  )}
                  {row.id !== undefined && (
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {workItemUrl ? (
                        <a
                          href={workItemUrl(row.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {row.id}
                        </a>
                      ) : (
                        row.id
                      )}
                    </span>
                  )}
                  <span className="truncate font-medium">{row.label}</span>
                  {/* Only worth saying when it is not what the column claims */}
                  {groupBy === "feature" &&
                    row.itemType &&
                    row.itemType !== "Feature" && (
                      <span className="shrink-0 rounded border px-1.5 text-xs text-muted-foreground">
                        {row.itemType}
                      </span>
                    )}
                  {row.restricted && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {metadataFailed
                        ? "(details unavailable — see error above)"
                        : "(no read access)"}
                    </span>
                  )}
                </div>
              </td>

              <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                {withCounts && !row.restricted
                  ? `${row.closedWorkItems} of ${row.workItems} closed`
                  : `${row.workItems} work item${row.workItems === 1 ? "" : "s"}`}
              </td>

              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {row.restricted
                  ? "—"
                  : `${row.contributors} ${row.contributors === 1 ? "person" : "people"}`}
              </td>

              <td className="px-3 py-2.5">
                <ActivityMix row={row} />
              </td>

              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                {row.hours.toFixed(2)}
              </td>

              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                {row.share.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t bg-muted/40 font-semibold">
            <td className="px-3 py-2.5">Total</td>
            <td className="px-3 py-2.5 text-xs tabular-nums">
              {withCounts
                ? `${totalClosedWorkItems} of ${totalWorkItems} closed`
                : `${totalWorkItems} work item${totalWorkItems === 1 ? "" : "s"}`}
            </td>
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5 text-right tabular-nums">
              {total.toFixed(2)}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
