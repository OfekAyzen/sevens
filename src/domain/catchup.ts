import { windowPoints } from './counters';
import type { DayIndex, PersonId, RunState } from './types';

/**
 * Catch-up holders for a given day: everyone currently tied at the FEWEST points
 * in the displayed window.
 *
 * Evaluated fresh each day, so nobody is persistently labelled "the underdog".
 * Ties all qualify, which also means everyone qualifies on Day 1 at 0-0-0-0 —
 * harmless, and it avoids a special case.
 *
 * The bonus applies only to reflecting and posting: the two actions that need no
 * extra practice time. It never touches showing up or supporting, so it cannot
 * be farmed and it never rewards absence.
 */
export function catchupHolders(
  state: RunState,
  today: DayIndex,
  asOfDay: DayIndex,
): Set<PersonId> {
  const ids = state.declarations.map((d) => d.personId);
  if (ids.length === 0) return new Set();

  // Score the window up to (but excluding) the day being evaluated.
  const prior = { ...state, logs: state.logs.filter((l) => l.day < asOfDay) };
  const scores = ids.map((id) => ({ id, pts: windowPoints(prior, id, today) }));
  const min = Math.min(...scores.map((s) => s.pts));
  return new Set(scores.filter((s) => s.pts === min).map((s) => s.id));
}

/** The days on which `personId` held catch-up, for scoring their whole run. */
export function catchupDaysFor(
  state: RunState,
  personId: PersonId,
  today: DayIndex,
): Set<DayIndex> {
  const days = new Set<DayIndex>();
  for (let d = 1; d <= today; d++) {
    if (catchupHolders(state, today, d as DayIndex).has(personId)) days.add(d as DayIndex);
  }
  return days;
}
