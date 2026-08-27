import { useState } from 'react';
import { appDayDate } from '../domain/appDay';
import { copy } from '../domain/copy';
import type { Declaration } from '../domain/types';
import { useRun } from '../store/run';
import { Buddy } from '../ui/Buddy';
import { Button, Card, Screen } from '../ui/components';

/**
 * Day 0. The pact.
 *
 * Two paths in: one person creates the group and shares the code, the other three
 * join it. Joining adopts the creator's start date so all four share day
 * numbering even if someone installs a day late.
 *
 * The pressure on the minimum runs DOWNWARD on purpose. "What could you still do
 * on your worst day" produces a floor someone can actually clear on the bad
 * Wednesday, and a floor that gets cleared is worth more than an ambitious one
 * that gets abandoned on Day 3.
 */

function randomCode(): string {
  // Ambiguous glyphs removed: this gets read aloud and retyped from a group chat.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet.charAt(b % alphabet.length);
  return out;
}

type Mode = 'intro' | 'choose' | 'create' | 'join';

export function Onboard({ onDone }: { onDone: () => void }) {
  const createGroup = useRun((s) => s.createGroup);
  const joinGroup = useRun((s) => s.joinGroup);

  const [mode, setMode] = useState<Mode>('intro');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');

  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [minimum, setMinimum] = useState(10);
  const [cue, setCue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reminder, setReminder] = useState('20:00');

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = appDayDate(new Date(), zone);

  const missing: string[] = [];
  if (name.trim().length === 0) missing.push(copy.setup.missingLabels.name);
  if (skill.trim().length <= 1) missing.push(copy.setup.missingLabels.skill);
  if (cue.trim().length <= 5) missing.push(copy.setup.missingLabels.cue);
  if (feedback.trim().length <= 3) missing.push(copy.setup.missingLabels.feedback);
  if (mode === 'join' && code.trim().length < 4) missing.push(copy.setup.missingLabels.code);

  const ready = missing.length === 0;

  async function submit() {
    const personId = `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const declaration: Declaration = {
      personId,
      skill: skill.trim(),
      minimumMinutes: minimum,
      cue: cue.trim(),
      feedbackSource: feedback.trim(),
      timeZone: zone,
      reminderTime: reminder,
    };

    if (mode === 'create') {
      await createGroup(code || randomCode(), today, name.trim(), declaration);
    } else {
      await joinGroup(code.trim().toUpperCase(), startDate || today, name.trim(), declaration);
    }
    onDone();
  }

  if (mode === 'intro') {
    return (
      <Screen testId="onboard-intro">
        <div className="row" style={{ justifyContent: 'center' }}>
          <Buddy state="happy" size={110} testId="buddy" />
        </div>
        <h1 style={{ textAlign: 'center' }}>{copy.appName}</h1>
        <p style={{ textAlign: 'center' }}>{copy.tagline}</p>
        <Card testId="intro-steps">
          <h2>{copy.onboard.introHeading}</h2>
          {copy.onboard.introSteps.map((step, i) => (
            <p key={i}>{step}</p>
          ))}
        </Card>
        <Button testId="intro-continue" onClick={() => setMode('choose')}>
          {copy.onboard.introContinue}
        </Button>
      </Screen>
    );
  }

  if (mode === 'choose') {
    return (
      <Screen testId="onboard-choose">
        <h1>{copy.appName}</h1>
        <p>{copy.tagline}</p>
        <Button
          testId="mode-create"
          onClick={() => {
            setCode(randomCode());
            setMode('create');
          }}
        >
          {copy.onboard.create}
        </Button>
        <Button variant="quiet" testId="mode-join" onClick={() => setMode('join')}>
          {copy.onboard.join}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen testId="onboard">
      <h1>{copy.appName}</h1>

      <Card testId="group-card">
        {mode === 'create' ? (
          <>
            <label>
              {copy.onboard.yourCode}
              <input type="text" value={code} readOnly data-testid="group-code" />
            </label>
            <span className="muted">{copy.onboard.shareCode}</span>
          </>
        ) : (
          <>
            <label>
              {copy.onboard.enterCode}
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                data-testid="input-code"
              />
            </label>
            <label>
              {copy.onboard.startDate}
              <input
                type="date"
                value={startDate || today}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start"
              />
            </label>
            <span className="muted">{copy.onboard.startDateHelp}</span>
          </>
        )}
      </Card>

      <Card testId="setup-form">
        <label>
          {copy.onboard.namePrompt}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-name"
          />
        </label>

        <label>
          {copy.setup.skillPrompt}
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            data-testid="input-skill"
          />
        </label>

        <label>
          {copy.setup.minimumPrompt}
          <input
            type="number"
            min={1}
            value={minimum}
            onChange={(e) => setMinimum(Number(e.target.value))}
            data-testid="input-minimum"
          />
          <span className="muted">{copy.setup.minimumHelp}</span>
        </label>

        <label>
          {copy.setup.cuePrompt}
          <input
            type="text"
            value={cue}
            onChange={(e) => setCue(e.target.value)}
            data-testid="input-cue"
          />
          <span className="muted">{copy.setup.cueHelp}</span>
        </label>

        <label>
          {copy.setup.feedbackPrompt}
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            data-testid="input-feedback"
          />
          <span className="muted">{copy.setup.feedbackHelp}</span>
        </label>

        <label>
          {copy.setup.reminderPrompt}
          <input
            type="time"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            data-testid="input-reminder"
          />
        </label>
      </Card>

      <Card testId="rules">
        <h2>{copy.rules.heading}</h2>
        {[
          ['🎯', copy.rules.groupGoal],
          ['🏅', copy.rules.bands],
          ['⚖️', copy.rules.ceiling],
          ['🔄', copy.rules.midpoint],
          ['🤝', copy.rules.catchup],
          ['🎫', copy.rules.coverDay],
          ['🔔', copy.rules.notifications],
          ['🫶', copy.setup.honourSystem],
        ].map(([icon, text]) => (
          <div className="rule-row" key={text}>
            <span className="rule-row__icon" aria-hidden="true">{icon}</span>
            <p>{text}</p>
          </div>
        ))}
        <p className="muted">{copy.setup.spacingRationale}</p>
      </Card>

      {missing.length > 0 ? (
        <p className="muted" data-testid="missing-fields">
          {copy.setup.missing(missing)}
        </p>
      ) : null}

      <Button
        testId="begin"
        disabled={!ready}
        onClick={() => {
          void submit();
        }}
      >
        {copy.setup.pactHeading}
      </Button>
      <Button variant="plain" testId="onboard-back" onClick={() => setMode('choose')}>
        {copy.onboard.back}
      </Button>
    </Screen>
  );
}
