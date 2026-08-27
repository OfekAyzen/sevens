import { describe, expect, it } from 'vitest';
import { currentStreak } from '../../src/domain/streak';
import type { DayIndex } from '../../src/domain/types';
import { makeLog, makeRun } from './factories';

const practised = (personId: string, day: DayIndex) =>
  makeLog({ personId, day, practised: true });

describe('currentStreak', () => {
  it('counts the consecutive covered days ending today', () => {
    const state = makeRun({ logs: [practised('ofek', 1), practised('ofek', 2), practised('ofek', 3)] });
    expect(currentStreak(state, 'ofek', 3)).toBe(3);
  });

  it('falls to 0 once a day with no log has fully passed — unlike bestRun, this can decrease', () => {
    // Days 1-2 covered, day 3 was missed entirely, and "today" has moved on to
    // day 4 — the gap on day 3 breaks the streak.
    const state = makeRun({ logs: [practised('ofek', 1), practised('ofek', 2)] });
    expect(currentStreak(state, 'ofek', 4)).toBe(0);
  });

  it('does not zero out mid-day: if today has no record yet, counts up to yesterday', () => {
    // Days 1-2 covered, day 3 is the current day and simply hasn't been logged
    // yet — the streak should still read as 2, not 0, while the day is open.
    const state = makeRun({ logs: [practised('ofek', 1), practised('ofek', 2)] });
    expect(currentStreak(state, 'ofek', 3)).toBe(2);
  });

  it('is bridged by a spent cover token, same as bestRun', () => {
    const logs = [practised('ofek', 1), practised('ofek', 2), practised('ofek', 4)];
    const withToken = makeRun({ logs, tokens: [{ personId: 'ofek', spentOnDay: 3 }] });
    expect(currentStreak(withToken, 'ofek', 4)).toBe(4);
  });

  it('is 0 for someone who has never practised', () => {
    expect(currentStreak(makeRun(), 'ofek', 5)).toBe(0);
  });
});
