import { DAY_ROLLOVER_HOUR, RUN_LENGTH_DAYS, type DayIndex, type RunDay } from './types';

/**
 * The app-day boundary.
 *
 * App-day D spans 04:00:00 local on D through 03:59:59 local on D+1. This is the
 * DEFINITION of a day, not a grace period stacked on top of one — a session at
 * 01:30 Tuesday belongs to Monday because Monday has not ended yet.
 *
 * Each person's boundary uses their OWN time zone, so a friend abroad does not
 * have their Tuesday scored as someone else's Monday.
 */

/** Calendar date (YYYY-MM-DD) of the app-day containing `instant` in `timeZone`. */
export function appDayDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(instant);

  const get = (t: string): string => {
    const part = parts.find((p) => p.type === t);
    if (!part) throw new RangeError(`Missing ${t} for time zone ${timeZone}`);
    return part.value;
  };
  // Intl can render midnight as hour "24" in some engines; normalise it.
  const hour = Number(get('hour')) % 24;
  const date = `${get('year')}-${get('month')}-${get('day')}`;

  // Before the rollover we are still inside the PREVIOUS calendar day's app-day.
  return hour < DAY_ROLLOVER_HOUR ? addDays(date, -1) : date;
}

/**
 * Parse YYYY-MM-DD to a UTC epoch. Throws on malformed input rather than
 * silently producing NaN, which would otherwise surface much later as a day
 * index of NaN and an app that renders nothing.
 */
function parseIsoDate(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new RangeError(`Not a YYYY-MM-DD date: ${isoDate}`);
  const [, y, m, d] = match as unknown as [string, string, string, string];
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

/** Shift a YYYY-MM-DD string by whole days, without touching local time. */
export function addDays(isoDate: string, delta: number): string {
  return new Date(parseIsoDate(isoDate) + delta * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days between two YYYY-MM-DD strings. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / 86_400_000);
}

/**
 * Which app-day of the run `instant` falls in, or null if outside it.
 * Day 1 is `startDate`; the run ends after day 7.
 */
export function currentDay(
  instant: Date,
  timeZone: string,
  startDate: string,
): RunDay | null {
  const offset = daysBetween(startDate, appDayDate(instant, timeZone));
  if (offset < 0 || offset >= RUN_LENGTH_DAYS) return null;
  return (offset + 1) as RunDay;
}

/**
 * Retroactive logging window: during app-day D you may still log for D-1.
 * Nothing further back is reachable, and there is no point penalty either way.
 */
export function canLogFor(target: DayIndex, today: DayIndex): boolean {
  if (target < 1 || target > RUN_LENGTH_DAYS) return false;
  return target === today || target === today - 1;
}

/**
 * `currentDay` returns null both before the run starts and after it ends —
 * two very different situations that must not be conflated. A group creator
 * can set a future start date, so "before" is a real, reachable state, not
 * just a theoretical one, and it is not equivalent to day 1: nobody may log
 * or post until the run has actually started (`started` is what the app
 * gates that on — see App.tsx).
 *
 * `day`/`finished` still resolve to something sane in the "before" case
 * (day 1, not finished) purely so every existing consumer that expects a
 * valid RunDay keeps working — they're never actually shown, since the app
 * takes over the whole screen while `!started`. After the run ends:
 * everything freezes at day 7/finished so the finale and the report keep
 * rendering rather than blanking out.
 */
export function resolvedDay(
  instant: Date,
  timeZone: string,
  startDate: string,
): { day: RunDay; finished: boolean; started: boolean } {
  const day = currentDay(instant, timeZone, startDate);
  if (day !== null) return { day, finished: false, started: true };

  const afterEnd = instant.getTime() > Date.parse(`${startDate}T00:00:00Z`);
  return { day: afterEnd ? 7 : 1, finished: afterEnd, started: afterEnd };
}
