# Sevens — Product Specification

A seven-day competition for **exactly four friends**, each learning a **different**
skill. It is short-lived, socially intimate, and has no growth or monetisation
motive. The only success metric is that all four people actually practise and
still like each other on Monday.

Every rule below is derived from the behavioural-science brief in
`docs/RESEARCH-BRIEF.md`. Where popular product instinct and the evidence
disagree, this document follows the evidence and says why.

---

## 0. The two design problems

1. **Four people, four incommensurable skills, one contest.** Guitar minutes are
   not Python minutes. Any scoring system based on volume or outcome is unfair by
   construction.
2. **A seven-day window is too short to build a habit and long enough to fail
   publicly.** The median habit takes ~66 days to form (Lally et al. 2010); the
   "21 days" figure is folklore. So the app must not promise a habit, and must be
   built so that a bad Wednesday does not end someone's week.

Everything downstream is a consequence of these two facts.

---

## 1. Scoring

### Process points — the only scored quantities

Per person, per app-day:

| | Action | Points |
|---|---|---|
| A | Practised at or above **your own** declared minimum | 10 |
| B | Practised at your declared if-then cue **and** place | 3 |
| C | Logged a reflection (free text, ≥ 15 chars) | 4 |
| D | Posted a proof-of-work scrap to the group | 3 |
| E | Reacted or replied to another person's post (max 2 × 2) | 4 |
| | **Daily ceiling — identical for all four people** | **24** |
| | Weekly ceiling | 168 |

`10 + 3 + 4 + 3 + 4 = 24`.

### Gating

- **B, C and D require A.** You cannot claim you hit your cue on a day you did not
  practise.
- **E does not require A.** Supporting friends on a day off still scores — this is
  deliberate, and it is what keeps a lapsed person attached to the group instead
  of quietly leaving.
- E awards **once per distinct person per day**, capped at 2, only on posts from
  the last 48h, never on your own posts.
- A is **binary and self-declared**. No timer, no minimum session length beyond
  the one they set themselves.
- B is a single yes/no toggle. Never verified, never contested.

### Minutes: recorded, never scored

An optional field, default empty. Logging with no minutes still awards the full
10. Minutes are used in exactly two places: the Day 8 personal report, and the
user's own private trend. They appear in **no** shared view, no ranking, no
notification, ever.

> **Do not write the aggregate-minutes-by-person query.** If it exists in the
> codebase, some screen will eventually surface it, and the moment it does the
> honour system becomes a volume race and cross-skill fairness is gone.

### The deliberate asymmetry

A person with a 5-minute minimum earns the same 10 points as a person with a
60-minute minimum. This is intentional. Rewarding larger minimums reintroduces
volume competition and cross-skill unfairness. Minimums may be **lowered** at any
time, free, no penalty; they may **not be raised** after Day 1, which prevents
late-week point farming by re-declaration.

### Why cheating is pointless rather than prevented

Nothing stops someone logging a session they did not do. That is the design —
four friends, honour system. What makes it unappealing:

- There is no prize. The winner is named once, small, on Day 7.
- The inflatable metric (minutes) is worth nothing; the scored one (did you show
  up) is binary, so there is no dial to turn.
- The ceiling is hard: four hours scores the same as twenty focused minutes.
- Proof-of-work is asymmetric in the right direction — recording 15 seconds of
  guitar is *less* effort than fabricating a plausible practice narrative.
- Reflections are read by friends. Fabrication is socially expensive in a group
  of four in a way it is not among strangers.

Say it out loud on the Day 0 screen: *"Minutes aren't scored — inflating them does
nothing. This runs on the honour system because there are four of you."* Naming
the honour system is part of what makes it one.

---

## 2. The group goal

```
covered_days(person) = days_practised(person) + tokens_spent(person)
GROUP_TOTAL          = Σ covered_days over 4 people
MAXIMUM              = 4 × 7 = 28
TARGET               = 24 of 28        (absorbs four missed days)
```

A **practice-day** is one app-day on which that person logged A. One per day
maximum; a second session adds nothing. No partial credit, no quality weighting.

### Bands, not pass/fail

| Total | Label |
|---|---|
| 28 | Perfect week. All four, every day. |
| 24+ | Target hit. |
| 20+ | Strong week. |
| 16+ | Over half. Four people, sixteen days of practice that didn't exist last week. |
| <16 | *No label.* Show the number and the artefacts, nothing else. |

**All bands are published on Day 0**, so nobody discovers the floor on Day 7.

> A 28/28 target would be an all-or-nothing streak at group scale, where the
> guilt is *social* rather than personal — strictly worse than a personal streak.
> 24 is chosen so the group can lose four days and still land it.

### Pace display

- Home shows one large number: `GROUP: 17 of 24`, with the on-pace figure.
- **On or ahead:** say it plainly. *"17 of 24. Two ahead of pace."*
- **Behind:** state the number and the nearest reachable next step — **never** the
  deficit, never a cause. Good: *"11 of 24. Fourteen sessions left in the week."*
  Bad: *"You're 3 behind — someone needs to step up."*
- **Never attribute a shortfall to a person.** No per-person contribution ranking.
  Individual counts appear only as an unranked, **alphabetically fixed** row of
  four names, never sorted by value.

### What the group gets

Nothing purchasable or unlockable. The reward is the Day 7 ritual: four artefacts
side by side, the band label, and each person's Day 1 vs Day 7 comparison. A
single shared summary card is exportable — **not gated** behind hitting 24.

---

## 3. Counters and the streak problem

### The only counters that exist — all monotonic

```
days_practised(person)   0..7   literal: days A was logged. Only increases.
best_run(person)         longest consecutive covered-day run achieved. Only increases.
group_total              0..28  only increases.
process_points(person)   only increases.
```

### ADR-001: `current_run` does not exist

Do not compute it, store it, or derive it for a UI. A current-run value can
decrease, and any decreasing number will eventually be rendered decreasing. In a
7-day contest, a Day 3 miss would then delete the promised outcome with four days
still on the clock — the abstinence-violation ("what-the-hell") effect, and the
single most likely cause of someone abandoning the week.

`best_run` counts token-bridged days as continuous. `days_practised` does not — it
stays literally true.

Duolingo's own published data supports the lenient direction: doubling streak
freezes *increased* engagement (+0.38% DAU). More forgiveness, not less.

### The 4am day boundary

- App-day D spans `04:00:00` local on D → `03:59:59` local on D+1.
- A session logged at 01:30 Tuesday belongs to Monday. This is the **definition**
  of a day, not a grace period stacked on one. Do not add a second grace period.
- **Retroactive logging:** during app-day D you may log for D−1. Tagged "logged
  late" in your own view only; invisible to the group, no point penalty.
- Each person's boundary is **their own local 04:00**. `group_total` is eventually
  consistent across time zones. A friend abroad must not have their Tuesday
  scored as someone else's Monday.
- **Never** say "you have 2 hours left to log today." The boundary is silent.

### The "life happens" token

- **Exactly one per person per run.** Granted at setup. Not earnable, purchasable
  or giftable.
- **Spending:** tap any missed day → "Cover this day." One tap. No reason field,
  no confirmation, no "are you sure — it's your only one?" Friction on an off-ramp
  turns it back into pressure.
- **Effect:** counts toward `group_total`, bridges `best_run`, does **not** add to
  `days_practised`, awards **zero** points.
- **Window:** any time during the run, including Day 7 for a Day 2 gap.
- **Visibility: holder only.** The group total rises by one with no itemisation,
  no event, no icon, no feed entry. If the group can infer it, the mechanic has
  failed.
- If unspent, mention it once on Day 8, neutrally: *"You didn't need your cover
  day."*

### Never ship

**Strings:** "Streak lost/broken" · "Back to zero" · "Start again" · "Don't lose
your streak" · "Your streak is at risk" · "X hours left" · any countdown to the
boundary · "You're in 4th" · "Last place" · "You're behind" · "3 friends are ahead
of you" · "Everyone else has practised today" · "You only did X minutes" · "That's
less than yesterday" · "Dana used a cover day" · "Dana hasn't practised in 2 days"
· "Are you sure you want to give up?" · any confirmshaming decline label · "We
miss you" · "Where have you been?" · "Build a lasting habit in 7 days" · the word
"failed" · `0` rendered as a state rather than a count.

**Mechanics:** any displayed value that can decrease · any flame/at-risk icon ·
app-icon badge counts · red dots · a nudge/poke/remind-them button (*in a group of
four this is a weapon, and it will be used as one, once, and remembered*) ·
peer-approval voting on someone's log · mystery boxes, spin-to-win, variable
multipliers, surprise bonuses · infinite scroll, autoplay, pull-to-refresh on the
feed · minutes in any shared view · sorting the four names by any performance
value.

---

## 4. The Day 4 pivot

### Midpoint reset

- Fires at 04:00 local on app-day 4. **Announced on the Day 0 rules screen**, so it
  is a published rule rather than the app rigging the game mid-week. Undisclosed
  it reads as manipulation; disclosed it reads as a format. Same mechanic,
  opposite meaning.
- Effect: the **displayed** contest becomes Days 4–7 points only. Days 1–3 are
  preserved as a private personal stat.
- `days_practised`, `best_run`, `group_total` are **untouched**. Nothing is lost;
  only the ranking *window* changes.
- Day 7 shows both: second-half prominent, full-week secondary.
- Copy: *"Second half starts now. Points from here on are the ones on the board."*

### Catch-up bonus

- Evaluated at each person's own 04:00 rollover, on cumulative points **within the
  current display window**.
- Condition: `points(person) == min(points across all four)`. **Ties all qualify** —
  including everyone at 0 on Day 1, which is harmless and avoids a special case.
- Recomputed daily. Nobody is persistently labelled "the underdog."

| Action | Normal | With catch-up |
|---|---|---|
| C — reflection | 4 | **6** |
| D — proof-of-work | 3 | **5** |
| Daily ceiling | 24 | **28** |

A flat +2, not a 1.5× multiplier — `1.5 × 3 = 4.5` and fractional points in a UI
are worse than the problem they solve.

It applies **only** to the two actions requiring no skill and no extra practice
time. It never touches A (showing up) or E (support), so it cannot be farmed and
never rewards absence.

### Disclosure without shaming

- Stated as a **rule** on Day 0: *"Each day, whoever has the fewest points earns 2
  extra for reflecting and 2 extra for posting. It's a catch-up, and it's the same
  rule for everyone."*
- Whether it is **active for you** appears **only in your own view**: *"Catch-up is
  on for you today: reflecting and posting are worth 2 extra."*
- The shared board shows totals only. **No "+2" annotations, no badge, no icon.**
  If a viewer can identify the holder, you have built a last-place indicator.
- Phrase it as need, never pity: *"The group needs your days."*

### Lowering your own minimum

- Always available in your own settings (lower only).
- **Actively offered exactly twice**, both times as a first-class button at the
  moment of need — never a buried toggle:
  - **Day 3**, to everyone: *"Is your minimum still right? You can make it smaller.
    Five minutes counts."*
  - **Day 4**, only to someone with 2+ missed days, in the single permitted
    check-in.
- Immediate, retroactive to today, no penalty, no announcement, no "reduced goal"
  marker anywhere. One tap plus a value — a confirmation dialog would make it not
  an off-ramp.

---

## 5. Notifications

**Hard cap: 2 per person per day.** Day 4 may carry a third, for a person with 2+
missed days, that day only. State the cap on the permission screen: *"Two a day,
maximum. One is the reminder you wrote. One tells you who practised."*

Permission is requested **after Day 0 setup completes**, never on first launch — a
cold-start prompt gets denied, and then the one genuinely useful notification
never fires.

### Slot 1 — the self-set cue reminder

- Time chosen by the user; the app suggests nothing beyond "when does your plan
  say?"
- Content is **their own if-then sentence, verbatim**, prefixed with "You said:"
  and nothing else.
  > *"You said: after I put my coffee down, twenty F-chord changes."*
- **Suppressed entirely if A is already logged today.** Reminding someone to do
  what they have done is the fastest way to teach them the app is not paying
  attention.
- From Day 2 it may append yesterday's reflection rather than repeating verbatim.
- **Never** adds a sentence in the app's voice. No "let's go!", no "you've got
  this."

### Slot 2 — the peer digest

- One fixed evening slot, 20:00 local, batched, never per-event.
- **May say:** who practised, what they posted, the group total.
  *"Dana, Sam and Priya practised today."* / *"Group's at 17 of 24."*
- **May not say:** who did *not* practise · who is ahead or behind · anyone's rank
  · anyone's minutes · anyone's token use · anything comparative about the
  recipient.
- If the recipient is the only one who practised, it names only who did.
- **Suppressed if nobody practised.** Silence beats *"Nobody practised today."*

### Day 4 exception — once per run, to anyone 2+ days down

> *"Two days off. Want to pick it up tonight — or drop your minimum to five
> minutes? Either's fine."*

Two buttons: **"Log tonight"** and **"Make it 5 minutes."** The off-ramp carries
the same visual weight as the on-ramp. Never repeated, never escalated.

### Opt-out

Each slot independently toggleable, one tap, in-app. **Everyone's notification
settings are private** — nobody's quiet mode becomes group information. Turning
them off never triggers a warning or a "you'll miss out." Nothing originates
between 21:00 and 06:00 local under any circumstance.

---

## 6. Microcopy — twelve rules

| # | Rule | ✗ Bad | ✓ Good |
|---|---|---|---|
| 1 | Count up, never down | `Streak: 0. Start again tomorrow.` | `Days practised: 3 of 5. Best run: 2.` |
| 2 | Their words, not yours | `Time to practise guitar! 🎸` | `You said: after I put my coffee down, twenty F-chord changes.` |
| 3 | Name the process, not the person | `You're a natural at this!` | `Third session, and you dropped the tempo when the fast version wasn't working. That's the move.` |
| 4 | Describe, don't grade | `Great session! 9/10 effort!` | `18 minutes, at the kitchen table, like you planned.` |
| 5 | Make the next action smaller than they expect | `Get back on track — complete today's session!` | `Five minutes counts. Want to make that your minimum?` |
| 6 | No guilt, urgency or scarcity | `⏰ 2 hours left to save your streak!` | `Still time today if you want it.` |
| 7 | Comparison is only ever additive | `Sam is beating you this week.` | `Sam posted a clip of the bridge.` |
| 8 | Never manufacture a setback | `You missed yesterday. Don't let it happen again.` | *(empty cell, no marker)* / `Yesterday's open if you practised and forgot to log it.` |
| 9 | One exclamation mark per week | `AMAZING!! 🎉🎉🎉` | `Logged. Day 2.` → and on Day 7: `Day 1, and today. Listen to both!` |
| 10 | Always show the exit | `No thanks, I don't care about improving.` | `Not today.` |
| 11 | Never promise a habit | `Build a lasting habit in 7 days.` | `Seven days of evidence about how you learn, and one thing you can show.` |
| 12 | Group shortfalls have no author | `The group would be at 18 if everyone had practised.` | `11 of 24. Fourteen sessions left in the week.` |

---

## 7. The Day 0 → 8 arc

### Day 0 — setup. *Feels like: a pact.*

Collects: skill · declared minimum (with **downward** pressure — *"What could you
still do on your worst day this week?"*) · the full if-then sentence, rejected if
it names no cue and no place · **"How will you know if you're improving?"** (their
feedback source — the highest-value field in the app) · their own reminder time.

Then **all four declarations on one screen at once**. That is the commitment
device.

Full rules screen, all of it, now: the 24/28 target and bands, the Day 4 reset,
the catch-up rule, the cover token, the notification cap, the honour-system line.
Plus the rationale as a fact rather than a rule: *"Seven short sessions beat one
long one — spacing practice out is one of the most reliable findings in learning
research. That's why this is daily and why long sessions don't score extra."*

Notification permission requested **here**, after all of the above.

### Day 1 — *easy, slightly ceremonial.*

Setup already counted, so nobody starts at zero. **Capture the baseline artefact
— prompt hard for it.** This is the single irreversible step in the whole app;
Day 7's payload does not exist without it. No ranking, no points display today —
points accrue silently. `Day 1. You're on the board.`

### Day 2 — *fine; novelty fading.*

Group total appears. Points switch on, quietly, unranked. **Add no mechanic** —
this is the day product instinct says to introduce something, and anything added
now competes with a skill that has not started paying out. `Logged. Day 2. Group's
at 7 of 24.`

### Day 3 — *the dip. Highest-risk day.*

Novelty gone, no visible gain, finish line too far to pull. Reframe from "am I any
good at this" to "what am I learning about practising."

- Surface **their own Day 1 reflection**: *"On Day 1 you wrote: 'the F chord is
  impossible.' Still true?"*
- Surface **a peer's struggle, not a peer's triumph** — the most recent reflection
  from someone else mentioning difficulty. Normalising difficulty is right for
  someone who has just had a setback; upward comparison is the documented wrong
  move.
- First minimum-lowering offer, to everyone.

### Day 4 — *a second beginning. The most important day.*

Midpoint reset fires. Group total at halfway with an explicitly reachable back-half
figure: *"14 of 24. Ten more sessions gets you there — that's under three each."*
Catch-up active, shown only to holders. The one permitted check-in goes out.

### Day 5 — *the pull.*

Framing switches to countdown. Each person names the one thing they want to be
able to do by Day 7 — stored, shown back on Day 7. *"Two days left. What do you
want to be able to do on Sunday?"*

### Day 6 — *anticipation.*

Prompt the final artefact. **Tell everyone the Day 7 ritual in advance** so they
can prepare — anticipation built on a deadline that genuinely exists, which is
what separates it from manufactured FOMO. *"Tomorrow everyone posts one thing.
Record something today if you want to."*

### Day 7 — *a showcase, not a verdict.*

All four artefacts together. Group total resolves with its band. **The payload:
each person's Day 1 artefact beside their Day 7 artefact** — self-referential,
unfakeable, works identically for guitar, Python and cooking. Plus their Day 5
stated goal against what they posted. Points shown **once, small**; winner named
lightly. The group number is the large element. **Never compare artefacts to each
other** — every comparison is a person against their own Day 1.

### Day 8 — *a clean ending.*

Personal report: which days, what times, median session length, what they said was
hard, what changed, their reflections in sequence. This is why the app can
honestly claim success even for the person who practised three times.

**Delete the points.** Archive artefacts and reflections. Export offered before
anything is removed. Equal-weight `Archive` and `Delete everything`.

> *"This one's over. Here's your data, and an export. If you want to keep going,
> keep going — you don't need an app for it."*

**No re-engagement prompt on Day 9.** An app with no growth motive should be
willing to end, and visibly ending is the strongest available signal that the
whole week was on the level. A "start another week?" push retroactively makes the
previous seven days feel like a funnel.

---

## 8. Implementation traps

**Irreversible**
1. **Not capturing a Day 1 baseline artefact.** Day 7's emotional payload cannot be
   retrofitted on Day 6. If you build one thing first, build this.
2. **Letting `current_run` exist anywhere.** Delete the concept, not just the view.

**Hierarchy inversions**
3. Making the group goal decorative while a leaderboard is the hero — all of the
   social-comparison harm, none of the cooperative benefit.
4. Setting the group target at 28/28.
5. Sorting the four names by performance. A sorted list is a leaderboard whatever
   you call it.

**Timing and disclosure**
6. Making the Day 4 reset a surprise.
7. Letting the catch-up bonus be inferable from a shared view.
8. Requesting notification permission on first launch.
9. Sending the cue reminder after they have already logged.

**Content quality**
10. Making reflections multiple-choice or auto-generated. A mood dropdown destroys
    the Day 3 callback, the Day 8 report, and the reason reflections are scored.
11. Requiring a written comment for support points. Reactions must count, or Day 4
    support collapses to zero.
12. Recording minutes and then surfacing them "because we have the data."

**Tone**
13. A celebration animation on every log. Enthusiasm inflation makes Day 7 worth
    nothing.
14. Writing the reminder in the app's voice. "Time to practise!" is a system nag;
    their own sentence is a held commitment. Same push, different psychology.
15. Adding a nudge button because it seems friendly.
16. Comparing artefacts to each other on Day 7.

**Endings**
17. Keeping the app alive after Day 8 with re-engagement prompts.
18. Deleting on Day 8 without exporting first.

**Small but real**
19. Forcing one shared time zone.
20. A confirmation dialog on the cover token or the lower-your-minimum action.

---

## 9. Evidence notes

Three load-bearing claims are weaker than commonly presented, and are flagged
honestly:

- **The Zeigarnik effect has largely failed replication** (2025 systematic review:
  no memory advantage for unfinished tasks). The related **Ovsiankina effect** —
  the urge to resume an interrupted task — did survive. Do not cite Zeigarnik.
- **Loss aversion is contested** (Gal & Rucker 2018 argue psychological inertia).
  Do not build the motivational model on a 2:1 coefficient.
- **Growth-mindset and leaderboard-gamification literatures** are both weaker than
  their popular presentation. Process-framed microcopy is recommended here on
  accuracy-and-cost grounds — it is honest and costs nothing — rather than on
  proven efficacy.

The recommended structure survives all three being weaker than claimed, because it
earns its keep on **fairness** grounds alone: four people learning four different
things need a scoring system that cannot rank them by volume.
