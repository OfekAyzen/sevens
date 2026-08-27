import { coveredDays } from './counters';
import {
  GROUP_MAX,
  GROUP_TARGET,
  RUN_LENGTH_DAYS,
  type DayIndex,
  type GroupBand,
  type RunState,
} from './types';

/**
 * The group total is the hero number of the whole app: the sum of covered days
 * across all four people, out of 28, targeting 24.
 *
 * The target is 24 rather than 28 on purpose. A 28/28 target is an all-or-nothing
 * streak at group scale, which makes the guilt social rather than personal —
 * strictly worse. At 24 the group can absorb four missed days and still land it.
 */
export function groupTotal(state: RunState): number {
  return state.declarations.reduce(
    (sum, d) => sum + coveredDays(state, d.personId).size,
    0,
  );
}

/** Bands, not pass/fail. All of them are published on the Day 0 rules screen. */
export function groupBand(total: number): GroupBand {
  if (total >= GROUP_MAX) return { kind: 'perfect', label: 'Perfect week. All four, every day.' };
  if (total >= GROUP_TARGET) return { kind: 'target', label: 'Target hit.' };
  if (total >= 20) return { kind: 'strong', label: 'Strong week.' };
  if (total >= 16)
    return {
      kind: 'half',
      label:
        "Over half. Four people, sixteen days of practice that didn't exist last week.",
    };
  return { kind: 'none', label: null };
}

/** Where the group would be at the end of `day` if everyone practised daily. */
export function onPaceTotal(day: DayIndex, groupSize: number): number {
  return day * groupSize;
}

/** Sessions still physically available in the rest of the run. */
export function sessionsRemaining(state: RunState, today: DayIndex): number {
  const daysLeft = RUN_LENGTH_DAYS - today + 1;
  return state.declarations.reduce((sum, d) => {
    const covered = coveredDays(state, d.personId);
    let open = 0;
    for (let x = today; x <= RUN_LENGTH_DAYS; x++) {
      if (!covered.has(x as DayIndex)) open += 1;
    }
    return sum + Math.min(open, daysLeft);
  }, 0);
}

/**
 * Group-screen headline. When behind, it states the number and the nearest
 * reachable next step — never the deficit, never a cause, never a person.
 */
export function groupHeadline(state: RunState, today: DayIndex): string {
  const total = groupTotal(state);
  const pace = onPaceTotal(today, state.declarations.length || 4);
  const ahead = total - pace;

  if (total >= GROUP_TARGET) return `${total} of ${GROUP_TARGET}. Target hit.`;
  if (ahead > 0)
    return `${total} of ${GROUP_TARGET}. ${ahead} ahead of pace.`;
  if (ahead === 0) return `${total} of ${GROUP_TARGET}. On pace.`;

  const remaining = sessionsRemaining(state, today);
  return `${total} of ${GROUP_TARGET}. ${remaining} sessions left in the week.`;
}
