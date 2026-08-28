import type { Comment, DayLog, Group, MemberDoc, PersonId, Post, RunDay, RunState } from './types';

/**
 * Assemble the shared RunState from independently-owned member documents.
 *
 * This is the seam that let the whole scoring layer stay untouched when the app
 * went from one person to four: every domain function still takes a RunState, and
 * this builds one out of whatever documents have synced so far. A member who has
 * not synced yet simply is not in it.
 */
export function assemble(group: Group, members: MemberDoc[]): RunState {
  const ordered = [...members].sort((a, b) => a.personId.localeCompare(b.personId));
  return {
    startDate: group.startDate,
    declarations: ordered.map((m) => m.declaration),
    logs: ordered.flatMap((m) => m.logs),
    tokens: ordered.map((m) => m.token),
  };
}

/** Display names, keyed by person, for anything the group can see. */
export function nameMap(members: MemberDoc[]): Record<PersonId, string> {
  return Object.fromEntries(members.map((m) => [m.personId, m.displayName]));
}

/**
 * Support awards have to be resolved across documents: the reaction lives in the
 * supporter's own doc, so their log needs the target list stitched in before
 * scoring. Reactions to your own posts and to posts that no longer exist are
 * dropped here rather than being trusted.
 */
export function withResolvedSupport(members: MemberDoc[]): MemberDoc[] {
  const postOwner = new Map<string, PersonId>();
  for (const m of members) for (const p of m.posts) postOwner.set(p.id, p.personId);

  return members.map((m) => ({
    ...m,
    logs: m.logs.map((log) => ({
      ...log,
      supportedPersonIds: m.reactions
        .filter((r) => r.day === log.day)
        .map((r) => postOwner.get(r.postId))
        .filter((owner): owner is PersonId => owner !== undefined && owner !== m.personId),
    })),
  }));
}

/** Posts from every member, newest first. A finite list — it ends. */
export function allPosts(members: MemberDoc[]): Post[] {
  return members
    .flatMap((m) => m.posts)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Comments from every member, oldest first — reading order, unlike
 * `allPosts`. Purely social: never scored, never required.
 */
export function allComments(members: MemberDoc[]): Comment[] {
  return members
    .flatMap((m) => m.comments ?? [])
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Who practised on a given day. Used by the digest; never who did NOT. */
export function practisedOn(members: MemberDoc[], day: RunDay): PersonId[] {
  return members
    .filter((m) => m.logs.some((l) => l.day === day && l.practised))
    .map((m) => m.personId);
}

export function emptyLog(personId: PersonId, day: RunDay): DayLog {
  return {
    personId,
    day,
    practised: false,
    atCue: false,
    reflection: null,
    proofPostIds: [],
    supportedPersonIds: [],
    minutes: null,
    loggedLate: false,
    sessions: 0,
  };
}
