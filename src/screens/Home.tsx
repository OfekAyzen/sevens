import { copy } from '../domain/copy';
import { GROUP_TARGET } from '../domain/types';
import { useDerived } from '../store/derived';
import { Buddy } from '../ui/Buddy';
import { Button, Card, DayStrip, GroupNumber, Screen, Stat } from '../ui/components';

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
  if (!d) return null;

  const dayCopy = copy.days[d.day];
  const loggedToday = d.covered.has(d.day);
  const dayOneReflection = d.myDoc.logs.find((l) => l.day === 1)?.reflection ?? null;
  const myRank = d.leaderboard.find((row) => row.personId === d.me)?.rank ?? d.leaderboard.length;
  const myHue = `var(--p${(d.members.findIndex((m) => m.personId === d.me) % 4) + 1})`;

  return (
    <Screen testId="home" scroll="fixed">
      <GroupNumber total={d.total} target={GROUP_TARGET} />
      <p data-testid="group-headline">{d.headline}</p>

      <div className="row" style={{ justifyContent: 'center' }}>
        <Buddy state={loggedToday ? 'happy' : 'waiting'} hue={myHue} testId="buddy" />
      </div>

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
        <p className="muted" data-testid="already-logged">
          {copy.log.logged(d.day)}
        </p>
      ) : (
        <Button onClick={onLog} testId="go-log" pulse>
          {copy.log.practisedQuestion}
        </Button>
      )}
    </Screen>
  );
}
