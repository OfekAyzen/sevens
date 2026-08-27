import { scoreDay } from './scoring';
import {
  RUN_LENGTH_DAYS,
  type DayIndex,
  type DayLog,
  type PersonCounters,
  type PersonId,
  type RunState,
} from './types';
import { pointsWindow } from './window';

/**
 * ADR-001: `currentRun` does not exist.
 *
 * A current-streak value can decrease, and any decreasing number will eventually
 * be rendered on a screen — at which point a single missed day on Day 3 of a
 * 7-day run deletes visible progress with four days still to play. So the
 * concept is absent from the model, not merely hidden from the UI. Every counter
 * below can only increase.
 */

/** Days on which this person actually practised. Token days are excluded. */
export function daysPractised(logs: DayLog[], personId: PersonId): number {
  return logs.filter((l) => l.personId === personId && l.practised).length;
}

/** Days covered for group-total purposes: practised days plus a spent token. */
export function coveredDays(state: RunState, personId: PersonId): Set<DayIndex> {
  const days = new Set<DayIndex>();
  for (const l of state.logs) {
    if (l.personId === personId && l.practised) days.add(l.day);
  }
  const token = state.tokens.find((t) => t.personId === personId);
  if (token?.spentOnDay != null) days.add(token.spentOnDay);
  return days;
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
  };
}
