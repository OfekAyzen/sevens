import { copy } from '../domain/copy';
import { GROUP_TARGET } from '../domain/types';
import { useDerived } from '../store/derived';
import { Button, Card, DayStrip, GroupNumber, Screen, Stat } from '../ui/components';

/**
 * Home.
 *
 * Hierarchy is the design: the group number is the hero, personal counters are
 * secondary, and there is no ranking on this screen at all. Both personal figures
 * shown only ever increase.
 *
 * Day 3 additionally surfaces their own Day 1 reflection and the offer to lower
 * their minimum, because Day 3 is the documented dip — novelty gone, no visible
 * skill gain yet, and the finish line still too far away to pull.
 */
export function Home({
  onLog,
  onGroup,
  onFeed,
  onSettings,
  now = new Date(),
}: {
  onLog: () => void;
  onGroup: () => void;
  onFeed: () => void;
  onSettings: () => void;
  now?: Date;
}) {
  const d = useDerived(now);
  if (!d) return null;

  const dayCopy = copy.days[d.day];
  const loggedToday = d.covered.has(d.day);
  const dayOneReflection = d.myDoc.logs.find((l) => l.day === 1)?.reflection ?? null;

  return (
    <Screen testId="home">
      <GroupNumber total={d.total} target={GROUP_TARGET} />
      <p data-testid="group-headline">{d.headline}</p>

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
        </div>
        <span className="muted">{copy.counters.nothingAtStake}</span>
      </Card>

      {loggedToday ? (
        <p className="muted" data-testid="already-logged">
          {copy.log.logged(d.day)}
        </p>
      ) : (
        <Button onClick={onLog} testId="go-log">
          {copy.log.practisedQuestion}
        </Button>
      )}

      <Button variant="quiet" onClick={onFeed} testId="go-feed">
        {copy.feed.heading}
      </Button>
      <Button variant="quiet" onClick={onGroup} testId="go-group">
        {copy.group.heading}
      </Button>
      <Button variant="plain" onClick={onSettings} testId="go-settings">
        {copy.settings.heading}
      </Button>
    </Screen>
  );
}
