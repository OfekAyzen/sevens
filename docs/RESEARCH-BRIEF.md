# Research brief

The evidence base behind `docs/PRODUCT-SPEC.md`. Every mechanism is named with
who established it, how strong the evidence is, and what it implies for this app.

## Short-window behaviour change

- **Habit formation timeline** — Lally et al. 2010: median ~66 days, range
  18–254. The popular "21 days" figure is folklore with no supporting study.
  *Implication:* seven days cannot build a habit, so the app must never promise
  one. It promises evidence about how you practise, which it can actually deliver.
- **Implementation intentions** — Gollwitzer 1999: specifying *when and where*
  reliably improves follow-through. Caveat: Powers et al. found the effect can
  reverse for perfectionists on difficult goals.
  *Implication:* the if-then sentence is a required setup field, rejected if it
  names no cue and no place. It is also reused verbatim as the reminder text.
- **Fresh-start effect** — Dai, Milkman & Riis 2014, *Management Science* 60(10):
  temporal landmarks increase aspirational behaviour.
  *Implication:* the announced Day 4 midpoint reset manufactures a legitimate,
  disclosed second beginning at the point in the week where motivation dips.
- **Goal-gradient effect** — Kivetz et al.: effort increases as a goal nears.
  *Implication:* from Day 5 the framing switches to a countdown.

## Streaks

- **Loss aversion** — Kahneman & Tversky. **Contested**: Gal & Rucker 2018 argue
  much of the evidence is better explained by psychological inertia.
  *Implication:* do not build the motivational model on a 2:1 loss coefficient.
- **Endowed progress** — Nunes & Drèze: artificial initial progress increases
  completion.
  *Implication:* Day 0 setup already counts, so nobody starts at zero.
- **Zeigarnik effect** — **largely failed replication.** A 2025 systematic review
  found no memory advantage for unfinished tasks and concluded it "lacks universal
  validity". The related **Ovsiankina effect** (the urge to resume an interrupted
  task) did survive.
  *Implication:* do not cite Zeigarnik in design rationale.
- **Abstinence-violation / "what-the-hell" effect** — Cochran & Tesser: one lapse
  triggers abandonment of the whole goal.
  *Implication:* this is the single biggest risk in a 7-day contest. A Day 3 miss
  must not delete the promised outcome with four days still on the clock. Hence:
  no losable counter, no `currentRun`, a cover token, and monotonic figures only.
- **Duolingo's own data** — doubling streak freezes *increased* engagement
  (+0.38% DAU). Their widely-quoted 3.6× course-completion figure is
  correlational and selection-driven.
  *Implication:* the strongest available empirical argument against the strict
  streak instinct. Err lenient.

## Competition across incommensurable skills

- **Social comparison theory** — Festinger 1954, plus Wills 1981 on downward
  comparison and Aspinwall & Taylor on moderators. Upward comparison motivates
  the person who feels capable and demoralises the person who has just failed.
  *Implication:* on Day 3 the app surfaces a peer's *struggle*, not a peer's
  triumph.
- **Leaderboard harm in gamification** — Hanus & Fox 2015 and related work.
  **Weaker than commonly presented**, but consistently negative for trailing
  users.
  *Implication:* the group number is the hero; individual rows are unranked and
  fixed alphabetically.
- **Superordinate goals** — Sherif 1954 (Robbers Cave; note the well-documented
  methodological criticisms). Johnson & Johnson's cooperation meta-analyses are
  the stronger evidence.
  *Implication:* the dominant metric is a shared 24-of-28 target. The individual
  contest is demoted to process points with an identical ceiling for everyone.

## Self-determination

- **SDT** — Deci & Ryan: autonomy, competence, relatedness.
- **Overjustification / undermining effect** — Deci 1971; Lepper, Greene &
  Nisbett 1973; Deci, Koestner & Ryan 1999 meta-analysis. Tangible expected
  rewards reduce intrinsic motivation for already-interesting activities.
  Contested by Cameron & Pierce and Eisenberger.
  *Implication:* these four people chose skills they *want* to learn, so points
  are a real risk to the motivation they already have. Hence: no prizes, no
  badges, no XP, no levels; points are deleted on Day 8; and the reward is the
  before-and-after artefact rather than anything the app grants.

## Ethical engagement vs dark patterns

- **Variable-ratio reinforcement** — Skinner. Powerful and precisely the
  mechanism behind compulsion loops.
  *Implication:* no random rewards of any kind. Every point value is knowable in
  advance.
- **Dark patterns** — Brignull's taxonomy (2010); Mathur et al. 2019 surveyed
  ~11,000 sites and catalogued 1,818 instances across 15 categories; FTC action
  against Epic ($245M) shows the regulatory direction.
  *Implication:* the banned-strings list in the spec, mechanically enforced by
  `tests/unit/invariants.test.ts`.
- **Notification load** — NN/g reports users receiving ~56 notifications a day.
  *Implication:* a hard cap of two, one of which is the user's own sentence.

## Feedback and progress

- **The Progress Principle** — Amabile & Kramer, HBR May 2011: small wins are the
  strongest driver of engagement in creative work.
- **Growth mindset** — Dweck. **Weaker than its popular presentation**; large
  replications find small effects.
  *Implication:* process-framed copy is used because it is honest and costs
  nothing, not because it is proven potent.

## Practice quality

- **Deliberate practice** — Ericsson 1993: five criteria, including immediate
  feedback and a specific target just beyond current ability.
  *Implication:* the "how will you know you're improving?" setup field, which
  becomes the Day 8 report's spine.
- **Spacing** — Cepeda et al. 2006: 259 of 271 comparisons favoured spaced over
  massed practice.
  *Implication:* daily practice is the unit, and long sessions never score extra.
  This is stated to users as the reason, not as a rule.
- **Retrieval practice** — Roediger & Karpicke: testing beats restudying.
- **Reflective writing** improves learning transfer.
  *Implication:* the reflection is free text and is the second-highest-scoring
  action. Never a dropdown.

## Load-bearing claims that are unverified

Three claims used in the design could not be verified to source and are flagged:
Lally on the effect of missing a single day; Hanus & Fox 2015's effect sizes; and
the precise DKR 1999 effect sizes. The recommended structure survives all three
being weaker than stated, because it earns its keep on fairness grounds alone:
four people learning four different things need a scoring system that cannot rank
them by volume.
