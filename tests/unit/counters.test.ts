import { describe, expect, it } from 'vitest';
import { bestRun, coveredDays, daysPractised, personCounters, totalMinutes } from '../../src/domain/counters';
import { catchupHolders } from '../../src/domain/catchup';
import type { DayIndex, RunState } from '../../src/domain/types';
import { FOUR, makeLog, makeRun, perfectLog } from './factories';

const practised = (personId: string, day: DayIndex) =>
  makeLog({ personId, day, practised: true });

describe('daysPractised', () => {
  it('counts only real practice, never a covered day', () => {
    const state = makeRun({
      logs: [practised('ofek', 1), practised('ofek', 2)],
      tokens: [{ personId: 'ofek', spentOnDay: 3 }],
    });
    expect(daysPractised(state.logs, 'ofek')).toBe(2);
    expect(coveredDays(state, 'ofek').size).toBe(3);
  });
});

describe('bestRun', () => {
  it('is bridged by a spent cover token', () => {
    const logs = [practised('ofek', 1), practised('ofek', 2), practised('ofek', 4)];
    const withoutToken = makeRun({ logs });
    const withToken = makeRun({ logs, tokens: [{ personId: 'ofek', spentOnDay: 3 }] });
    expect(bestRun(withoutToken, 'ofek')).toBe(2);
    expect(bestRun(withToken, 'ofek')).toBe(4);
  });

  it('never decreases as days are added — the core invariant', () => {
    // Property check: replay every prefix of a gappy week and assert monotonicity.
    const pattern: DayIndex[] = [1, 2, 3, 5, 6, 7];
    let previous = 0;
    for (let upto = 0; upto <= pattern.length; upto++) {
      const state = makeRun({ logs: pattern.slice(0, upto).map((d) => practised('ofek', d)) });
      const value = bestRun(state, 'ofek');
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
    expect(previous).toBe(3);
  });

  it('is 0 for someone who never practised, without any failure state', () => {
    expect(bestRun(makeRun(), 'ofek')).toBe(0);
  });
});

describe('totalMinutes', () => {
  it('sums minutes across the whole run, ignoring logs with none entered', () => {
    const logs = [
      makeLog({ personId: 'ofek', day: 1, practised: true, minutes: 10 }),
      makeLog({ personId: 'ofek', day: 2, practised: true, minutes: null }),
      makeLog({ personId: 'ofek', day: 3, practised: true, minutes: 15 }),
      makeLog({ personId: 'dana', day: 1, practised: true, minutes: 100 }),
    ];
    expect(totalMinutes(logs, 'ofek')).toBe(25);
  });
});

describe('monotonicity across the whole run', () => {
  it('holds for every counter as each day is appended', () => {
    let prev = { daysPractised: 0, bestRun: 0, totalPoints: 0 };
    const logs = [];
    for (let d = 1 as DayIndex; d <= 7; d = (d + 1) as DayIndex) {
      logs.push(perfectLog('ofek', d, FOUR.filter((o) => o !== 'ofek')));
      const state: RunState = makeRun({ logs: [...logs] });
      const c = personCounters(state, 'ofek', d);
      expect(c.daysPractised).toBeGreaterThanOrEqual(prev.daysPractised);
      expect(c.bestRun).toBeGreaterThanOrEqual(prev.bestRun);
      expect(c.totalPoints).toBeGreaterThanOrEqual(prev.totalPoints);
      prev = c;
    }
    expect(prev.daysPractised).toBe(7);
    expect(prev.bestRun).toBe(7);
    expect(prev.totalPoints).toBe(24 * 7); // 168
  });
});

describe('catch-up', () => {
  it('goes to everyone when all four are level, including day 1', () => {
    expect(catchupHolders(makeRun(), 1, 1).size).toBe(4);
  });

  it('goes to the person with the fewest points in the window', () => {
    const logs = [
      perfectLog('ofek', 1, ['dana']),
      perfectLog('dana', 1, ['ofek']),
      perfectLog('sam', 1, ['ofek']),
      // priya logged nothing on day 1
    ];
    const holders = catchupHolders(makeRun({ logs }), 2, 2);
    expect([...holders]).toEqual(['priya']);
  });

  it('is recomputed daily so nobody is labelled the underdog permanently', () => {
    const logs = [perfectLog('priya', 1, ['ofek'])];
    // On day 2 priya leads, so she is NOT a holder.
    expect(catchupHolders(makeRun({ logs }), 2, 2).has('priya')).toBe(false);
  });
});

describe('the Day 4 reset', () => {
  it('changes the displayed window without reducing any total', () => {
    const logs: ReturnType<typeof perfectLog>[] = [];
    for (let d = 1 as DayIndex; d <= 4; d = (d + 1) as DayIndex) {
      logs.push(perfectLog('ofek', d, ['dana', 'sam']));
    }
    const state = makeRun({ logs });
    const day3 = personCounters(state, 'ofek', 3);
    const day4 = personCounters(state, 'ofek', 4);
    // The displayed window shrinks from days 1-3 to day 4 onward...
    expect(day3.windowPoints).toBe(72);
    expect(day4.windowPoints).toBe(24);
    // ...while the full-run total is completely unaffected by the reset.
    // Nothing is lost on Day 4; only what is shown as the contest changes.
    expect(day3.totalPoints).toBe(96);
    expect(day4.totalPoints).toBe(96);
    expect(day4.daysPractised).toBe(day3.daysPractised);
    expect(day4.bestRun).toBe(day3.bestRun);
  });
});

describe('catchupDaysFor', () => {
  it('lists the days a person held the catch-up bonus', async () => {
    const { catchupDaysFor } = await import('../../src/domain/catchup');
    // ofek scores on day 1, so from day 2 onward priya is the one behind.
    const state = makeRun({ logs: [perfectLog('ofek', 1, ['dana'])] });
    const priyaDays = catchupDaysFor(state, 'priya', 3);
    // Day 1 is a four-way tie at zero, so everyone holds it that day.
    expect(priyaDays.has(1)).toBe(true);
    expect(priyaDays.has(2)).toBe(true);
    expect(catchupDaysFor(state, 'ofek', 3).has(2)).toBe(false);
  });

  it('returns nothing for a group with no declarations', async () => {
    const { catchupHolders } = await import('../../src/domain/catchup');
    expect(catchupHolders({ ...makeRun(), declarations: [] }, 1, 1).size).toBe(0);
  });
});

describe('isSecondHalf', () => {
  it('flips exactly at the announced midpoint', async () => {
    const { isSecondHalf, MIDPOINT_DAY } = await import('../../src/domain/window');
    expect(MIDPOINT_DAY).toBe(4);
    expect(isSecondHalf(3)).toBe(false);
    expect(isSecondHalf(4)).toBe(true);
    expect(isSecondHalf(7)).toBe(true);
  });
});
