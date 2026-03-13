import React from "react";
import { TimeEntry, CreateTimeEntryInput, UpdateTimeEntryInput } from "../../models/TimeEntry";
import { TimeEntryForm } from "../TimeEntryForm/TimeEntryForm";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeEntryPanelProps {
  isOpen: boolean;
  workItemId: number;
  entry?: TimeEntry;
  onSave: (input: CreateTimeEntryInput | UpdateTimeEntryInput) => Promise<void>;
  onClose: () => void;
}

export const TimeEntryPanel: React.FC<TimeEntryPanelProps> = ({
  isOpen,
  workItemId,
  entry,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 h-full w-[400px] max-w-full bg-background border-l shadow-xl z-50 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {entry ? "Edit Time Entry" : "Log Time"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <TimeEntryForm
          workItemId={workItemId}
          entry={entry}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </>
  );
};
