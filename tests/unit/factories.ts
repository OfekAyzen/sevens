import type { Declaration, DayIndex, DayLog, PersonId, RunState } from '../../src/domain/types';

export function makeLog(over: Partial<DayLog> & { personId: PersonId; day: DayIndex }): DayLog {
  return {
    practised: false,
    atCue: false,
    reflection: null,
    proofPostIds: [],
    supportedPersonIds: [],
    minutes: null,
    loggedLate: false,
    ...over,
  };
}

/** A full-score day: 10 + 3 + 4 + 3 + 4 = 24. */
export function perfectLog(personId: PersonId, day: DayIndex, others: PersonId[]): DayLog {
  return makeLog({
    personId,
    day,
    practised: true,
    atCue: true,
    reflection: 'the F chord is still slow but cleaner today',
    proofPostIds: [`${personId}-${day}-clip`],
    supportedPersonIds: others.slice(0, 2),
    minutes: 18,
  });
}

export function makeDeclaration(personId: PersonId, over: Partial<Declaration> = {}): Declaration {
  return {
    personId,
    skill: 'fingerstyle guitar',
    minimumMinutes: 10,
    cue: 'after I put my coffee down, at the kitchen table',
    feedbackSource: 'record myself and listen back',
    timeZone: 'Asia/Jerusalem',
    reminderTime: '08:00',
    ...over,
  };
}

export const FOUR: PersonId[] = ['ofek', 'dana', 'sam', 'priya'];

export function makeRun(over: Partial<RunState> = {}): RunState {
  return {
    startDate: '2026-08-26',
    declarations: FOUR.map((id) => makeDeclaration(id)),
    logs: [],
    tokens: FOUR.map((id) => ({ personId: id, spentOnDay: null })),
    ...over,
  };
}
