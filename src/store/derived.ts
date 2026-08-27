import { useMemo } from 'react';
import { assemble, allPosts, nameMap, withResolvedSupport } from '../domain/assemble';
import { currentDay } from '../domain/appDay';
import { catchupHolders } from '../domain/catchup';
import { coveredDays, personCounters } from '../domain/counters';
import { groupHeadline, groupTotal } from '../domain/group';
import type { MemberDoc, PersonId, Post, RunDay, RunState } from '../domain/types';
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
  posts: Post[];
  myDoc: MemberDoc;
  /** True once the run is over — day 8 and beyond. */
  finished: boolean;
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
    const day = currentDay(new Date(time), zone, group.startDate);

    // Past the end of the run everything freezes at day 7 so the finale and the
    // report keep rendering rather than blanking out on Monday morning.
    const effectiveDay: RunDay = day ?? 7;

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
      posts: allPosts(resolved),
      myDoc,
      finished: day === null && time > Date.parse(`${group.startDate}T00:00:00Z`),
    };
  }, [group, me, myDoc, members, time]);
}
