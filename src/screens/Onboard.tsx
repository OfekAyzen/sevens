import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { appDayDate } from '../domain/appDay';
import { copy } from '../domain/copy';
import type { Declaration } from '../domain/types';
import { useRun } from '../store/run';
import { BuddySpeech } from '../ui/BuddySpeech';
import { Button, Screen } from '../ui/components';
import { spring } from '../ui/motion';

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
 *
 * Design Revision, round 6: the whole pact is now a conversation with Buddy —
 * one question in his speech bubble at a time, Next/Back between them — rather
 * than three long form cards. "How the week works" moved out of this flow
 * entirely: Buddy explains it once on Home after signup, and on tap after
 * that (see Home.tsx). The short teaser bubbles below still cover the gist
 * before anyone commits to a group.
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

const FORM_STEPS = [
  'code',
  'start',
  'name',
  'skill',
  'minimum',
  'cue',
  'feedback',
  'reminder',
  'begin',
] as const;

export function Onboard({ onDone }: { onDone: () => void }) {
  const createGroup = useRun((s) => s.createGroup);
  const joinGroup = useRun((s) => s.joinGroup);

  const [mode, setMode] = useState<Mode>('intro');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const introBubbles = [copy.onboard.introGreeting, ...copy.onboard.introSteps];
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [formStep, setFormStep] = useState(0);

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
      await createGroup(code || randomCode(), startDate || today, name.trim(), declaration);
    } else {
      await joinGroup(code.trim().toUpperCase(), startDate || today, name.trim(), declaration);
    }
    onDone();
  }

  if (mode === 'intro') {
    const lastBubble = bubbleIndex === introBubbles.length - 1;
    const advanceBubble = () => setBubbleIndex((i) => (i + 1) % introBubbles.length);

    return (
      <Screen testId="onboard-intro">
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={spring}
        >
          <h1 style={{ textAlign: 'center' }}>{copy.appName}</h1>
          <p style={{ textAlign: 'center' }}>{copy.tagline}</p>

          <BuddySpeech tappable onTap={advanceBubble} testId="intro-bubble">
            <AnimatePresence mode="wait">
              <motion.p
                key={bubbleIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {introBubbles[bubbleIndex]}
              </motion.p>
            </AnimatePresence>
          </BuddySpeech>
        </motion.div>

        <div className="bubble-dots" role="tablist" aria-label={copy.onboard.introHeading}>
          {introBubbles.map((_, i) => (
            <button
              key={i}
              className={`bubble-dot ${i === bubbleIndex ? 'is-active' : ''}`}
              onClick={() => setBubbleIndex(i)}
              aria-label={`${i + 1}`}
              data-testid={`intro-dot-${i}`}
            />
          ))}
        </div>

        <Button
          testId="intro-continue"
          onClick={() => (lastBubble ? setMode('choose') : advanceBubble())}
        >
          {lastBubble ? copy.onboard.introContinue : copy.onboard.introNext}
        </Button>
      </Screen>
    );
  }

  if (mode === 'choose') {
    return (
      <Screen testId="onboard-choose">
        <BuddySpeech testId="choose-bubble">
          <p>{copy.onboard.choosePrompt}</p>
        </BuddySpeech>
        <Button
          testId="mode-create"
          onClick={() => {
            setCode(randomCode());
            setFormStep(0);
            setMode('create');
          }}
        >
          {copy.onboard.create}
        </Button>
        <Button
          variant="quiet"
          testId="mode-join"
          onClick={() => {
            setFormStep(0);
            setMode('join');
          }}
        >
          {copy.onboard.join}
        </Button>
      </Screen>
    );
  }

  // mode is 'create' or 'join' — the stepped wizard, one question at a time
  // from Buddy, sharing the same FORM_STEPS sequence for both paths.
  const step = FORM_STEPS[formStep];

  function nextForm() {
    setFormStep((i) => Math.min(i + 1, FORM_STEPS.length - 1));
  }
  function backForm() {
    if (formStep === 0) {
      setMode('choose');
      return;
    }
    setFormStep((i) => i - 1);
  }

  let bubble: ReactNode;
  let field: ReactNode;

  switch (step) {
    case 'code':
      if (mode === 'create') {
        bubble = <p>{copy.onboard.shareCode}</p>;
        field = (
          <label>
            {copy.onboard.yourCode}
            <input type="text" value={code} readOnly data-testid="group-code" />
          </label>
        );
      } else {
        bubble = <p>{copy.onboard.enterCode}</p>;
        field = (
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-label={copy.onboard.enterCode}
            data-testid="input-code"
          />
        );
      }
      break;
    case 'start':
      bubble = <p>{mode === 'create' ? copy.onboard.createStartDateHelp : copy.onboard.startDateHelp}</p>;
      field = (
        <label>
          {copy.onboard.startDate}
          <input
            type="date"
            value={startDate || today}
            onChange={(e) => setStartDate(e.target.value)}
            data-testid={mode === 'create' ? 'input-start-create' : 'input-start'}
          />
        </label>
      );
      break;
    case 'name':
      bubble = <p>{copy.onboard.namePrompt}</p>;
      field = (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={copy.onboard.namePrompt}
          data-testid="input-name"
        />
      );
      break;
    case 'skill':
      bubble = <p>{copy.setup.skillPrompt}</p>;
      field = (
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          aria-label={copy.setup.skillPrompt}
          data-testid="input-skill"
        />
      );
      break;
    case 'minimum':
      bubble = <p>{copy.setup.minimumPrompt}</p>;
      field = (
        <>
          <input
            type="number"
            min={1}
            value={minimum}
            onChange={(e) => setMinimum(Number(e.target.value))}
            aria-label={copy.setup.minimumPrompt}
            data-testid="input-minimum"
          />
          <span className="muted">{copy.setup.minimumHelp}</span>
        </>
      );
      break;
    case 'cue':
      bubble = <p>{copy.setup.cuePrompt}</p>;
      field = (
        <>
          <input
            type="text"
            value={cue}
            onChange={(e) => setCue(e.target.value)}
            aria-label={copy.setup.cuePrompt}
            data-testid="input-cue"
          />
          <span className="muted">{copy.setup.cueHelp}</span>
        </>
      );
      break;
    case 'feedback':
      bubble = <p>{copy.setup.feedbackPrompt}</p>;
      field = (
        <>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            aria-label={copy.setup.feedbackPrompt}
            data-testid="input-feedback"
          />
          <span className="muted">{copy.setup.feedbackHelp}</span>
        </>
      );
      break;
    case 'reminder':
      bubble = <p>{copy.setup.reminderPrompt}</p>;
      field = (
        <input
          type="time"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          aria-label={copy.setup.reminderPrompt}
          data-testid="input-reminder"
        />
      );
      break;
    case 'begin':
      bubble = <p>{copy.setup.pactBody}</p>;
      field = null;
      break;
  }

  return (
    <Screen testId="onboard">
      <BuddySpeech testId={`step-${step}`}>{bubble}</BuddySpeech>

      {field ? <div className="wizard-field">{field}</div> : null}

      {step === 'begin' ? (
        <>
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
        </>
      ) : (
        <Button testId="wizard-next" onClick={nextForm}>
          {copy.onboard.introNext}
        </Button>
      )}

      <Button variant="plain" testId="onboard-back" onClick={backForm}>
        {copy.onboard.back}
      </Button>
    </Screen>
  );
}
