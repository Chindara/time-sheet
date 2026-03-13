import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ActivityType, TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from '../../models/TimeEntry';
import { parseHours, formatDateToISO } from '../../utils/validation';

interface TimeEntryFormProps {
  workItemId: number;
  entry?: TimeEntry; // If provided, form is in edit mode
  onSave: (input: CreateTimeEntryInput | UpdateTimeEntryInput) => Promise<void>;
  onCancel: () => void;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ workItemId, entry, onSave, onCancel }) => {
  const isEditMode = !!entry;

  const [date, setDate] = useState(entry?.date || formatDateToISO(new Date()));
  const [hoursInput, setHoursInput] = useState(entry?.hours.toString() || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [activityType, setActivityType] = useState<ActivityType>(entry?.activityType || ActivityType.Development);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Parse hours
    const hours = parseHours(hoursInput);
    if (hours === null || hours <= 0) {
      setError('Please enter a valid number of hours');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!activityType) {
      setError('Please select an activity type');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        const input: UpdateTimeEntryInput = {
          id: entry!.id,
          date,
          hours,
          description: description.trim() || undefined,
          activityType
        };
        await onSave(input);
      } else {
        const input: CreateTimeEntryInput = {
          workItemId,
          date,
          hours,
          description: description.trim() || undefined,
          activityType
        };
        await onSave(input);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time entry');
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">
          {isEditMode ? 'Edit Time Entry' : 'Log Time'}
        </h3>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="hours">Hours *</Label>
          <Input
            id="hours"
            placeholder="Enter hours (e.g., 1.5 or 1:30)"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            required
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Enter hours in decimal format (e.g., 1.5) or hours:minutes (e.g., 1:30)
          </p>
        </div>

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
            <SelectContent>
              {Object.values(ActivityType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isEditMode ? 'Update' : 'Save'}
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
