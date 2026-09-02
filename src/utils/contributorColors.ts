import { PALETTE_SPECTRUM } from './palette';

/**
 * Categorical colours for contributors.
 *
 * Unlike activities, the set of contributors is not known ahead of time, so a
 * colour cannot be pinned to a name. It is pinned to the contributor's slot in
 * a stable ordering instead — pass the project's full contributor list, sorted
 * the same way every render, and a person keeps their colour while filters
 * change the subset actually drawn.
 *
 * The hues come from the shared PALETTE, the same source the activity charts
 * draw from, so the whole report reads as one colour system. Colour is never
 * the only carrier of identity here — the chart ships a labelled legend and
 * every segment names its contributor and hours on hover.
 */
export const CONTRIBUTOR_COLORS: string[] = PALETTE_SPECTRUM;

/** Used once the palette is exhausted and slots start repeating */
export function contributorColor(slot: number): string {
  return CONTRIBUTOR_COLORS[slot % CONTRIBUTOR_COLORS.length];
}

/**
 * Maps each user id to a colour by its position in the given order. Feed this
 * the project's whole contributor list, not the filtered one, so removing a
 * contributor from a filter does not repaint the survivors.
 */
export function buildContributorColors(userIds: string[]): Map<string, string> {
  const colors = new Map<string, string>();
  userIds.forEach((userId, index) =>
    colors.set(userId, contributorColor(index)),
  );
  return colors;
}
