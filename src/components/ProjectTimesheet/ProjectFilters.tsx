import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RangePreset =
  | "all-time"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "custom";

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  "all-time": "All time",
  "this-month": "This Month",
  "last-month": "Last Month",
  "this-quarter": "This Quarter",
  custom: "Custom Range",
};

export interface ProjectFiltersState {
  preset: RangePreset;
  startDate: string;
  endDate: string;
  userIds: string[];
  activityTypes: string[];
  iterationPath: string;
}

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onChange: (filters: ProjectFiltersState) => void;
  contributorOptions: MultiSelectOption[];
  activityOptions: MultiSelectOption[];
  iterationOptions: MultiSelectOption[];
  rangeError?: string;
  disabled?: boolean;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onChange,
  contributorOptions,
  activityOptions,
  iterationOptions,
  rangeError,
  disabled,
}) => {
  const set = <K extends keyof ProjectFiltersState>(
    key: K,
    value: ProjectFiltersState[K],
  ) => onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.userIds.length > 0 ||
    filters.activityTypes.length > 0 ||
    filters.iterationPath !== "";

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date range */}
        <div className="space-y-1.5">
          <Label htmlFor="range-preset" className="text-xs text-muted-foreground">
            Date range
          </Label>
          <Select
            value={filters.preset}
            onValueChange={(value) => set("preset", value as RangePreset)}
            disabled={disabled}
          >
            <SelectTrigger id="range-preset" className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(RANGE_PRESET_LABELS) as RangePreset[]
              ).map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {RANGE_PRESET_LABELS[preset]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filters.preset === "custom" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                className={cn("w-[150px]", rangeError && "border-destructive")}
                value={filters.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                className={cn("w-[150px]", rangeError && "border-destructive")}
                value={filters.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                disabled={disabled}
              />
            </div>
          </>
        )}

        {/* Contributors */}
        <div className="space-y-1.5">
          <Label htmlFor="contributors" className="text-xs text-muted-foreground">
            Contributors
          </Label>
          <MultiSelect
            id="contributors"
            className="w-[170px]"
            options={contributorOptions}
            selected={filters.userIds}
            onChange={(userIds) => set("userIds", userIds)}
            allLabel={`All ${contributorOptions.length || ""}`.trim()}
            disabled={disabled}
          />
        </div>

        {/* Activity types */}
        <div className="space-y-1.5">
          <Label htmlFor="activities" className="text-xs text-muted-foreground">
            Activity
          </Label>
          <MultiSelect
            id="activities"
            className="w-[170px]"
            options={activityOptions}
            selected={filters.activityTypes}
            onChange={(activityTypes) => set("activityTypes", activityTypes)}
            allLabel="All types"
            disabled={disabled}
          />
        </div>

        {/* Iteration */}
        <div className="space-y-1.5">
          <Label htmlFor="iteration" className="text-xs text-muted-foreground">
            Iteration
          </Label>
          <Select
            value={filters.iterationPath === "" ? "__all__" : filters.iterationPath}
            onValueChange={(value) =>
              set("iterationPath", value === "__all__" ? "" : value)
            }
            disabled={disabled || iterationOptions.length === 0}
          >
            <SelectTrigger id="iteration" className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="__all__">All iterations</SelectItem>
              {iterationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {rangeError && (
        <p className="mt-2 text-sm text-destructive">{rangeError}</p>
      )}

      {hasActiveFilters && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>
            Filtered by
            {filters.userIds.length > 0 &&
              ` ${filters.userIds.length} contributor${filters.userIds.length > 1 ? "s" : ""}`}
            {filters.activityTypes.length > 0 &&
              `${filters.userIds.length > 0 ? "," : ""} ${filters.activityTypes.length} activity type${filters.activityTypes.length > 1 ? "s" : ""}`}
            {filters.iterationPath !== "" &&
              `${filters.userIds.length > 0 || filters.activityTypes.length > 0 ? "," : ""} iteration ${
                iterationOptions.find((o) => o.value === filters.iterationPath)?.label ??
                filters.iterationPath
              }`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6"
            onClick={() =>
              onChange({
                ...filters,
                userIds: [],
                activityTypes: [],
                iterationPath: "",
              })
            }
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
