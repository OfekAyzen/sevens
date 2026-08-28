import { useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { copy } from '../domain/copy';
import { GROUP_TARGET, RUN_LENGTH_DAYS, type RunDay } from '../domain/types';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Buddy } from '../ui/Buddy';
import { Button, Card, DayStrip, GroupNumber, Screen, Stat } from '../ui/components';
import {
  BellIcon,
  HandsIcon,
  HandshakeIcon,
  MedalIcon,
  RefreshIcon,
  ScaleIcon,
  TargetIcon,
  TicketIcon,
  XIcon,
} from '../ui/icons';
import { spring } from '../ui/motion';
import { playTick } from '../ui/sound';

/**
 * Home.
 *
 * Hierarchy is the design: the group number stays the hero, personal counters
 * are secondary. Design Revision 2026-08-27 (see docs/PRODUCT-SPEC.md) added a
 * current streak and a rank summary here — an explicitly-approved reversal of
 * the original "no ranking on this screen" rule.
 *
 * Day 3 additionally surfaces their own Day 1 reflection and the offer to lower
 * their minimum, because Day 3 is the documented dip — novelty gone, no visible
 * skill gain yet, and the finish line still too far away to pull.
 *
 * Design Revision, round 6: "How the week works" moved here from the signup
 * wizard — Buddy explains it once automatically the first time someone lands
 * on Home, then again any time they tap him. Onboard.tsx's teaser bubbles
 * still cover the gist before anyone commits to a group; this is the full
 * version, now unhurried by a form someone's mid-filling.
 */
export function Home({
  onLog,
  onSettings,
  now = new Date(),
}: {
  onLog: () => void;
  /** Only used for the Day-3 "lower your minimum" deep link — Feed/Group/
   * Settings are reached via the tab bar now, not buttons on Home. */
  onSettings?: () => void;
  now?: Date;
}) {
  const d = useDerived(now);
  const spendToken = useRun((s) => s.spendToken);
  const saveLog = useRun((s) => s.saveLog);
  const rulesSeen = useRun((s) => s.rulesSeen);
  const markRulesSeen = useRun((s) => s.markRulesSeen);
  const [rulesOpen, setRulesOpen] = useState(() => !rulesSeen);
  if (!d) return null;

  const dayCopy = copy.days[d.day];
  const loggedToday = d.covered.has(d.day);
  const todayLog = d.myDoc.logs.find((l) => l.day === d.day);
  const dayOneReflection = d.myDoc.logs.find((l) => l.day === 1)?.reflection ?? null;
  const myRank = d.leaderboard.find((row) => row.personId === d.me)?.rank ?? d.leaderboard.length;
  const myHue = `var(--p${(d.members.findIndex((m) => m.personId === d.me) % 4) + 1})`;

  function closeRules() {
    setRulesOpen(false);
    if (!rulesSeen) void markRulesSeen();
  }

  // Same "earliest uncovered day" the Settings cover-card computes — this is
  // just a one-tap shortcut to it, not a second source of truth.
  let earliestMissedDay: RunDay | null = null;
  if (d.myDoc.token.spentOnDay === null) {
    for (let day = 1; day <= RUN_LENGTH_DAYS; day++) {
      if (!d.covered.has(day as RunDay) && day <= d.day) {
        earliestMissedDay = day as RunDay;
        break;
      }
    }
  }

  return (
    <Screen testId="home" scroll="fixed">
      <GroupNumber total={d.total} target={GROUP_TARGET} />
      <p data-testid="group-headline">{d.headline}</p>

      <button
        className="row buddy-tap"
        style={{ justifyContent: 'center' }}
        onClick={() => setRulesOpen(true)}
        aria-label={copy.rules.heading}
        data-testid="buddy-tap"
      >
        <Buddy state={loggedToday ? 'happy' : 'waiting'} hue={myHue} testId="buddy" />
      </button>

      <DayStrip today={d.day} covered={d.covered} />

      <Card testId="day-banner">
        <h2>{dayCopy.heading}</h2>
        {dayCopy.body ? <p>{dayCopy.body}</p> : null}
      </Card>

      {d.day === 3 && dayOneReflection ? (
        <Card testId="day-three-callback">
          <p>{copy.days[3].callback(dayOneReflection)}</p>
        </Card>
      ) : null}

      {d.day === 3 ? (
        <Card testId="lower-offer">
          <p>{copy.days[3].lowerOffer}</p>
          <Button variant="quiet" onClick={onSettings} testId="go-lower">
            {copy.settings.lowerMinimum}
          </Button>
        </Card>
      ) : null}


      <Card testId="my-counters">
        <div className="row" style={{ gap: 'var(--s-6)' }}>
          <Stat label="Days practised" value={`${d.counters.daysPractised} of 7`} />
          <Stat label="Best run" value={d.counters.bestRun} />
          <Stat label={copy.counters.currentStreak} value={d.counters.currentStreak} />
        </div>
        <span className="muted" data-testid="rank-summary">
          {copy.counters.rankSummary(myRank)}
        </span>
      </Card>

      {loggedToday ? (
        <>
          <p className="muted" data-testid="already-logged">
            {copy.log.logged(d.day)}
          </p>
          {todayLog?.practised ? (
            <>
              {todayLog.sessions > 1 ? (
                <p className="muted" data-testid="sessions-count">
                  {copy.log.sessionsCount(todayLog.sessions)}
                </p>
              ) : null}
              <Button
                variant="quiet"
                testId="add-session"
                onClick={() => {
                  playTick();
                  void saveLog(d.day, { sessions: (todayLog.sessions || 1) + 1 });
                }}
              >
                {copy.log.addSession}
              </Button>
            </>
          ) : null}
        </>
      ) : (
        <Button onClick={onLog} testId="go-log" pulse>
          {copy.log.practisedQuestion}
        </Button>
      )}

      {earliestMissedDay !== null ? (
        <Button
          variant="quiet"
          testId="home-cover-day"
          onClick={() => void spendToken(earliestMissedDay)}
        >
          <span className="row" style={{ gap: 'var(--s-2)', justifyContent: 'center' }}>
            <TicketIcon size={16} />
            {copy.settings.coverThisDay(earliestMissedDay)}
          </span>
        </Button>
      ) : null}

      <AnimatePresence>
        {rulesOpen ? (
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRules}
          >
            <motion.div
              className="sheet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              data-testid="rules-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet__head">
                <div className="row" style={{ gap: 'var(--s-3)' }}>
                  <Buddy state="happy" hue={myHue} size={40} />
                  <h2>{copy.rules.heading}</h2>
                </div>
                <button
                  className="sheet__close"
                  aria-label={copy.group.close}
                  data-testid="rules-close"
                  onClick={closeRules}
                >
                  <XIcon size={18} />
                </button>
              </div>
              {(
                [
                  [TargetIcon, copy.rules.groupGoal],
                  [MedalIcon, copy.rules.bands],
                  [ScaleIcon, copy.rules.ceiling],
                  [RefreshIcon, copy.rules.midpoint],
                  [HandshakeIcon, copy.rules.catchup],
                  [TicketIcon, copy.rules.coverDay],
                  [BellIcon, copy.rules.notifications],
                  [HandsIcon, copy.setup.honourSystem],
                ] as [ComponentType<{ size?: number }>, string][]
              ).map(([Icon, text]) => (
                <div className="rule-row" key={text}>
                  <span className="rule-row__icon"><Icon size={20} /></span>
                  <p>{text}</p>
                </div>
              ))}
              <p className="muted">{copy.setup.spacingRationale}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Screen>
  );
}
