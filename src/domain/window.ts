import { RUN_LENGTH_DAYS, type DayIndex } from './types';

/** The announced midpoint. Disclosed on the Day 0 rules screen, never a surprise. */
export const MIDPOINT_DAY: DayIndex = 4;

/**
 * The Day 4 reset changes only which points are DISPLAYED as the contest.
 * Nothing is lost: days practised, best run and the group total are untouched,
 * and the first-half total remains available as a private personal stat.
 */
export function pointsWindow(today: DayIndex): { from: DayIndex; to: DayIndex } {
  return today >= MIDPOINT_DAY
    ? { from: MIDPOINT_DAY, to: RUN_LENGTH_DAYS as DayIndex }
    : { from: 1, to: 3 };
}

export function isSecondHalf(today: DayIndex): boolean {
  return today >= MIDPOINT_DAY;
}
