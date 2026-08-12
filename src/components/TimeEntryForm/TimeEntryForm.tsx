import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  ActivityType,
  TimeEntry,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from "../../models/TimeEntry";
import { calculateHoursFromRange, formatDateToISO } from "../../utils/validation";

interface TimeEntryFormProps {
  workItemId: number;
  entry?: TimeEntry;
  onSave: (input: CreateTimeEntryInput | UpdateTimeEntryInput) => Promise<void>;
  onCancel: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i));
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

/** Formats decimal hours as a human-readable duration string */
function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Splits an "HH:MM" string into [hour, minute] parts */
function splitTime(time: string): [string, string] {
  const [h, m] = time.split(":");
  return [String(parseInt(h, 10)), m];
}

/** Returns the nearest past 15-min interval as [hour, minute] */
function defaultStartParts(): [string, string] {
  const now = new Date();
  const roundedMin = Math.floor(now.getMinutes() / 15) * 15;
  return [String(now.getHours()), String(roundedMin).padStart(2, "0")];
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  workItemId,
  entry,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!entry;

  const [startHour, startMinute] = entry?.startTime
    ? splitTime(entry.startTime)
    : defaultStartParts();
  const [endHour, endMinute] = entry?.endTime
    ? splitTime(entry.endTime)
    : ["", "00"];

  const [date, setDate] = useState(entry?.date || formatDateToISO(new Date()));
  const [sHour, setSHour] = useState(startHour);
  const [sMin, setSMin] = useState(startMinute);
  const [eHour, setEHour] = useState(endHour);
  const [eMin, setEMin] = useState(endMinute);
  const [description, setDescription] = useState(entry?.description || "");
  const [activityType, setActivityType] = useState<ActivityType>(
    entry?.activityType || ActivityType.Development,
  );
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const startTime =
    sHour !== "" && sMin !== ""
      ? `${String(sHour).padStart(2, "0")}:${sMin}`
      : "";
  const endTime =
    eHour !== "" && eMin !== ""
      ? `${String(eHour).padStart(2, "0")}:${eMin}`
      : "";

  const computedHours =
    startTime && endTime ? calculateHoursFromRange(startTime, endTime) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please select a date");
      return;
    }

    if (!startTime) {
      setError("Please select a start time");
      return;
    }

    if (!endTime) {
      setError("Please select an end time");
      return;
    }

    if (computedHours <= 0) {
      setError("End Time must be after Start Time");
      return;
    }

    if (!activityType) {
      setError("Please select an activity type");
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        const input: UpdateTimeEntryInput = {
          id: entry!.id,
          date,
          startTime,
          endTime,
          hours: computedHours,
          description: description.trim() || undefined,
          activityType,
        };
        await onSave(input);
      } else {
        const input: CreateTimeEntryInput = {
          workItemId,
          date,
          startTime,
          endTime,
          hours: computedHours,
          description: description.trim() || undefined,
          activityType,
        };
        await onSave(input);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save time entry",
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSaving}
          />
        </div>

        {/* Start Time / End Time */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Time */}
          <div className="space-y-2">
            <Label>Start Time *</Label>
            <div className="flex items-center gap-1">
              <Select value={sHour} onValueChange={setSHour} disabled={isSaving}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Hr" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={sMin} onValueChange={setSMin} disabled={isSaving}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label>End Time *</Label>
            <div className="flex items-center gap-1">
              <Select value={eHour} onValueChange={setEHour} disabled={isSaving}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Hr" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={eMin} onValueChange={setEMin} disabled={isSaving}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Duration preview */}
        {startTime && endTime && computedHours > 0 && (
          <p className="text-sm text-muted-foreground">
            Duration: <span className="font-medium">{formatDuration(computedHours)}</span>
          </p>
        )}

        {/* Activity Type */}
        <div className="space-y-2">
          <Label htmlFor="activity-type">Activity Type *</Label>
          <Select
            value={activityType}
            onValueChange={(value) => setActivityType(value as ActivityType)}
            disabled={isSaving}
          >
            <SelectTrigger id="activity-type">
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-y-auto">
              {Object.values(ActivityType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="What did you work on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 characters
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? "Update" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
