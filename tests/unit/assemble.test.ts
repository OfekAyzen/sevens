import { describe, expect, it } from 'vitest';
import { allComments, allPosts, assemble, practisedOn, withResolvedSupport } from '../../src/domain/assemble';
import { personalReport } from '../../src/domain/report';
import { scoreDay } from '../../src/domain/scoring';
import { groupTotal } from '../../src/domain/group';
import type { Comment, Group, MemberDoc, Post, RunDay } from '../../src/domain/types';
import { makeDeclaration, makeLog } from './factories';

const group: Group = { code: 'ABC123', startDate: '2026-08-26' };

function member(personId: string, over: Partial<MemberDoc> = {}): MemberDoc {
  return {
    personId,
    displayName: personId,
    declaration: makeDeclaration(personId),
    logs: [],
    token: { personId, spentOnDay: null },
    posts: [],
    reactions: [],
    comments: [],
    updatedAt: '2026-08-26T10:00:00.000Z',
    ...over,
  };
}

function post(personId: string, day: RunDay, id = `${personId}-${day}`): Post {
  return {
    id,
    personId,
    day,
    caption: 'twenty F-chord changes',
    createdAt: `2026-08-2${day}T10:00:00.000Z`,
    ...(day === 1 ? { image: 'data:image/jpeg;base64,AAAA' } : {}),
  };
}

function comment(personId: string, postId: string, day: RunDay, text: string, createdAt: string): Comment {
  return { id: `${personId}-${postId}-${createdAt}`, postId, personId, day, text, createdAt };
}

describe('assemble', () => {
  it('builds a RunState the existing domain functions can score', () => {
    const members = [
      member('ofek', { logs: [makeLog({ personId: 'ofek', day: 1, practised: true })] }),
      member('dana', { logs: [makeLog({ personId: 'dana', day: 1, practised: true })] }),
    ];
    const state = assemble(group, members);
    expect(state.startDate).toBe('2026-08-26');
    expect(state.declarations).toHaveLength(2);
    expect(groupTotal(state)).toBe(2);
  });

  it('works with members who have not synced yet', () => {
    // A group of four where only one person has installed the app must still
    // render rather than waiting for a complete set.
    const state = assemble(group, [member('ofek')]);
    expect(state.declarations).toHaveLength(1);
    expect(groupTotal(state)).toBe(0);
  });

  it('orders people deterministically, never by performance', () => {
    const members = [member('sam'), member('dana'), member('ofek')];
    const a = assemble(group, members).declarations.map((d) => d.personId);
    const b = assemble(group, [...members].reverse()).declarations.map((d) => d.personId);
    expect(a).toEqual(b);
    expect(a).toEqual(['dana', 'ofek', 'sam']);
  });
});

describe('cross-document support', () => {
  it('credits the supporter, resolving the post owner from another document', () => {
    const danaPost = post('dana', 1);
    const members = withResolvedSupport([
      member('ofek', {
        logs: [makeLog({ personId: 'ofek', day: 1, practised: true })],
        reactions: [{ postId: danaPost.id, targetPersonId: 'dana', day: 1, emoji: '👏' }],
      }),
      member('dana', { posts: [danaPost] }),
    ]);
    const ofekLog = members[0]?.logs[0];
    expect(ofekLog?.supportedPersonIds).toEqual(['dana']);
    expect(scoreDay(ofekLog!)).toBe(12); // 10 practised + 2 support
  });

  it('drops a reaction to your own post', () => {
    const mine = post('ofek', 1);
    const [resolved] = withResolvedSupport([
      member('ofek', {
        logs: [makeLog({ personId: 'ofek', day: 1, practised: true })],
        posts: [mine],
        reactions: [{ postId: mine.id, targetPersonId: 'ofek', day: 1, emoji: '👏' }],
      }),
    ]);
    expect(resolved?.logs[0]?.supportedPersonIds).toEqual([]);
  });

  it('drops a reaction to a post that no longer exists', () => {
    const [resolved] = withResolvedSupport([
      member('ofek', {
        logs: [makeLog({ personId: 'ofek', day: 1, practised: true })],
        reactions: [{ postId: 'ghost', targetPersonId: 'dana', day: 1, emoji: '👏' }],
      }),
    ]);
    expect(resolved?.logs[0]?.supportedPersonIds).toEqual([]);
  });
});

describe('feed', () => {
  it('returns a finite list, newest first', () => {
    const posts = allPosts([
      member('ofek', { posts: [post('ofek', 1), post('ofek', 3)] }),
      member('dana', { posts: [post('dana', 2)] }),
    ]);
    expect(posts.map((p) => p.personId)).toEqual(['ofek', 'dana', 'ofek']);
  });
});

describe('allComments', () => {
  it('returns comments from every member, oldest first', () => {
    const comments = allComments([
      member('ofek', { comments: [comment('ofek', 'dana-1', 1, 'nice one', '2026-08-26T12:00:00.000Z')] }),
      member('dana', { comments: [comment('dana', 'dana-1', 1, 'thanks!', '2026-08-26T09:00:00.000Z')] }),
    ]);
    expect(comments.map((c) => c.personId)).toEqual(['dana', 'ofek']);
  });

  it('treats an absent comments field as empty — a doc persisted before comments existed', () => {
    const { comments: _omit, ...legacyShape } = member('ofek');
    expect(allComments([legacyShape as MemberDoc])).toEqual([]);
  });
});

describe('practisedOn', () => {
  it('names only who practised', () => {
    const members = [
      member('ofek', { logs: [makeLog({ personId: 'ofek', day: 1, practised: true })] }),
      member('dana', { logs: [makeLog({ personId: 'dana', day: 1, practised: false })] }),
    ];
    expect(practisedOn(members, 1)).toEqual(['ofek']);
  });
});

describe('the Day 8 report', () => {
  it('pairs the first and last artefacts for the before-and-after', () => {
    const doc = member('ofek', {
      logs: [1, 2].map((d) => makeLog({ personId: 'ofek', day: d as RunDay, practised: true })),
      posts: [post('ofek', 1, 'first'), post('ofek', 7, 'last')],
    });
    const report = personalReport(doc, 7);
    expect(report.firstArtefact?.id).toBe('first');
    expect(report.lastArtefact?.id).toBe('last');
  });

  it('leaves the after side empty rather than showing one artefact twice', () => {
    const doc = member('ofek', { posts: [post('ofek', 1, 'only')] });
    const report = personalReport(doc, 7);
    expect(report.firstArtefact?.id).toBe('only');
    expect(report.lastArtefact).toBeNull();
  });

  it('reports the median of sessions where minutes were entered', () => {
    const doc = member('ofek', {
      logs: [
        makeLog({ personId: 'ofek', day: 1, practised: true, minutes: 10 }),
        makeLog({ personId: 'ofek', day: 2, practised: true, minutes: 30 }),
        makeLog({ personId: 'ofek', day: 3, practised: true, minutes: 20 }),
        makeLog({ personId: 'ofek', day: 4, practised: true }), // no minutes entered
      ],
    });
    expect(personalReport(doc, 7).medianMinutes).toBe(20);
  });

  it('reports no median at all when nobody entered minutes', () => {
    const doc = member('ofek', {
      logs: [makeLog({ personId: 'ofek', day: 1, practised: true })],
    });
    expect(personalReport(doc, 7).medianMinutes).toBeNull();
  });

  it('keeps reflections in day order, in the user own words', () => {
    const doc = member('ofek', {
      logs: [
        makeLog({ personId: 'ofek', day: 2, practised: true, reflection: 'cleaner than Monday' }),
        makeLog({ personId: 'ofek', day: 1, practised: true, reflection: 'the F chord is impossible' }),
      ],
    });
    expect(personalReport(doc, 7).reflections).toEqual([
      { day: 1, text: 'the F chord is impossible' },
      { day: 2, text: 'cleaner than Monday' },
    ]);
  });

  it('notes an unused cover day as a neutral fact', () => {
    expect(personalReport(member('ofek'), 7).unusedToken).toBe(true);
    expect(
      personalReport(member('ofek', { token: { personId: 'ofek', spentOnDay: 3 } }), 7).unusedToken,
    ).toBe(false);
  });
});
