import { useState } from 'react';
import { copy } from '../domain/copy';
import { RUN_LENGTH_DAYS, type RunDay } from '../domain/types';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Button, Card, Screen } from '../ui/components';

/**
 * Settings.
 *
 * Two things here are load-bearing and must stay one tap:
 *
 *  - **Lowering the minimum.** An off-ramp with a confirmation dialog is not an
 *    off-ramp, it is pressure with extra steps.
 *  - **Spending the cover day.** No reason field, no "are you sure, it's your
 *    only one". The token exists precisely for the evening when someone has no
 *    capacity to negotiate with an app.
 *
 * Notification toggles are independent and private — the group is never told who
 * has them off.
 */
export function Settings({ onBack, now = new Date() }: { onBack: () => void; now?: Date }) {
  const d = useDerived(now);
  const lowerMinimum = useRun((s) => s.lowerMinimum);
  const setReminder = useRun((s) => s.setReminder);
  const spendToken = useRun((s) => s.spendToken);
  const reset = useRun((s) => s.reset);
  const status = useRun((s) => s.status);
  const syncNow = useRun((s) => s.syncNow);
  const group = useRun((s) => s.group);

  const [minutes, setMinutes] = useState('');

  if (!d) return null;

  const token = d.myDoc.token;
  const missedDays: RunDay[] = [];
  for (let day = 1; day <= RUN_LENGTH_DAYS; day++) {
    if (!d.covered.has(day as RunDay) && day <= d.day) missedDays.push(day as RunDay);
  }

  return (
    <Screen testId="settings">
      <h1>{copy.settings.heading}</h1>

      <Card testId="sync-status">
        <h2>{copy.sync.heading}</h2>
        <p data-testid="sync-line">
          {status.state === 'offline'
            ? copy.sync.offline
            : status.state === 'syncing'
              ? copy.sync.syncing
              : status.state === 'ok'
                ? copy.sync.ok(status.members, new Date(status.at).toLocaleTimeString())
                : copy.sync.notSynced(status.message)}
        </p>
        {group ? <p className="muted">{copy.onboard.yourCode}: {group.code}</p> : null}
        <Button variant="quiet" testId="sync-now" onClick={() => void syncNow()}>
          {copy.sync.retry}
        </Button>
      </Card>

      <Card testId="minimum-card">
        <h2>{copy.settings.lowerMinimum}</h2>
        <p className="muted">{copy.settings.lowerHelp}</p>
        <p>{copy.settings.currentMinimum(d.myDoc.declaration.minimumMinutes)}</p>
        <label>
          {copy.log.minutesPrompt}
          <input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            data-testid="input-new-minimum"
          />
        </label>
        <Button
          testId="save-minimum"
          disabled={!minutes}
          onClick={() => {
            void lowerMinimum(Number(minutes)).then(() => setMinutes(''));
          }}
        >
          {copy.settings.lowerMinimum}
        </Button>
      </Card>

      <Card testId="cover-card">
        <h2>{copy.settings.coverDay}</h2>
        {token.spentOnDay !== null ? (
          <p data-testid="cover-spent">{copy.settings.coverSpent(token.spentOnDay)}</p>
        ) : (
          <>
            <p>{copy.settings.coverAvailable}</p>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {missedDays.map((day) => (
                <Button
                  key={day}
                  variant="quiet"
                  testId={`cover-${day}`}
                  onClick={() => void spendToken(day)}
                >
                  {copy.settings.coverThisDay(day)}
                </Button>
              ))}
            </div>
            {missedDays.length === 0 ? (
              <p className="muted">{copy.settings.nothingToCover}</p>
            ) : null}
          </>
        )}
      </Card>

      <Card testId="reminder-card">
        <h2>{copy.settings.reminderOn}</h2>
        <p className="muted">{copy.notifications.cue(d.myDoc.declaration.cue)}</p>
        <label>
          {copy.setup.reminderPrompt}
          <input
            type="time"
            value={d.myDoc.declaration.reminderTime ?? ''}
            onChange={(e) => void setReminder(e.target.value || null)}
            data-testid="input-reminder-time"
          />
        </label>
        <Button variant="plain" testId="reminder-off" onClick={() => void setReminder(null)}>
          {copy.settings.reminderOff}
        </Button>
      </Card>

      <Button variant="quiet" onClick={onBack} testId="back">
        {copy.nav.back}
      </Button>
      <Button variant="plain" testId="reset" onClick={() => void reset()}>
        {copy.settings.resetAll}
      </Button>
    </Screen>
  );
}
