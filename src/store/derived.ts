import { useMemo } from 'react';
import { allComments, allPosts, assemble, nameMap, withResolvedSupport } from '../domain/assemble';
import { resolvedDay } from '../domain/appDay';
import { catchupHolders } from '../domain/catchup';
import { coveredDays, personCounters } from '../domain/counters';
import { groupHeadline, groupTotal } from '../domain/group';
import { rankMembers, type RankedMember } from '../domain/leaderboard';
import type { Comment, MemberDoc, PersonId, Post, RunDay, RunState } from '../domain/types';
import { useRun } from './run';

/**
 * The single place derived state is computed.
 *
 * Every value here is built inside a `useMemo` from raw store fields. Nothing
 * derived is ever produced inside a zustand selector: a selector that returns a
 * freshly-built object or Set makes the store see a new snapshot on every render,
 * and React re-renders until it throws error #185. That bug shipped once in this
 * project and passed all 58 unit tests while showing a blank screen, which is why
 * it now has one controlled home.
 */
export interface Derived {
  day: RunDay;
  runState: RunState;
  members: MemberDoc[];
  names: Record<PersonId, string>;
  me: PersonId;
  covered: Set<RunDay>;
  counters: ReturnType<typeof personCounters>;
  total: number;
  headline: string;
  hasCatchup: boolean;
  /** The four people ranked by their current contest score. Design Revision
   * 2026-08-27 — see docs/PRODUCT-SPEC.md. */
  leaderboard: RankedMember[];
  posts: Post[];
  /** Every comment across the group, oldest first. Purely social — never scored. */
  comments: Comment[];
  myDoc: MemberDoc;
  /** True once the run is over — day 8 and beyond. */
  finished: boolean;
  /** False before the group's start date arrives. A group creator can set a
   * future Day 1 (see the onboarding start-date step), and nobody may log or
   * post until it actually arrives — App.tsx takes over the whole screen
   * while this is false, the same way it does for `finished`. */
  started: boolean;
}

export function useDerived(now: Date = new Date()): Derived | null {
  const group = useRun((s) => s.group);
  const me = useRun((s) => s.me);
  const myDoc = useRun((s) => s.myDoc);
  const members = useRun((s) => s.members);

  // `now` is intentionally excluded from the dependency list: a fresh Date on
  // every render would invalidate the memo every render and defeat the point.
  // The day changes at 04:00, and the app re-derives on any store write.
  const time = now.getTime();

  return useMemo(() => {
    if (!group || !me || !myDoc || members.length === 0) return null;

    const resolved = withResolvedSupport(members);
    const runState = assemble(group, resolved);
    const zone = myDoc.declaration.timeZone;
    const { day: effectiveDay, finished, started } = resolvedDay(new Date(time), zone, group.startDate);

    return {
      day: effectiveDay,
      runState,
      members: resolved,
      names: nameMap(resolved),
      me,
      covered: coveredDays(runState, me) as Set<RunDay>,
      counters: personCounters(runState, me, effectiveDay),
      total: groupTotal(runState),
      headline: groupHeadline(runState, effectiveDay),
      hasCatchup: catchupHolders(runState, effectiveDay, effectiveDay).has(me),
      leaderboard: rankMembers(runState, effectiveDay),
      posts: allPosts(resolved),
      comments: allComments(resolved),
      myDoc,
      finished,
      started,
    };
  }, [group, me, myDoc, members, time]);
}
