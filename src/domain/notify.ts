import { copy, joinNames } from './copy';
import type { MemberDoc, RunDay } from './types';

/**
 * Notification planning — pure, so the rules can be tested without a device.
 *
 * The rules, from docs/PRODUCT-SPEC.md §5:
 *
 *  - **Hard cap of two per person per day.** Day 4 may carry a third, once per
 *    run, for someone with two or more missed days.
 *  - **Slot 1** is their own if-then sentence, verbatim, prefixed "You said:".
 *    Suppressed entirely once today is already logged — reminding someone to do
 *    what they have done teaches them the app is not paying attention.
 *  - **Slot 2** is a batched peer digest at 20:00 naming who practised. It never
 *    names who did not, never ranks, never mentions minutes or cover days.
 *    Suppressed when nobody practised: silence beats "Nobody practised today."
 *  - Nothing originates between 21:00 and 06:00 local, ever.
 */

export interface PlannedNotification {
  slot: 'cue' | 'digest' | 'checkin';
  at: Date;
  body: string;
}

export const DIGEST_HOUR = 20;
export const QUIET_FROM_HOUR = 21;
export const QUIET_UNTIL_HOUR = 6;

/** Nothing the app originates may land in the quiet window. */
export function withinQuietHours(at: Date): boolean {
  const hour = at.getHours();
  return hour >= QUIET_FROM_HOUR || hour < QUIET_UNTIL_HOUR;
}

function at(base: Date, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseTime(value: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function plannedNotifications(
  me: MemberDoc,
  members: MemberDoc[],
  today: RunDay,
  groupTotal: number,
  now: Date,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  const loggedToday = me.logs.some((l) => l.day === today && l.practised);

  // Slot 1 — their own sentence, handed back.
  const time = parseTime(me.declaration.reminderTime);
  if (time && !loggedToday) {
    const when = at(now, time.hour, time.minute);
    if (when > now) {
      planned.push({ slot: 'cue', at: when, body: copy.notifications.cue(me.declaration.cue) });
    }
  }

  // Slot 2 — the peer digest. Names only who practised.
  const practised = members
    .filter((m) => m.logs.some((l) => l.day === today && l.practised))
    .map((m) => m.displayName);

  if (practised.length > 0) {
    const when = at(now, DIGEST_HOUR, 0);
    if (when > now) {
      planned.push({
        slot: 'digest',
        at: when,
        body: copy.notifications.digest(joinNames(practised), groupTotal),
      });
    }
  }

  // Day 4 only, once, for someone two or more days down. Carries an off-ramp of
  // equal weight, and is never repeated or escalated.
  if (today === 4) {
    const covered = new Set(me.logs.filter((l) => l.practised).map((l) => l.day));
    if (me.token.spentOnDay !== null) covered.add(me.token.spentOnDay);
    const missed = [1, 2, 3].filter((day) => !covered.has(day as RunDay)).length;
    if (missed >= 2) {
      const when = at(now, 18, 0);
      if (when > now) {
        planned.push({ slot: 'checkin', at: when, body: copy.notifications.dayFourCheckIn });
      }
    }
  }

  return planned
    .filter((n) => !withinQuietHours(n.at))
    .slice(0, today === 4 ? 3 : 2);
}
