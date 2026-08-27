import { catchupHolders } from './catchup';
import { totalMinutes, windowPoints } from './counters';
import { currentStreak } from './streak';
import type { DayIndex, PersonId, RunState } from './types';

export interface RankedMember {
  personId: PersonId;
  rank: number;
  points: number;
  currentStreak: number;
  totalMinutes: number;
  hasCatchupBonus: boolean;
}

/**
 * Design Revision — 2026-08-27 (see docs/PRODUCT-SPEC.md).
 *
 * The four people ranked by their currently displayed contest score (see
 * `pointsWindow` / the Day 4 reset). This reverses the original "no sort by
 * performance" rule as an explicitly-approved product decision. Ties break
 * alphabetically by `personId` purely for a stable render order — it carries
 * no meaning of its own.
 */
export function rankMembers(state: RunState, today: DayIndex): RankedMember[] {
  const holders = catchupHolders(state, today, today);
  const ids = state.declarations.map((d) => d.personId);

  const rows = ids
    .map((personId) => ({
      personId,
      points: windowPoints(state, personId, today),
      currentStreak: currentStreak(state, personId, today),
      totalMinutes: totalMinutes(state.logs, personId),
      hasCatchupBonus: holders.has(personId),
    }))
    .sort((a, b) => b.points - a.points || a.personId.localeCompare(b.personId));

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
