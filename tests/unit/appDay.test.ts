import { describe, expect, it } from 'vitest';
import {
  addDays,
  appDayDate,
  canLogFor,
  currentDay,
  daysBetween,
  resolvedDay,
} from '../../src/domain/appDay';

const TLV = 'Asia/Jerusalem';

describe('app-day boundary', () => {
  it('treats 01:30 as still belonging to the previous day', () => {
    // 01:30 local Tuesday -> Monday's app-day.
    const at0130 = new Date('2026-08-25T22:30:00Z'); // 01:30 Tue in UTC+3
    expect(appDayDate(at0130, TLV)).toBe('2026-08-25');
  });

  it('rolls over at exactly 04:00 local', () => {
    const at0359 = new Date('2026-08-26T00:59:00Z'); // 03:59 Wed
    const at0400 = new Date('2026-08-26T01:00:00Z'); // 04:00 Wed
    expect(appDayDate(at0359, TLV)).toBe('2026-08-25');
    expect(appDayDate(at0400, TLV)).toBe('2026-08-26');
  });

  it('gives each person their own boundary rather than a shared one', () => {
    // One instant, two people, two different app-days. 18:00Z is 06:00 the next
    // morning in Auckland (past its rollover) but still 11:00 the same day in LA.
    const instant = new Date('2026-08-26T18:00:00Z');
    expect(appDayDate(instant, 'Pacific/Auckland')).toBe('2026-08-27');
    expect(appDayDate(instant, 'America/Los_Angeles')).toBe('2026-08-26');
  });

  it('rolls an early-morning Auckland instant back, not forward', () => {
    // 15:00Z is 03:00 Aug 27 in Auckland, which is still Aug 26's app-day.
    const instant = new Date('2026-08-26T15:00:00Z');
    expect(appDayDate(instant, 'Pacific/Auckland')).toBe('2026-08-26');
  });

  it('never exposes a countdown: the boundary is a pure function of the instant', async () => {
    // Regression guard for "2 hours left to log" style pressure — the module
    // offers no remaining-time API at all.
    const mod = await import('../../src/domain/appDay');
    expect(Object.keys(mod).some((k) => /remaining|countdown|timeLeft/i.test(k))).toBe(false);
  });

  it('does calendar arithmetic without drifting across DST', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetween('2026-08-25', '2026-09-01')).toBe(7);
  });
});

describe('currentDay', () => {
  const start = '2026-08-26';
  it('maps the start date to day 1 and the last day to day 7', () => {
    expect(currentDay(new Date('2026-08-26T09:00:00Z'), TLV, start)).toBe(1);
    expect(currentDay(new Date('2026-09-01T09:00:00Z'), TLV, start)).toBe(7);
  });
  it('returns null outside the run', () => {
    expect(currentDay(new Date('2026-08-25T09:00:00Z'), TLV, start)).toBeNull();
    expect(currentDay(new Date('2026-09-02T09:00:00Z'), TLV, start)).toBeNull();
  });
});

describe('resolvedDay', () => {
  const start = '2026-08-26';

  it('matches currentDay while the run is live', () => {
    expect(resolvedDay(new Date('2026-08-26T09:00:00Z'), TLV, start)).toEqual({
      day: 1,
      finished: false,
      started: true,
    });
    expect(resolvedDay(new Date('2026-09-01T09:00:00Z'), TLV, start)).toEqual({
      day: 7,
      finished: false,
      started: true,
    });
  });

  // Regression: a group creator can set a future start date (see the "set the
  // experiment start date" onboarding step), and this used to collapse into
  // the exact same day-7/finished state as a run that had already ended —
  // showing the finale, with no tab bar, before day 1 had even happened. Now
  // `started: false` routes to WaitingToStart.tsx instead, which blocks
  // logging and posting until the real day 1 arrives.
  it('is day 1, not started, before a future start date arrives', () => {
    expect(resolvedDay(new Date('2026-08-24T09:00:00Z'), TLV, start)).toEqual({
      day: 1,
      finished: false,
      started: false,
    });
  });

  it('freezes at day 7, finished, once the run is over', () => {
    expect(resolvedDay(new Date('2026-09-02T09:00:00Z'), TLV, start)).toEqual({
      day: 7,
      finished: true,
      started: true,
    });
  });
});

describe('retroactive logging', () => {
  it('allows today and yesterday only', () => {
    expect(canLogFor(4, 4)).toBe(true);
    expect(canLogFor(3, 4)).toBe(true);
    expect(canLogFor(2, 4)).toBe(false);
    expect(canLogFor(5, 4)).toBe(false);
  });
});

describe('malformed input', () => {
  it('throws rather than silently producing NaN days', () => {
    // A NaN day index would surface much later as an app that renders nothing.
    expect(() => addDays('not-a-date', 1)).toThrow(RangeError);
    expect(() => daysBetween('2026-08-26', '26/08/2026')).toThrow(RangeError);
  });
});
