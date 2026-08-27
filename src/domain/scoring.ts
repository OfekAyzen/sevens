import {
  ACTION_POINTS,
  CATCHUP_ACTIONS,
  CATCHUP_BONUS,
  MIN_REFLECTION_CHARS,
  SUPPORT_MAX_PER_DAY,
  type ActionKind,
  type DayLog,
} from './types';

/** Points for one action, with the flat catch-up bonus applied where eligible. */
export function actionValue(action: ActionKind, hasCatchup: boolean): number {
  const base = ACTION_POINTS[action];
  return hasCatchup && CATCHUP_ACTIONS.includes(action) ? base + CATCHUP_BONUS : base;
}

/** A reflection scores only on being genuinely written. Never parsed or graded. */
export function isScorableReflection(text: string | null): boolean {
  return text !== null && text.trim().length >= MIN_REFLECTION_CHARS;
}

/**
 * How many support awards a day's log earns: one per DISTINCT person supported,
 * capped. Self-support is excluded by the caller filtering it out of the list.
 */
export function supportAwards(log: DayLog): number {
  const distinct = new Set(log.supportedPersonIds.filter((id) => id !== log.personId));
  return Math.min(distinct.size, SUPPORT_MAX_PER_DAY);
}

/**
 * Score one person-day.
 *
 * Gating: `cue`, `reflection` and `proof` all require `practised`. You cannot
 * claim you hit your cue on a day you did not practise. `support` does NOT
 * require it — supporting friends on a day off is what keeps a lapsed person
 * attached to the group, and that is deliberate.
 */
export function scoreDay(log: DayLog, hasCatchup = false): number {
  let points = 0;

  if (log.practised) {
    points += actionValue('practised', hasCatchup);
    if (log.atCue) points += actionValue('cue', hasCatchup);
    if (isScorableReflection(log.reflection)) points += actionValue('reflection', hasCatchup);
    if (log.proofPostIds.length > 0) points += actionValue('proof', hasCatchup);
  }

  points += supportAwards(log) * actionValue('support', hasCatchup);
  return points;
}

/** Per-action breakdown for the log screen. Never shown to other people. */
export function scoreBreakdown(
  log: DayLog,
  hasCatchup = false,
): { action: ActionKind; points: number }[] {
  const rows: { action: ActionKind; points: number }[] = [];
  if (log.practised) {
    rows.push({ action: 'practised', points: actionValue('practised', hasCatchup) });
    if (log.atCue) rows.push({ action: 'cue', points: actionValue('cue', hasCatchup) });
    if (isScorableReflection(log.reflection))
      rows.push({ action: 'reflection', points: actionValue('reflection', hasCatchup) });
    if (log.proofPostIds.length > 0)
      rows.push({ action: 'proof', points: actionValue('proof', hasCatchup) });
  }
  const awards = supportAwards(log);
  if (awards > 0)
    rows.push({ action: 'support', points: awards * actionValue('support', hasCatchup) });
  return rows;
}
