import { describe, expect, it } from 'vitest';
import { groupBand, groupHeadline, groupTotal, onPaceTotal, sessionsRemaining } from '../../src/domain/group';
import { GROUP_MAX, GROUP_TARGET, type DayIndex } from '../../src/domain/types';
import { FOUR, makeLog, makeRun } from './factories';

const practised = (personId: string, day: DayIndex) => makeLog({ personId, day, practised: true });

/** Everyone practises on every day from 1..upto. */
function fullWeek(upto: DayIndex) {
  const logs = [];
  for (let d = 1 as DayIndex; d <= upto; d = (d + 1) as DayIndex) {
    for (const id of FOUR) logs.push(practised(id, d));
  }
  return makeRun({ logs });
}

describe('groupTotal', () => {
  it('sums covered days across all four people, out of 28', () => {
    expect(groupTotal(fullWeek(7))).toBe(GROUP_MAX);
    expect(groupTotal(fullWeek(1))).toBe(4);
    expect(groupTotal(makeRun())).toBe(0);
  });

  it('counts a spent cover token toward the group', () => {
    const state = makeRun({
      logs: [practised('ofek', 1)],
      tokens: [{ personId: 'ofek', spentOnDay: 2 }],
    });
    expect(groupTotal(state)).toBe(2);
  });
});

describe('bands', () => {
  it('never labels anything a failure', () => {
    for (let total = 0; total <= GROUP_MAX; total++) {
      const band = groupBand(total);
      if (band.label !== null) {
        expect(band.label).not.toMatch(/fail|lost|missed|behind/i);
      }
    }
  });

  it('is a tiered outcome rather than pass-or-fail at the target', () => {
    expect(groupBand(28).kind).toBe('perfect');
    expect(groupBand(24).kind).toBe('target');
    expect(groupBand(23).kind).toBe('strong');
    expect(groupBand(20).kind).toBe('strong');
    expect(groupBand(19).kind).toBe('half');
    expect(groupBand(16).kind).toBe('half');
    // Below the lowest band there is no label at all — just the number.
    expect(groupBand(15).label).toBeNull();
  });

  it('sets the target below the maximum so the group can absorb missed days', () => {
    expect(GROUP_TARGET).toBeLessThan(GROUP_MAX);
    expect(GROUP_MAX - GROUP_TARGET).toBe(4);
  });
});

describe('pace', () => {
  it('is four per day for four people', () => {
    expect(onPaceTotal(4, 4)).toBe(16);
    expect(onPaceTotal(1, 4)).toBe(4);
  });

  it('counts only sessions that are still physically available', () => {
    // Day 6 of 7: two days remain, four people, nobody has logged yet.
    expect(sessionsRemaining(makeRun(), 6)).toBe(8);
    // Day 7: one day left.
    expect(sessionsRemaining(makeRun(), 7)).toBe(4);
  });
});

describe('groupHeadline', () => {
  it('states a shortfall as a number and a next step, never as a deficit or a cause', () => {
    const state = makeRun({ logs: [practised('ofek', 1), practised('dana', 1)] });
    const line = groupHeadline(state, 3);
    expect(line).toMatch(/^2 of 24\./);
    expect(line).toMatch(/sessions left/);
    // Rule 12: no author, no blame, no deficit.
    expect(line).not.toMatch(/behind|short|need|should|someone|nobody|only/i);
  });

  it('says so plainly when the group is ahead', () => {
    expect(groupHeadline(fullWeek(3), 2)).toMatch(/ahead of pace/);
  });

  it('announces the target the moment it is hit', () => {
    expect(groupHeadline(fullWeek(6), 6)).toBe('24 of 24. Target hit.');
  });

  it('never names a person in any state', () => {
    for (let day = 1 as DayIndex; day <= 7; day = (day + 1) as DayIndex) {
      const line = groupHeadline(fullWeek(Math.max(1, day - 2) as DayIndex), day);
      for (const name of FOUR) expect(line.toLowerCase()).not.toContain(name);
    }
  });
});
