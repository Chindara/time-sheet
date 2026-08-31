/**
 * Categorical colours for contributors.
 *
 * Unlike activities, the set of contributors is not known ahead of time, so a
 * colour cannot be pinned to a name. It is pinned to the contributor's slot in
 * a stable ordering instead — pass the project's full contributor list, sorted
 * the same way every render, and a person keeps their colour while filters
 * change the subset actually drawn.
 *
 * The palette is categorical rather than sequential: adjacent slots differ in
 * hue and lightness so neighbouring segments of a stacked bar stay separable,
 * including under the common colour vision deficiencies. Colour is never the
 * only carrier of identity here — the chart ships a labelled legend and every
 * segment names its contributor and hours on hover.
 */
export const CONTRIBUTOR_COLORS: string[] = [
  '#4269d0',
  '#efb118',
  '#ff725c',
  '#6cc5b0',
  '#3ca951',
  '#ff8ab7',
  '#a463f2',
  '#97bbf5',
  '#9c6b4e',
  '#9498a0'
];

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
  userIds.forEach((userId, index) => colors.set(userId, contributorColor(index)));
  return colors;
}
