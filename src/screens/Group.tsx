import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { copy } from '../domain/copy';
import { personCounters } from '../domain/counters';
import { GROUP_TARGET, type PersonId } from '../domain/types';
import { useDerived } from '../store/derived';
import { Buddy } from '../ui/Buddy';
import { ChevronRightIcon, XIcon } from '../ui/icons';
import { reorderTransition, spring } from '../ui/motion';
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

  const [selected, setSelected] = useState<PersonId | null>(null);

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

  const detailRow = selected ? rows.find((r) => r.personId === selected) : null;
  const detailMember = selected ? d.members.find((m) => m.personId === selected) : null;
  // Reuses the same personCounters() every screen's own stats come from — see
  // src/domain/counters.ts. Deliberately omits anything about the cover
  // token: its spend status is holder-only, never shown on someone else's row
  // (see docs/PRODUCT-SPEC.md).
  const detailCounters = selected ? personCounters(d.runState, selected, d.day) : null;

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
            onClick={() => setSelected(row.personId)}
            data-testid={`row-${row.personId}`}
            role="button"
            tabIndex={0}
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
              <ChevronRightIcon size={18} className="leaderboard-row__chevron" />
            </div>
          </motion.div>
        ))}
      </Card>

      {d.members.length < 4 ? (
        <p className="muted" data-testid="waiting">
          {copy.group.waiting(d.members.length)}
        </p>
      ) : null}

      <AnimatePresence>
        {detailRow && detailCounters ? (
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="sheet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              data-testid="person-detail"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet__head">
                <h2 style={{ color: detailRow.hue }}>{detailRow.name}</h2>
                <button
                  className="sheet__close"
                  aria-label={copy.group.close}
                  data-testid="person-detail-close"
                  onClick={() => setSelected(null)}
                >
                  <XIcon size={18} />
                </button>
              </div>
              <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <span className="muted">{copy.counters.daysPractised(detailCounters.daysPractised)}</span>
                <span className="muted">{copy.counters.bestRun(detailCounters.bestRun)}</span>
                <span className="muted">{copy.group.streak(detailCounters.currentStreak)}</span>
                <span className="muted">{copy.group.minutes(detailCounters.totalMinutes)}</span>
                <span className="muted">{copy.group.detailPosts(detailMember?.posts.length ?? 0)}</span>
                <span className="muted">
                  {copy.group.detailSupport(detailMember?.reactions.length ?? 0)}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Screen>
  );
}
