import { motion } from 'framer-motion';
import { useState } from 'react';
import { copy } from '../domain/copy';
import { scoreBreakdown, scoreDay } from '../domain/scoring';
import type { DayLog } from '../domain/types';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Buddy } from '../ui/Buddy';
import { Button, Card, Screen, Toggle } from '../ui/components';
import { celebrateBurst } from '../ui/confetti';
import { celebrateTap } from '../ui/haptics';
import { badgePop, celebrateVariants } from '../ui/motion';
import { playCelebrate, playTick } from '../ui/sound';

/**
 * The log screen.
 *
 * Four deliberate choices:
 *  - Minutes are optional and labelled unscored. Leaving it blank costs nothing.
 *  - The reflection is free text. A mood dropdown would be faster to build and
 *    would destroy the Day 3 callback, the Day 8 report, and the reason
 *    reflections are scored at all.
 *  - The cue question is self-declared and never contested.
 *  - "Not today" is a plain button with no consequence copy attached to it.
 *
 * Design Revision 2026-08-27 (see docs/PRODUCT-SPEC.md): a successful submit
 * now fires a confetti burst and a haptic tap — an explicitly-approved reversal
 * of the original "no celebration on a daily log" rule.
 */
export function Log({
  onDone,
  onCancel,
  now = new Date(),
}: {
  onDone: () => void;
  onCancel: () => void;
  now?: Date;
}) {
  const d = useDerived(now);
  const saveLog = useRun((s) => s.saveLog);

  const existing = d?.myDoc.logs.find((l) => l.day === d.day);
  const [practised, setPractised] = useState(existing?.practised ?? true);
  const [atCue, setAtCue] = useState(existing?.atCue ?? false);
  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [minutes, setMinutes] = useState(existing?.minutes?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  if (!d) return null;

  const draft: DayLog = {
    personId: d.me,
    day: d.day,
    practised,
    atCue,
    reflection: reflection.trim() ? reflection : null,
    proofPostIds: existing?.proofPostIds ?? [],
    supportedPersonIds: existing?.supportedPersonIds ?? [],
    minutes: minutes ? Number(minutes) : null,
    loggedLate: false,
  };

  const points = scoreDay(draft, d.hasCatchup);

  return (
    <Screen testId="log" accent="var(--p2)">
      <div className="row" style={{ justifyContent: 'center' }}>
        <Buddy state={saving ? 'celebrate' : 'idle'} size={72} testId="buddy" />
      </div>
      <h1>{copy.log.practisedQuestion}</h1>

      {d.hasCatchup ? <p data-testid="catchup-note">{copy.log.catchupActive}</p> : null}

      <Card>
        <Toggle
          label={copy.log.practisedQuestion}
          checked={practised}
          onChange={(v) => {
            setPractised(v);
            playTick();
          }}
          testId="toggle-practised"
        />
        <Toggle
          label={copy.log.cueQuestion}
          checked={atCue}
          onChange={(v) => {
            setAtCue(v);
            playTick();
          }}
          testId="toggle-cue"
        />
      </Card>

      <Card>
        <label>
          {copy.log.reflectionPrompt}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            data-testid="input-reflection"
          />
        </label>
        <label>
          {copy.log.minutesPrompt}
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            data-testid="input-minutes"
          />
        </label>
      </Card>

      <Card testId="breakdown">
        {scoreBreakdown(draft, d.hasCatchup).map((row) => (
          <motion.div
            className="row"
            key={row.action}
            style={{ justifyContent: 'space-between' }}
            variants={badgePop}
            initial="initial"
            animate="enter"
          >
            <span>{copy.actions[row.action]}</span>
            <span>{row.points}</span>
          </motion.div>
        ))}
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
          <span>{copy.log.todayTotal}</span>
          <span data-testid="points-today">{points}</span>
        </div>
      </Card>

      {saving ? (
        <motion.p
          className="muted"
          data-testid="celebrate"
          variants={celebrateVariants}
          initial="initial"
          animate="enter"
        >
          {copy.log.logged(d.day)}
        </motion.p>
      ) : null}

      <Button
        testId="save-log"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          celebrateBurst();
          celebrateTap();
          playCelebrate();
          void saveLog(d.day, draft).then(onDone);
        }}
      >
        {copy.log.logged(d.day)}
      </Button>
      <Button variant="plain" onClick={onCancel} testId="not-today">
        {copy.log.notToday}
      </Button>
    </Screen>
  );
}
