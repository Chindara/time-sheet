import { ActivityType } from '../models/TimeEntry';

/**
 * Categorical colours for activity types, assigned by fixed slot order.
 *
 * An activity always gets the same colour regardless of how many activities a
 * given report contains, so filtering never repaints the survivors. The slot
 * order is the colour-vision-deficiency safety mechanism, not cosmetic: worst
 * adjacent CVD separation is dE 9.1 and worst adjacent normal-vision
 * separation dE 19.6 against a white surface.
 *
 * Testing, Code Review and Documentation fall below 3:1 contrast on white,
 * which is why every chart drawn from this palette also ships a labelled
 * hours/share table — identity is never carried by colour alone.
 */
export const ACTIVITY_COLORS: Record<string, string> = {
  [ActivityType.Development]: '#2a78d6',
  [ActivityType.BugFixing]: '#eb6834',
  [ActivityType.Testing]: '#1baf7a',
  [ActivityType.CodeReview]: '#eda100',
  [ActivityType.Documentation]: '#e87ba4',
  [ActivityType.Design]: '#008300',
  [ActivityType.Deployment]: '#4a3aa7',
  [ActivityType.Requirements]: '#e34948'
};

/** Used for any activity value not in the palette (e.g. legacy stored values) */
export const FALLBACK_ACTIVITY_COLOR = '#6d7885';

/** Fixed display order for activity types, matching the palette slot order */
export const ACTIVITY_ORDER: string[] = Object.keys(ACTIVITY_COLORS);

export function activityColor(activity: string): string {
  return ACTIVITY_COLORS[activity] ?? FALLBACK_ACTIVITY_COLOR;
}
