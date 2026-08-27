import { copy } from '../domain/copy';
import { coveredDays } from '../domain/counters';
import { GROUP_TARGET } from '../domain/types';
import { useDerived } from '../store/derived';
import { Button, Card, GroupNumber, Screen } from '../ui/components';

/**
 * The group screen.
 *
 * The four rows are ordered ALPHABETICALLY and never by any performance value.
 * A list ordered by points is a leaderboard whatever it is labelled, and the
 * person at the bottom reads it as a verdict on themselves.
 *
 * Each row shows that person's own covered-day count and nothing comparative:
 * no rank, no minutes, no indication of who holds the catch-up bonus, and no way
 * to tell a covered day from a practised one.
 */
export function Group({ onBack, now = new Date() }: { onBack: () => void; now?: Date }) {
  const d = useDerived(now);
  if (!d) return null;

  const people = d.members.map((m, i) => ({
    id: m.personId,
    name: m.displayName,
    skill: m.declaration.skill,
    days: coveredDays(d.runState, m.personId).size,
    hue: `var(--p${(i % 4) + 1})`,
  }));

  return (
    <Screen testId="group">
      <GroupNumber total={d.total} target={GROUP_TARGET} />
      <p data-testid="group-headline">{d.headline}</p>

      <Card testId="people">
        {people.map((p) => (
          <div className="row" key={p.id} style={{ justifyContent: 'space-between' }}>
            <span style={{ color: p.hue, fontWeight: 600 }}>{p.name}</span>
            <span className="muted">{p.skill}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p.days}</span>
          </div>
        ))}
      </Card>

      {d.members.length < 4 ? (
        <p className="muted" data-testid="waiting">
          {copy.group.waiting(d.members.length)}
        </p>
      ) : null}

      <Button variant="quiet" onClick={onBack} testId="back">
        {copy.nav.back}
      </Button>
    </Screen>
  );
}
