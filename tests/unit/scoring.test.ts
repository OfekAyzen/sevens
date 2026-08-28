import { describe, expect, it } from 'vitest';
import { actionValue, scoreBreakdown, scoreDay, supportAwards } from '../../src/domain/scoring';
import { DAILY_CEILING, DAILY_CEILING_WITH_CATCHUP } from '../../src/domain/types';
import { FOUR, makeLog, perfectLog } from './factories';

const others = FOUR.slice(1);

describe('the daily ceiling', () => {
  it('is exactly 24 and identical for every person', () => {
    for (const id of FOUR) {
      const log = perfectLog(id, 1, FOUR.filter((o) => o !== id));
      expect(scoreDay(log)).toBe(DAILY_CEILING);
    }
  });

  it('is 28 when catch-up is held, and only via reflecting and posting', () => {
    const log = perfectLog('ofek', 1, others);
    expect(scoreDay(log, true)).toBe(DAILY_CEILING_WITH_CATCHUP);
    // The +4 comes entirely from reflection (+2) and proof (+2).
    expect(actionValue('reflection', true)).toBe(6);
    expect(actionValue('proof', true)).toBe(5);
    expect(actionValue('practised', true)).toBe(10); // never boosted
    expect(actionValue('cue', true)).toBe(3); // never boosted
    expect(actionValue('support', true)).toBe(2); // never boosted
  });

  it('cannot be exceeded by practising longer — length is not scored', () => {
    const short = perfectLog('ofek', 1, others);
    const marathon = { ...short, minutes: 240 };
    expect(scoreDay(marathon)).toBe(scoreDay(short));
  });
});

describe('gating', () => {
  it('awards nothing for cue, reflection or proof without practising', () => {
    const log = makeLog({
      personId: 'ofek',
      day: 1,
      practised: false,
      atCue: true,
      reflection: 'a perfectly long and valid reflection string',
      proofPostIds: ['clip'],
    });
    expect(scoreDay(log)).toBe(0);
  });

  it('still awards support on a day off, keeping a lapsed person attached', () => {
    const log = makeLog({
      personId: 'ofek',
      day: 1,
      practised: false,
      supportedPersonIds: ['dana', 'sam'],
    });
    expect(scoreDay(log)).toBe(4);
  });
});

describe('support', () => {
  it('awards once per distinct person, capped at two', () => {
    expect(supportAwards(makeLog({ personId: 'ofek', day: 1, supportedPersonIds: ['dana'] }))).toBe(1);
    expect(
      supportAwards(makeLog({ personId: 'ofek', day: 1, supportedPersonIds: ['dana', 'dana'] })),
    ).toBe(1);
    expect(
      supportAwards(
        makeLog({ personId: 'ofek', day: 1, supportedPersonIds: ['dana', 'sam', 'priya'] }),
      ),
    ).toBe(2);
  });

  it('never awards for supporting yourself', () => {
    expect(
      supportAwards(makeLog({ personId: 'ofek', day: 1, supportedPersonIds: ['ofek', 'ofek'] })),
    ).toBe(0);
  });
});

describe('reflections', () => {
  it('are scored on being written, never graded or parsed', () => {
    const base = { personId: 'ofek' as const, day: 1 as const, practised: true };
    expect(scoreDay(makeLog({ ...base, reflection: 'too short' }))).toBe(10);
    // Whitespace padding cannot buy the threshold.
    expect(scoreDay(makeLog({ ...base, reflection: '    short       ' }))).toBe(10);
    expect(scoreDay(makeLog({ ...base, reflection: 'fifteen chars ok' }))).toBe(14);
  });
});

describe('minutes', () => {
  it('never change a score', () => {
    const base = makeLog({ personId: 'ofek', day: 1, practised: true });
    expect(scoreDay({ ...base, minutes: null })).toBe(scoreDay({ ...base, minutes: 999 }));
  });
});

describe('sessions', () => {
  it('is tracking only — logging extra sessions never changes a score', () => {
    const one = perfectLog('ofek', 1, others);
    const many = { ...one, sessions: 6 };
    expect(scoreDay(many)).toBe(scoreDay(one));
    expect(scoreDay(many)).toBe(DAILY_CEILING);
  });
});

describe('breakdown', () => {
  it('lists only earned rows and sums to the score', () => {
    const log = perfectLog('ofek', 1, others);
    const rows = scoreBreakdown(log);
    expect(rows.map((r) => r.action)).toEqual(['practised', 'cue', 'reflection', 'proof', 'support']);
    expect(rows.reduce((s, r) => s + r.points, 0)).toBe(scoreDay(log));
  });
});
