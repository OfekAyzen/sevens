import { coveredDays } from './coverage';
import { scoreDay } from './scoring';
import { currentStreak } from './streak';
import {
  RUN_LENGTH_DAYS,
  type DayIndex,
  type DayLog,
  type PersonCounters,
  type PersonId,
  type RunState,
} from './types';
import { pointsWindow } from './window';

export { coveredDays };

/**
 * `bestRun`/`daysPractised`/`totalPoints` stay monotonic by design — they are
 * the honest record of what happened and should never appear to take anything
 * back. `currentStreak` (see ./streak.ts) is the one figure in `PersonCounters`
 * that can fall — a deliberate, explicitly-approved reversal of the original
 * ADR-001. See docs/PRODUCT-SPEC.md, Design Revision 2026-08-27.
 */

/** Days on which this person actually practised. Token days are excluded. */
export function daysPractised(logs: DayLog[], personId: PersonId): number {
  return logs.filter((l) => l.personId === personId && l.practised).length;
}

/** Minutes logged across the whole run. Now surfaced and compared on the
 * leaderboard — see Design Revision 2026-08-27 in docs/PRODUCT-SPEC.md. */
export function totalMinutes(logs: DayLog[], personId: PersonId): number {
  return logs
    .filter((l) => l.personId === personId)
    .reduce((sum, l) => sum + (l.minutes ?? 0), 0);
}

/**
 * Longest consecutive run of covered days achieved this week. A spent token
 * bridges a gap. Monotonic: recomputing after another day can only ever return
 * the same value or a larger one, because covered days are never removed.
 */
export function bestRun(state: RunState, personId: PersonId): number {
  const covered = coveredDays(state, personId);
  let best = 0;
  let run = 0;
  for (let d = 1; d <= RUN_LENGTH_DAYS; d++) {
    if (covered.has(d as DayIndex)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/** Total process points across the whole run. A spent token awards zero. */
export function totalPoints(
  state: RunState,
  personId: PersonId,
  catchupDays: Set<DayIndex> = new Set(),
): number {
  return state.logs
    .filter((l) => l.personId === personId)
    .reduce((sum, l) => sum + scoreDay(l, catchupDays.has(l.day)), 0);
}

/** Points inside the currently displayed contest window (see the Day 4 reset). */
export function windowPoints(
  state: RunState,
  personId: PersonId,
  today: DayIndex,
  catchupDays: Set<DayIndex> = new Set(),
): number {
  const window = pointsWindow(today);
  return state.logs
    .filter(
      (l) => l.personId === personId && l.day >= window.from && l.day <= window.to,
    )
    .reduce((sum, l) => sum + scoreDay(l, catchupDays.has(l.day)), 0);
}

export function personCounters(
  state: RunState,
  personId: PersonId,
  today: DayIndex,
  catchupDays: Set<DayIndex> = new Set(),
): PersonCounters {
  return {
    personId,
    daysPractised: daysPractised(state.logs, personId),
    bestRun: bestRun(state, personId),
    totalPoints: totalPoints(state, personId, catchupDays),
    windowPoints: windowPoints(state, personId, today, catchupDays),
    currentStreak: currentStreak(state, personId, today),
    totalMinutes: totalMinutes(state.logs, personId),
  };
}
