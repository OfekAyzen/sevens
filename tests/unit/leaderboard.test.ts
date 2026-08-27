import { describe, expect, it } from 'vitest';
import { rankMembers } from '../../src/domain/leaderboard';
import type { DayIndex } from '../../src/domain/types';
import { FOUR, makeLog, makeRun, perfectLog } from './factories';

describe('rankMembers', () => {
  it('sorts descending by the current contest score', () => {
    const logs = [
      perfectLog('ofek', 1, ['dana']), // 24 (no catch-up: not everyone is tied)
      makeLog({ personId: 'dana', day: 1, practised: true }), // 10
    ];
    const ranked = rankMembers(makeRun({ logs }), 1);
    expect(ranked.map((r) => r.personId).slice(0, 2)).toEqual(['ofek', 'dana']);
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[0]?.points).toBeGreaterThan(ranked[1]?.points ?? 0);
  });

  it('assigns sequential ranks with no gaps or duplicates', () => {
    const ranked = rankMembers(makeRun(), 1);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('breaks ties alphabetically by personId, for a stable render order only', () => {
    // Everyone at 0 points on day 1 is a four-way tie.
    const ranked = rankMembers(makeRun(), 1);
    expect(ranked.map((r) => r.personId)).toEqual([...FOUR].sort((a, b) => a.localeCompare(b)));
  });

  it('marks the lowest scorer(s) as holding the catch-up bonus', () => {
    const logs = [perfectLog('ofek', 1, ['dana', 'sam'])];
    const ranked = rankMembers(makeRun({ logs }), 2);
    const ofek = ranked.find((r) => r.personId === 'ofek');
    const priya = ranked.find((r) => r.personId === 'priya');
    expect(ofek?.hasCatchupBonus).toBe(false);
    expect(priya?.hasCatchupBonus).toBe(true);
  });

  it('reports currentStreak and totalMinutes per row', () => {
    const logs: ReturnType<typeof perfectLog>[] = [];
    for (let d = 1 as DayIndex; d <= 3; d = (d + 1) as DayIndex) {
      logs.push(perfectLog('ofek', d, ['dana']));
    }
    const ranked = rankMembers(makeRun({ logs }), 3);
    const ofek = ranked.find((r) => r.personId === 'ofek');
    expect(ofek?.currentStreak).toBe(3);
    expect(ofek?.totalMinutes).toBe(18 * 3);
  });
});
