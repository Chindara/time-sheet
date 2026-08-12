import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Selected values; an empty array means "all" */
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Label shown when nothing is selected, e.g. "All contributors" */
  allLabel: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Checkbox-list dropdown for filtering by several values at once.
 *
 * Radix Select is single-value only, so this is a small purpose-built control:
 * a trigger button plus an absolutely positioned option list. An empty
 * selection means no filter rather than "nothing", which keeps the default
 * state a single click away.
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  allLabel,
  disabled,
  className,
  id,
}) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape
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

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const triggerLabel = () => {
    if (selected.length === 0) return allLabel;
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label ?? allLabel;
    }
    return `${selected.length} selected`;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{triggerLabel()}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              Clear selection
            </button>
          )}

          {options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              No options available
            </p>
          )}

          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {isSelected && <Check className="h-4 w-4" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
