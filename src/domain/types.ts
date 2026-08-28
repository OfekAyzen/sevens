/**
 * Domain types for Sevens.
 *
 * Design invariants enforced by this module (see docs/PRODUCT-SPEC.md):
 *  - `daysPractised`, `bestRun` and `totalPoints` are MONOTONIC — the honest
 *    record of what happened, and never rendered taking anything back.
 *  - Minutes are recorded and never scored (the daily ceiling never changes),
 *    though they are now aggregated and shown on the leaderboard.
 *
 * Design Revision — 2026-08-27: `currentStreak`, the ranked leaderboard and the
 * public catch-up badge were added as an explicitly-approved product decision
 * to make Sevens a real competitive game. This reverses the original ADR-001
 * (no losable streak) and the original "no sort by performance" rule. See the
 * "Design Revision" note near the top of docs/PRODUCT-SPEC.md for the full
 * rationale — it was a deliberate pivot, not drift.
 */

/** Stable identity for one of the (exactly four) participants. */
export type PersonId = string;

/** App-day index. Day 0 is setup; days 1..7 are the run. */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * A day inside the run proper. Distinct from DayIndex so that anything keyed by
 * day — the copy table, the day strip — cannot be indexed with the setup day.
 */
export type RunDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const RUN_LENGTH_DAYS = 7;
export const GROUP_SIZE = 4;
export const GROUP_MAX = RUN_LENGTH_DAYS * GROUP_SIZE; // 28
export const GROUP_TARGET = 24;

/** The five scoreable actions. Values are points BEFORE any catch-up bonus. */
export const ACTION_POINTS = {
  /** Practised at or above your own declared minimum. Binary, self-declared. */
  practised: 10,
  /** Practised at your declared if-then cue and place. Self-declared, never contested. */
  cue: 3,
  /** Logged a free-text reflection (>= MIN_REFLECTION_CHARS). */
  reflection: 4,
  /** Posted a proof-of-work scrap to the group. */
  proof: 3,
  /** Reacted or replied to another person's post. Max SUPPORT_MAX_PER_DAY awards. */
  support: 2,
} as const;

export type ActionKind = keyof typeof ACTION_POINTS;

export const SUPPORT_MAX_PER_DAY = 2;
export const MIN_REFLECTION_CHARS = 15;

/** Catch-up adds a flat +2 to the two actions that need no extra practice time. */
export const CATCHUP_BONUS = 2;
export const CATCHUP_ACTIONS: readonly ActionKind[] = ['reflection', 'proof'];

/** 10 + 3 + 4 + 3 + (2*2) === 24, identical for all four people. */
export const DAILY_CEILING = 24;
/** With catch-up held: 24 + 2 + 2 === 28. */
export const DAILY_CEILING_WITH_CATCHUP = 28;

/** The app-day rolls over at 04:00 in each person's OWN local time. */
export const DAY_ROLLOVER_HOUR = 4;

/** One person's declaration, made at Day 0 and thereafter only loosenable. */
export interface Declaration {
  personId: PersonId;
  /** Free text, e.g. "fingerstyle guitar". */
  skill: string;
  /** Their own floor, in minutes. May be lowered any time, never raised after Day 1. */
  minimumMinutes: number;
  /** The if-then sentence. Must name a cue and a place. */
  cue: string;
  /** "How will you know if you're improving?" — their own feedback source. */
  feedbackSource: string;
  /** IANA zone, so each person's 04:00 is their own. */
  timeZone: string;
  /** Self-set reminder time as "HH:MM" local, or null if opted out. */
  reminderTime: string | null;
}

/** What one person did on one app-day. Absence of a record IS the missed day. */
export interface DayLog {
  personId: PersonId;
  day: DayIndex;
  practised: boolean;
  atCue: boolean;
  /** Raw reflection text. Scored only on length; never parsed into a category. */
  reflection: string | null;
  /** Ids of proof-of-work posts made this day. */
  proofPostIds: string[];
  /** Distinct people supported today. One award per distinct target, capped. */
  supportedPersonIds: PersonId[];
  /** Recorded for the Day 8 personal report ONLY. Never scored, never shared. */
  minutes: number | null;
  /** True when logged during the following app-day. Private to the logger. */
  loggedLate: boolean;
  /** How many separate sessions were logged this day. Tracking only — never
   * read by scoreDay/scoreBreakdown, so it cannot change the daily ceiling. */
  sessions: number;
}

/** The single "life happens" token. Exactly one per person per run. */
export interface CoverToken {
  personId: PersonId;
  /** The app-day it covers, or null while unspent. */
  spentOnDay: DayIndex | null;
}

export interface RunState {
  /** ISO date of app-day 1. */
  startDate: string;
  declarations: Declaration[];
  logs: DayLog[];
  tokens: CoverToken[];
}

/** Per-person figures any screen may render. */
export interface PersonCounters {
  personId: PersonId;
  /** Days A was logged. Literally true; token days are NOT counted here. */
  daysPractised: number;
  /** Longest run achieved this week. Token days bridge it. Only ever increases. */
  bestRun: number;
  /** Cumulative process points across the whole run. */
  totalPoints: number;
  /** Points inside the currently displayed contest window. */
  windowPoints: number;
  /** Consecutive covered days ending today. Can fall to 0 — see ./streak.ts. */
  currentStreak: number;
  /** Minutes logged across the whole run. */
  totalMinutes: number;
}

export type GroupBand =
  | { kind: 'perfect'; label: string }
  | { kind: 'target'; label: string }
  | { kind: 'strong'; label: string }
  | { kind: 'half'; label: string }
  | { kind: 'none'; label: null };

/* ------------------------------------------------------------------------- *
 * Multi-person model.
 *
 * Sync rule: each person writes ONLY their own MemberDoc. Nobody ever edits
 * anyone else's document, so there are no write conflicts to resolve and no
 * merge logic to get wrong — the shared view is just the union of four
 * independently-owned documents.
 * ------------------------------------------------------------------------- */

export interface Post {
  id: string;
  personId: PersonId;
  day: RunDay;
  caption: string;
  /** Small JPEG data URL, downscaled on capture. Optional. */
  image?: string;
  createdAt: string;
}

/** One reaction to someone else's post. Stored by the REACTOR, not the target. */
export interface Reaction {
  postId: string;
  targetPersonId: PersonId;
  day: RunDay;
  emoji: string;
}

/**
 * One comment on a post. Stored by the AUTHOR, same pattern as `Reaction`.
 * Purely social — never scored, never required, never gates anything. See
 * `Feed.tsx`'s doc comment: the rule against REQUIRING a comment for support
 * points doesn't ban optional commentary, which is what this is.
 */
export interface Comment {
  id: string;
  postId: string;
  personId: PersonId;
  day: RunDay;
  text: string;
  createdAt: string;
}

/** Everything one person owns. The unit of sync. */
export interface MemberDoc {
  personId: PersonId;
  displayName: string;
  declaration: Declaration;
  logs: DayLog[];
  token: CoverToken;
  posts: Post[];
  reactions: Reaction[];
  comments: Comment[];
  /** ISO timestamp, for last-write-wins on this person's own row only. */
  updatedAt: string;
}

export interface Group {
  /** Short human-shareable join code. */
  code: string;
  /** ISO date of app-day 1, fixed by whoever created the group. */
  startDate: string;
}
