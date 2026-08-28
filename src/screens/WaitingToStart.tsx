import { copy } from '../domain/copy';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Buddy } from '../ui/Buddy';
import { Button, Card, Screen } from '../ui/components';

/**
 * Shown full-screen, in place of the tab shell, from the moment someone
 * joins a group until its Day 1 actually arrives. A group creator can set a
 * future start date (see Onboard.tsx's start-date step) — before it,
 * nothing is loggable or postable, so there is no tab shell to gate: this
 * screen replaces it entirely, the same way Finale.tsx replaces it after
 * day 7. See useDerived's `started` field, which this is the sole consumer
 * of besides App.tsx's routing check.
 */
export function WaitingToStart({ now = new Date() }: { now?: Date }) {
  const d = useDerived(now);
  const group = useRun((s) => s.group);
  const reset = useRun((s) => s.reset);
  if (!d || !group) return null;

  const myHue = `var(--p${(d.members.findIndex((m) => m.personId === d.me) % 4) + 1})`;
  const startDate = new Date(`${group.startDate}T00:00:00`);
  const dateLabel = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen testId="waiting-to-start">
      <div className="row" style={{ justifyContent: 'center' }}>
        <Buddy state="waiting" hue={myHue} size={120} testId="buddy" />
      </div>

      <h1 style={{ textAlign: 'center' }}>{copy.waiting.heading(dateLabel)}</h1>
      <p style={{ textAlign: 'center' }}>{copy.waiting.body}</p>

      <Card testId="waiting-status">
        <p className="muted">{copy.waiting.joined(d.members.length)}</p>
        <p className="muted">{copy.waiting.declaration(d.myDoc.declaration.skill)}</p>
        <p className="muted">
          {copy.onboard.yourCode}: {group.code}
        </p>
      </Card>

      <Button variant="plain" onClick={() => void reset()} testId="reset">
        {copy.settings.resetAll}
      </Button>
    </Screen>
  );
}
