import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { copy } from '../domain/copy';
import { GROUP_TARGET } from '../domain/types';
import { useDerived } from '../store/derived';
import { Buddy } from '../ui/Buddy';
import { reorderTransition } from '../ui/motion';
import { playRankUp } from '../ui/sound';
import {
  Card,
  CatchupBadge,
  GroupNumber,
  RankBadge,
  Screen,
  StreakBadge,
} from '../ui/components';

/**
 * The leaderboard.
 *
 * Design Revision — 2026-08-27 (see docs/PRODUCT-SPEC.md): this screen used to
 * list the four people alphabetically with only their own covered-day count.
 * It now ranks them by current contest score, and shows each person's streak,
 * minutes and catch-up status — an explicitly-approved product pivot toward
 * real competitive mechanics. Rows carry a stable `layoutId` so a change in
 * standings visibly reorders them rather than popping to a new position.
 *
 * Design Revision, round 6: per-person activity detail moved off this screen
 * — it now lives behind tapping someone's icon in Posts, not a leaderboard
 * row. This screen stays pure ranking.
 */
export function Group({ now = new Date() }: { now?: Date }) {
  const d = useDerived(now);

  // Hooks run unconditionally, before the `!d` early return below — see
  // Finale.tsx for the same pattern with its one-shot celebration ref.
  const myRank = d?.leaderboard.find((row) => row.personId === d.me)?.rank;
  const previousRank = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (myRank !== undefined && previousRank.current !== undefined && myRank < previousRank.current) {
      playRankUp();
    }
    previousRank.current = myRank;
  }, [myRank]);

  if (!d) return null;

  const rows = d.leaderboard.map((row) => {
    const member = d.members.find((m) => m.personId === row.personId);
    const i = d.members.findIndex((m) => m.personId === row.personId);
    return {
      ...row,
      name: member?.displayName ?? row.personId,
      hue: `var(--p${(i % 4) + 1})`,
    };
  });

  return (
    <Screen testId="group" accent="var(--p3)" scroll="fixed">
      <GroupNumber total={d.total} target={GROUP_TARGET} />
      <p data-testid="group-headline">{d.headline}</p>

      <Card testId="people">
        {rows.map((row) => (
          <motion.div
            className="leaderboard-row"
            key={row.personId}
            layout
            layoutId={row.personId}
            transition={reorderTransition}
          >
            <RankBadge rank={row.rank} />
            <Buddy state={row.rank === 1 ? 'happy' : 'idle'} hue={row.hue} size={32} />
            <span className="leaderboard-row__name" style={{ color: row.hue }}>
              {row.name}
            </span>
            <div className="leaderboard-row__stats">
              {row.hasCatchupBonus ? <CatchupBadge label={copy.group.catchupBadge} /> : null}
              <StreakBadge streak={row.currentStreak} />
              <span className="muted">{copy.group.minutes(row.totalMinutes)}</span>
              <span className="leaderboard-row__points">{row.points}</span>
            </div>
          </motion.div>
        ))}
      </Card>

      {d.members.length < 4 ? (
        <p className="muted" data-testid="waiting">
          {copy.group.waiting(d.members.length)}
        </p>
      ) : null}
    </Screen>
  );
}
