import React from "react";
import { Button } from "@/components/ui/button";
import { FileBarChart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportRunResult =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "exported"; excludedCount: number };

export interface ReportDefinition {
  id: string;
  label: string;
  /** Month is 1-indexed, matching an <input type="month"> value */
  run: (year: number, month: number) => Promise<ReportRunResult>;
}

interface ReportsPanelProps {
  reports: ReportDefinition[];
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function describeResult(result: ReportRunResult): { text: string; isError: boolean } {
  switch (result.status) {
    case "empty":
      return { text: "No time entries for that month.", isError: false };
    case "error":
      return { text: result.message, isError: true };
    case "exported":
      return result.excludedCount > 0
        ? {
            text: `Downloaded. ${result.excludedCount} ${
              result.excludedCount === 1 ? "entry was" : "entries were"
            } excluded — their project could not be determined.`,
            isError: false,
          }
        : { text: "Downloaded.", isError: false };
  }
}

/**
 * Entry point for cross-project reports: a shared month filter above a list
 * of report buttons. New reports are added by extending the `reports` prop —
 * this panel does not change when one is.
 */
export const ReportsPanel: React.FC<ReportsPanelProps> = ({ reports }) => {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(currentMonthValue);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<{ text: string; isError: boolean } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const runReport = async (report: ReportDefinition) => {
    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    if (!year || !monthNum) return;

    setRunningId(report.id);
    setStatus(null);
    try {
      const result = await report.run(year, monthNum);
      setStatus(describeResult(result));
    } catch (err) {
      setStatus({
        text: err instanceof Error ? err.message : String(err),
        isError: true,
      });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <FileBarChart className="mr-2 h-4 w-4" />
        Reports
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-72 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
          <div className="space-y-1.5">
            <label htmlFor="reports-month" className="text-xs text-muted-foreground">
              Month
            </label>
            <input
              id="reports-month"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setStatus(null);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>

          <div className="mt-3 space-y-1">
            {reports.map((report) => (
              <Button
                key={report.id}
                type="button"
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                disabled={runningId !== null}
                onClick={() => runReport(report)}
              >
                {runningId === report.id && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {report.label}
              </Button>
            ))}
          </div>

          {status && (
            <p
              className={cn(
                "mt-2 text-xs",
                status.isError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {status.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
