import { coveredDays } from './coverage';
import type { DayIndex, PersonId, RunState } from './types';

/**
 * Design Revision — 2026-08-27 (see docs/PRODUCT-SPEC.md).
 *
 * `currentStreak` is the consecutive run of covered days ending at `asOf`. Unlike
 * `bestRun`, this is NOT monotonic — it can fall to 0 on a missed day. That
 * reversal of the original ADR-001 was a deliberate, explicitly-approved product
 * decision to make the streak a real, losable stake rather than an absent one.
 *
 * If `asOf` itself has no record yet (today not logged), counting starts from
 * `asOf - 1` so a day still in progress doesn't zero the streak before it ends.
 */
export function currentStreak(state: RunState, personId: PersonId, asOf: DayIndex): number {
  const covered = coveredDays(state, personId);
  let d = (covered.has(asOf) ? asOf : asOf - 1) as DayIndex;
  let run = 0;
  while (d >= 1 && covered.has(d)) {
    run += 1;
    d = (d - 1) as DayIndex;
  }
  return run;
}
