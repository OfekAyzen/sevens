import type { MemberDoc, Post, RunDay } from './types';
import { RUN_LENGTH_DAYS } from './types';

export interface PersonalReport {
  daysPractised: number;
  bestRun: number;
  /** Median of the sessions where minutes were actually entered, or null. */
  medianMinutes: number | null;
  reflections: { day: RunDay; text: string }[];
  firstArtefact: Post | null;
  lastArtefact: Post | null;
  unusedToken: boolean;
}

/**
 * The Day 8 personal report.
 *
 * This is the deliverable Day 0 promised, and it is why the app can honestly
 * call the week a success for the person who practised three times: they still
 * get seven days of evidence about how they actually practise.
 *
 * Note that minutes finally appear here — and ONLY here, for this person, about
 * themselves. There is no equivalent function that aggregates minutes across
 * people, and there must never be one.
 */
export function personalReport(doc: MemberDoc, throughDay: RunDay): PersonalReport {
  const logs = doc.logs
    .filter((l) => l.day <= throughDay)
    .sort((a, b) => a.day - b.day);

  const practisedLogs = logs.filter((l) => l.practised);

  const covered = new Set<number>(practisedLogs.map((l) => l.day));
  if (doc.token.spentOnDay !== null) covered.add(doc.token.spentOnDay);

  let bestRun = 0;
  let run = 0;
  for (let day = 1; day <= RUN_LENGTH_DAYS; day++) {
    if (covered.has(day)) {
      run += 1;
      if (run > bestRun) bestRun = run;
    } else {
      run = 0;
    }
  }

  const minutes = practisedLogs
    .map((l) => l.minutes)
    .filter((m): m is number => typeof m === 'number' && m > 0)
    .sort((a, b) => a - b);

  const posts = [...doc.posts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    daysPractised: practisedLogs.length,
    bestRun,
    medianMinutes: median(minutes),
    reflections: logs
      .filter((l) => l.reflection && l.reflection.trim().length > 0)
      .map((l) => ({ day: l.day as RunDay, text: l.reflection as string })),
    firstArtefact: posts.at(0) ?? null,
    // With a single post, the "after" side deliberately stays empty rather than
    // showing the same artefact twice as if it were a before and an after.
    lastArtefact: posts.length > 1 ? (posts.at(-1) ?? null) : null,
    unusedToken: doc.token.spentOnDay === null,
  };
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const a = sorted[mid - 1];
  const b = sorted[mid];
  return a !== undefined && b !== undefined ? Math.round((a + b) / 2) : null;
}
