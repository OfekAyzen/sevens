import { describe, expect, it } from 'vitest';
import { plannedNotifications, withinQuietHours } from '../../src/domain/notify';
import type { MemberDoc, RunDay } from '../../src/domain/types';
import { makeDeclaration, makeLog } from './factories';

function makeMember(
  personId: string,
  over: Partial<MemberDoc> = {},
  declarationOver = {},
): MemberDoc {
  return {
    personId,
    displayName: personId,
    declaration: makeDeclaration(personId, declarationOver),
    logs: [],
    token: { personId, spentOnDay: null },
    posts: [],
    reactions: [],
    updatedAt: '2026-08-26T00:00:00.000Z',
    ...over,
  };
}

/** 09:00 on a run day — early enough that every slot is still in the future. */
const morning = new Date('2026-08-26T09:00:00');

describe('the two-per-day cap', () => {
  it('never plans more than two on an ordinary day', () => {
    const me = makeMember('ofek');
    const others = [me, makeMember('dana', { logs: [makeLog({ personId: 'dana', day: 1, practised: true })] })];
    expect(plannedNotifications(me, others, 1, 4, morning).length).toBeLessThanOrEqual(2);
  });

  it('allows a third only on day 4, for someone two or more days down', () => {
    const me = makeMember('ofek');
    const dana = makeMember('dana', { logs: [makeLog({ personId: 'dana', day: 4, practised: true })] });
    const planned = plannedNotifications(me, [me, dana], 4, 8, morning);
    expect(planned.some((n) => n.slot === 'checkin')).toBe(true);
    expect(planned.length).toBeLessThanOrEqual(3);
  });

  it('sends no day 4 check-in to someone who has kept up', () => {
    const logs = [1, 2, 3].map((day) => makeLog({ personId: 'ofek', day: day as RunDay, practised: true }));
    const me = makeMember('ofek', { logs });
    const planned = plannedNotifications(me, [me], 4, 4, morning);
    expect(planned.some((n) => n.slot === 'checkin')).toBe(false);
  });
});

describe('the cue reminder', () => {
  it('is never scheduled into the past', () => {
    // Default fixture reminder is 08:00 and the clock is 09:00: nothing to fire.
    const me = makeMember('ofek');
    expect(plannedNotifications(me, [me], 1, 0, morning).some((n) => n.slot === 'cue')).toBe(false);
  });

  it('is their own sentence, verbatim, and nothing else', () => {
    const me = makeMember(
      'ofek',
      {},
      { cue: 'after I put my coffee down, twenty F-chord changes', reminderTime: '18:30' },
    );
    const planned = plannedNotifications(me, [me], 1, 0, morning);
    const cue = planned.find((n) => n.slot === 'cue');
    expect(cue?.body).toBe('You said: after I put my coffee down, twenty F-chord changes');
    // No encouragement bolted on in the app's voice.
    expect(cue?.body).not.toMatch(/let's go|you've got this|time to/i);
  });

  it('is suppressed once today is already logged', () => {
    const me = makeMember('ofek', { logs: [makeLog({ personId: 'ofek', day: 1, practised: true })] });
    const planned = plannedNotifications(me, [me], 1, 1, morning);
    expect(planned.some((n) => n.slot === 'cue')).toBe(false);
  });

  it('is absent when they have turned their reminder off', () => {
    const me = makeMember('ofek', {}, { reminderTime: null });
    expect(plannedNotifications(me, [me], 1, 0, morning).some((n) => n.slot === 'cue')).toBe(false);
  });
});

describe('the peer digest', () => {
  it('names who practised and never who did not', () => {
    const me = makeMember('ofek');
    const dana = makeMember('dana', { logs: [makeLog({ personId: 'dana', day: 1, practised: true })] });
    const sam = makeMember('sam'); // did not practise
    const planned = plannedNotifications(me, [me, dana, sam], 1, 4, morning);
    const digest = planned.find((n) => n.slot === 'digest');
    expect(digest?.body).toContain('dana');
    expect(digest?.body).not.toContain('sam');
    expect(digest?.body).not.toMatch(/hasn't|didn't|missed|behind|only/i);
  });

  it('is suppressed entirely when nobody practised', () => {
    const me = makeMember('ofek');
    const planned = plannedNotifications(me, [me, makeMember('dana')], 2, 0, morning);
    expect(planned.some((n) => n.slot === 'digest')).toBe(false);
  });

  it('mentions no minutes, ranks or cover days', () => {
    const dana = makeMember('dana', {
      logs: [makeLog({ personId: 'dana', day: 1, practised: true, minutes: 45 })],
      token: { personId: 'dana', spentOnDay: 1 },
    });
    const me = makeMember('ofek');
    const digest = plannedNotifications(me, [me, dana], 1, 4, morning).find(
      (n) => n.slot === 'digest',
    );
    expect(digest?.body).not.toMatch(/45|minute|rank|1st|cover/i);
  });
});

describe('quiet hours', () => {
  it('covers 21:00 to 06:00', () => {
    expect(withinQuietHours(new Date('2026-08-26T21:00:00'))).toBe(true);
    expect(withinQuietHours(new Date('2026-08-26T23:30:00'))).toBe(true);
    expect(withinQuietHours(new Date('2026-08-26T05:59:00'))).toBe(true);
    expect(withinQuietHours(new Date('2026-08-26T06:00:00'))).toBe(false);
    expect(withinQuietHours(new Date('2026-08-26T20:00:00'))).toBe(false);
  });

  it('drops a reminder the user set inside the quiet window', () => {
    // They are allowed to set 23:00; the app simply never originates then.
    const me = makeMember('ofek', {}, { reminderTime: '23:00' });
    const planned = plannedNotifications(me, [me], 1, 0, morning);
    expect(planned.some((n) => n.slot === 'cue')).toBe(false);
  });
});
