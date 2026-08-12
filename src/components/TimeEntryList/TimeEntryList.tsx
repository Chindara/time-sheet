import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, Trash2 } from "lucide-react";
import { TimeEntry, ActivityType } from "../../models/TimeEntry";
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatTimeForDisplay,
} from "../../utils/dateUtils";

interface TimeEntryListProps {
  entries: TimeEntry[];
  currentUserId: string;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => Promise<void>;
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({
  entries,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const [deleteDialogEntry, setDeleteDialogEntry] = useState<TimeEntry | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (entry: TimeEntry) => {
    setDeleteDialogEntry(entry);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogEntry) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteDialogEntry);
      setDeleteDialogEntry(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogEntry(null);
  };

  const getActivityBadgeVariant = (
    activityType: ActivityType,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (activityType) {
      case ActivityType.Design:
      case ActivityType.Requirements:
      case ActivityType.Documentation:
        return "default";
      case ActivityType.Development:
      case ActivityType.CodeReview:
      case ActivityType.BugFixing:
        return "secondary";
      case ActivityType.Deployment:
        return "destructive";
      default:
        return "outline";
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mb-4" />
        <p className="text-lg mb-2">No time entries logged yet</p>
        <p className="text-sm">Click "Log Time" to add your first entry</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isOwner = entry.userId === currentUserId;
        return (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex gap-6 mb-3 flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Date
                      </div>
                      <div className="font-semibold">
                        {formatDateForDisplay(entry.date)}
                      </div>
                    </div>
                    {entry.startTime && entry.endTime ? (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Time
                        </div>
                        <div className="font-semibold">
                          {formatTimeForDisplay(entry.startTime)} – {formatTimeForDisplay(entry.endTime)}
                        </div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Hours
                      </div>
                      <div className="font-semibold">
                        {entry.hours.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Activity
                      </div>
                      <Badge
                        variant={getActivityBadgeVariant(entry.activityType)}
                      >
                        {entry.activityType}
                      </Badge>
                    </div>
                  </div>

                  {entry.description && (
                    <div className="mb-2 text-sm">{entry.description}</div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Logged by {entry.userDisplayName} •{" "}
                    {formatDateTimeForDisplay(entry.createdAt)}
                    {entry.updatedAt !== entry.createdAt && (
                      <>
                        {" "}
                        • Updated {formatDateTimeForDisplay(entry.updatedAt)}
                      </>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(entry)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(entry)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {deleteDialogEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="min-w-[400px]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Delete Time Entry</h3>
              <p className="mb-4">
                Are you sure you want to delete this time entry?
              </p>
              <div className="bg-muted p-3 rounded-md mb-6 space-y-1 text-sm">
                <div>
                  <strong>Date:</strong>{" "}
                  {formatDateForDisplay(deleteDialogEntry.date)}
                </div>
                <div>
                  <strong>Hours:</strong> {deleteDialogEntry.hours}
                </div>
                <div>
                  <strong>Activity:</strong> {deleteDialogEntry.activityType}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
