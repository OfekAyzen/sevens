/**
 * Every user-facing string in the app.
 *
 * Centralised on purpose: the copy rules in docs/PRODUCT-SPEC.md are enforced by
 * tests/unit/invariants.test.ts, which scans this file (and all of src/) for
 * banned phrasing. Keeping strings here makes that guard meaningful instead of
 * something that can be bypassed by inlining a string in a component.
 *
 * The twelve rules, in short:
 *  1. Count up, never down.          7. Comparison is only ever additive.
 *  2. Use their words, not ours.     8. Never manufacture a setback.
 *  3. Name the process, not person.  9. One exclamation mark per week.
 *  4. Describe, don't grade.        10. Always show the exit.
 *  5. Make the next action small.   11. Never promise a habit.
 *  6. No guilt, urgency, scarcity.  12. Group shortfalls have no author.
 */

import type { RunDay } from './types';

export const copy = {
  appName: 'Sevens',

  // Rule 11: never promise a habit. Seven days cannot build one, and saying so
  // makes Day 8 a failure by construction.
  tagline: 'Seven days of evidence about how you learn, and one thing you can show.',

  nav: {
    back: 'Back',
    tabHome: 'Home',
    tabPosts: 'Posts',
    tabBoard: 'Board',
    tabSettings: 'User settings',
  },

  actions: {
    practised: 'Practised',
    cue: 'At your planned time and place',
    reflection: 'Reflection',
    proof: 'Posted proof',
    support: 'Supported a friend',
  },

  finale: {
    before: 'Day 1',
    after: 'Today',
    nothingPosted: 'Nothing posted.',
    reportHeading: 'Your week',
    daysLine: (days: number, best: number) =>
      `You practised on ${days} of 7 days. Your best run was ${best}.`,
    medianLine: (minutes: number) => `Your median session was ${minutes} minutes.`,
    feedbackLine: (source: string) => `You said you would know you were improving by: ${source}`,
    reflectionsHeading: 'What you wrote',
    noReflections: 'You did not write any reflections this week.',
  },

  onboard: {
    create: 'Start a group',
    join: 'Join a group',
    yourCode: 'Your group code',
    shareCode: 'Send this to the other three. They tap Join and enter it.',
    enterCode: 'Group code',
    startDate: 'Day 1 of the week',
    startDateHelp: 'Use the same Day 1 the person who started the group used.',
    createStartDateHelp: 'Everyone who joins will match this Day 1.',
    namePrompt: 'What should the group call you?',
    back: 'Back',
    // A short explainer shown once, before Start/Join. The full rules screen
    // still discloses everything in detail later, before anyone commits.
    introHeading: 'How this works',
    // Rule 9's weekly exclamation is already spent on Day 7 — this stays flat.
    introGreeting: "Hi. I'll walk you through how this works.",
    introSteps: [
      'Four people, seven days, four different skills.',
      'Log what you did each day. Reflecting and posting earn points too.',
      "Points put you on the leaderboard, and your streak counts the days in a row you've shown up.",
      'Whoever has the fewest points gets a catch-up bonus, so the board stays close all week.',
      'The group also has one shared number everyone is aiming for together.',
    ],
    introNext: 'Next',
    introContinue: "Let's go",
    choosePrompt: 'Want to start a new group, or join one a friend already started?',
  },

  sync: {
    heading: 'Group sync',
    offline: 'Solo mode. Nobody else can see this yet.',
    syncing: 'Syncing',
    ok: (members: number, at: string) => `${members} in the group. Last synced ${at}.`,
    notSynced: (message: string) => `Not synced: ${message}`,
    retry: 'Try again',
  },

  feed: {
    heading: 'Today',
    empty: 'Nothing posted yet.',
    dayLabel: (day: number) => `Day ${day}`,
    postPrompt: 'Post a scrap of proof',
    composerClose: 'Close',
    caption: 'Say what it is',
    attach: 'Add a photo or clip frame',
    post: 'Post it',
    supported: 'Supported',
    support: 'Support',
    // Comments are purely social — never scored, never required. See
    // Feed.tsx's doc comment for why that's different from the scored
    // reaction above.
    commentPrompt: 'Say something',
    commentPost: 'Comment',
  },

  settings: {
    heading: 'User settings',
    lowerMinimum: 'Change my minimum',
    lowerHelp: 'You can lower this any time. It cannot go back up.',
    reminderOn: 'My own reminder',
    digestOn: 'Who practised today',
    coverDay: 'Cover a missed day',
    coverThisDay: (day: number) => `Cover day ${day}`,
    nothingToCover: 'No missed days to cover.',
    currentMinimum: (minutes: number) => `Right now your minimum is ${minutes} minutes.`,
    reminderOff: 'Turn my reminder off',
    coverSpent: (day: number) => `Cover day used on day ${day}.`,
    coverAvailable: 'You have one cover day left.',
    exportData: 'Export everything',
    resetAll: 'Delete everything',
  },

  setup: {
    skillPrompt: 'What are you learning this week?',
    minimumPrompt: 'What could you still do on your worst day this week, in minutes?',
    minimumHelp: 'Make this small. You can lower it later, but not raise it.',
    cuePrompt: 'When and where will it happen?',
    cueHelp: 'Name a moment and a place. "After I put my coffee down, at the kitchen table."',
    feedbackPrompt: 'How will you know if you are improving?',
    feedbackHelp: 'Your own measure. Recording yourself, a test passing, a photo.',
    reminderPrompt: 'When should we send your own sentence back to you?',
    pactHeading: 'Four declarations',
    pactBody: 'This is the pact. Everyone can see it, and nobody can raise their minimum after today.',
    honourSystem:
      "Minutes aren't scored — inflating them does nothing. This runs on the honour system because there are four of you.",
    // Shown next to the disabled "begin" button — a disabled button with no
    // explanation just reads as broken.
    missing: (items: string[]) => `Still needed: ${joinNames(items)}.`,
    missingLabels: {
      name: 'your name',
      skill: "what you're learning",
      cue: "when and where it'll happen",
      feedback: "how you'll know you're improving",
      code: 'the group code',
    },
    spacingRationale:
      'Seven short sessions beat one long one — spacing practice out is one of the most reliable findings in learning research. That is why this is daily, and why long sessions do not score extra.',
  },

  rules: {
    heading: 'How the week works',
    groupGoal: 'Together you are aiming for 24 practice-days out of a possible 28.',
    bands: 'At 28 it is a perfect week. 24 hits the target. 20 is a strong week. 16 is over half.',
    midpoint: 'On Day 4 the board resets to second-half points only. Nothing you have done is lost.',
    catchup:
      'Each day, whoever has the fewest points earns 2 extra for reflecting and 2 extra for posting. It is a catch-up, and it is the same rule for everyone.',
    coverDay: 'You get one cover day for the week. Use it on any day you miss, no questions.',
    notifications: 'Two a day, maximum. One is the reminder you wrote. One tells you who practised.',
    ceiling: 'Everyone can earn the same 24 points a day, whatever they are learning.',
  },

  log: {
    practisedQuestion: 'Did you practise today?',
    cueQuestion: 'Did this happen at your planned time and place?',
    reflectionPrompt: 'What happened? Your words, not a dropdown.',
    minutesPrompt: 'Minutes (optional, never scored)',
    proofPrompt: 'Post one scrap of proof — a clip, a screenshot, a photo.',
    // Rule 9: no enthusiasm inflation. Day 2 gets a flat acknowledgement.
    logged: (day: number) => `Logged. Day ${day}.`,
    todayTotal: 'Today',
    catchupActive: 'Catch-up is on for you today: reflecting and posting are worth 2 extra.',
    // Rule 8: yesterday is an open door, not a failure marker.
    yesterdayOpen: 'Yesterday is open if you practised and forgot to log it.',
    // Rule 10: a plain exit with no consequence text.
    notToday: 'Not today.',
    // Tracking only — see docs/PRODUCT-SPEC.md's Design Revision. Never
    // scored, so the wording stays as flat as `logged` above: a count, not a
    // congratulation.
    addSession: 'Log another session today',
    sessionsCount: (n: number) => (n === 2 ? 'Logged twice today.' : `Logged ${n} times today.`),
  },

  counters: {
    // Rule 1: both figures only ever increase.
    daysPractised: (n: number) => `Days practised: ${n} of 7.`,
    bestRun: (n: number) => `Best run: ${n}.`,
    // Design Revision 2026-08-27: the streak is now a real, losable stake, so
    // this no longer says "nothing is at stake" — see docs/PRODUCT-SPEC.md.
    currentStreak: 'Current streak',
    rankSummary: (rank: number) => `You're #${rank} of 4 right now`,
    stillTime: 'Still time today if you want it.',
  },

  group: {
    heading: 'Leaderboard',
    // Rule 12: a shortfall is stated as a number and a next step, never a cause.
    behind: (total: number, remaining: number) =>
      `${total} of 24. ${remaining} sessions left in the week.`,
    onPace: (total: number) => `${total} of 24. On pace.`,
    ahead: (total: number, by: number) => `${total} of 24. ${by} ahead of pace.`,
    hit: (total: number) => `${total} of 24. Target hit.`,
    practisedToday: (names: string[]) => `${joinNames(names)} practised today.`,
    postedToday: (name: string, what: string) => `${name} posted ${what}.`,
    waiting: (n: number) => `${n} of 4 have joined so far.`,
    // Design Revision 2026-08-27: the row now shows rank, streak, minutes and a
    // public catch-up badge. See docs/PRODUCT-SPEC.md.
    rank: (n: number) => `#${n}`,
    streak: (n: number) => `${n} day streak`,
    minutes: (n: number) => `${n} min`,
    catchupBadge: '+2 catch-up',
    // The leaderboard row's tap-through detail. Holder-only rules for the
    // cover token (see docs/PRODUCT-SPEC.md) mean nothing here may say
    // whether anyone but the viewer has spent theirs.
    close: 'Close',
    detailPosts: (n: number) => `${n} posts shared`,
    detailSupport: (n: number) => `${n} reactions given`,
  },

  // Shown full-screen, in place of the app, from the moment someone joins
  // until the group's Day 1 actually arrives — a creator can set a future
  // start date, and nothing is loggable or postable before it.
  waiting: {
    heading: (date: string) => `Day 1 starts ${date}.`,
    body: 'The same clock for all four of you — nobody can log or post before then.',
    joined: (n: number) => `${n} of 4 have joined so far.`,
    declaration: (skill: string) => `You're set to learn ${skill}.`,
  },

  days: {
    1: {
      heading: 'Day 1. You are on the board.',
      body: 'Capture where you are starting from. On Sunday you will see this next to where you finished.',
    },
    2: { heading: 'Day 2.', body: '' },
    3: {
      heading: 'Day 3.',
      // The dip. Reframe from "am I good" to "what am I learning about practising".
      body: 'This is usually the flattest day. Nothing has clicked yet and Sunday is still far away. That is the normal shape of it.',
      lowerOffer: 'Is your minimum still right? You can make it smaller. Five minutes counts.',
      // Their own words, handed back. Rule 2, and the Day 3 reframe from "am I
      // any good at this" to "what am I learning about practising".
      callback: (reflection: string) => `On Day 1 you wrote: "${reflection}" Still true?`,
    },
    4: {
      heading: 'Second half starts now.',
      body: 'Points from here on are the ones on the board.',
    },
    5: {
      heading: 'Two days left.',
      body: 'What do you want to be able to do on Sunday?',
    },
    6: {
      heading: 'One day left.',
      body: 'Tomorrow everyone posts one thing. Record something today if you want to.',
    },
    7: {
      heading: 'Day 1, and today.',
      // Rule 9: the single exclamation mark of the entire week lives here.
      body: 'Listen to both!',
    },
    // `satisfies` makes a missing day a compile error rather than a runtime
    // undefined on the one morning it matters.
  } satisfies Record<
    RunDay,
    { heading: string; body: string; lowerOffer?: string; callback?: (r: string) => string }
  >,

  ending: {
    heading: 'This one is over.',
    body: "Here's your data, and an export. If you want to keep going, keep going — you don't need an app for it.",
    archive: 'Archive',
    deleteAll: 'Delete everything',
    unusedToken: 'You did not need your cover day.',
  },

  notifications: {
    // Rule 2: their own sentence, prefixed and otherwise untouched.
    cue: (sentence: string) => `You said: ${sentence}`,
    cueWithReflection: (sentence: string, reflection: string) =>
      `You said: ${sentence} Yesterday you wrote: "${reflection}"`,
    digest: (names: string, total: number) =>
      `${names} practised today. Group's at ${total} of 24.`,
    // The single Day 4 check-in. Both buttons carry equal weight.
    dayFourCheckIn:
      "Two days off. Want to pick it up tonight — or drop your minimum to five minutes? Either's fine.",
    dayFourOnRamp: 'Log tonight',
    dayFourOffRamp: 'Make it 5 minutes',
  },
} as const;

export function joinNames(names: string[]): string {
  const last = names.at(-1);
  if (last === undefined) return 'Nobody';
  if (names.length === 1) return last;
  return `${names.slice(0, -1).join(', ')} and ${last}`;
}
