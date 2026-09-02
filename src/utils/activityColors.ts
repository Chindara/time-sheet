import { ActivityType } from '../models/TimeEntry';
import { PALETTE } from './palette';

/**
 * Categorical colours for activity types, assigned by fixed slot order.
 *
 * An activity always gets the same colour regardless of how many activities a
 * given report contains, so filtering never repaints the survivors. Colours
 * come from the shared PALETTE, so an activity in the donut matches the same
 * activity in the breakdown table's mix bar.
 *
 * The two activities that dominate most reports take the palette's blue and
 * orange, which are its most widely separated pair. Green and yellow land on
 * adjacent slots (Testing / Code Review) and are the weakest pairing here
 * under red-green colour vision deficiency, which is why every chart drawn
 * from this palette also ships a labelled hours/share table — identity is
 * never carried by colour alone.
 *
 * Key order below is the display order: it drives ACTIVITY_ORDER, which orders
 * donut slices, legend rows and breakdown columns.
 */
export const ACTIVITY_COLORS: Record<string, string> = {
  [ActivityType.Development]: PALETTE.blue,
  [ActivityType.BugFixing]: PALETTE.orange,
  [ActivityType.Testing]: PALETTE.green,
  [ActivityType.CodeReview]: PALETTE.yellow,
  [ActivityType.Documentation]: PALETTE.violet,
  [ActivityType.Design]: PALETTE.teal,
  [ActivityType.Deployment]: PALETTE.indigo,
  [ActivityType.Requirements]: PALETTE.red
};

/**
 * Used for any activity value not in the palette (e.g. legacy stored values).
 * Deliberately a neutral grey rather than a palette hue, so an unrecognised
 * value cannot be mistaken for a known activity.
 */
export const FALLBACK_ACTIVITY_COLOR = '#9498A0';

/** Fixed display order for activity types, matching the palette slot order */
export const ACTIVITY_ORDER: string[] = Object.keys(ACTIVITY_COLORS);

export function activityColor(activity: string): string {
  return ACTIVITY_COLORS[activity] ?? FALLBACK_ACTIVITY_COLOR;
}
