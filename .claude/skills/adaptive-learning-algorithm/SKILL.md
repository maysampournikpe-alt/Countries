---
name: adaptive-learning-algorithm
description: Adaptive learning engineering for FlagMaster — FSRS spaced repetition with the ts-fsrs library, review scheduling, mapping answers to ratings, diagnostic placement tests, mastery tracking, confusion/mistake analysis, session building (due reviews + new cards), and targeted recommendations, plus safe persistence of scheduling state. Use this whenever writing or changing FlagMaster scheduling, card state, progress storage, the diagnostic, "what to study next", mastery levels, or statistics, even if the request just says "pick the next question" or "track progress".
---

# Adaptive Learning Algorithm Engineer

## ts-fsrs essentials

Check the installed version's README before coding; the API below matches ts-fsrs v4+.

```ts
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Card } from 'ts-fsrs';

const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365 }));
let card: Card = createEmptyCard(new Date());
const { card: next, log } = scheduler.next(card, new Date(), Rating.Good); // one rating
const preview = scheduler.repeat(card, new Date()); // all four outcomes
```

- One card per country *per direction* (flag→name, name→flag) if both are scheduled; keep the key as `${cca3}:${direction}`.
- **Persistence**: `Card.due` and `Card.last_review` are `Date` objects. JSON turns them into strings, so rehydrate on load (`new Date(...)`). Store a schema `version` with saved data and migrate rather than discard. Wrap `localStorage` access in try/catch; on parse failure keep the raw string as a backup key instead of overwriting the learner's progress.
- Keep review logs (or a compact subset) — they enable statistics and future parameter optimisation.

## Mapping answers to ratings

Only the first, unassisted attempt in a question is graded.

| Outcome | Rating |
|---|---|
| Wrong, or "I don't know", or revealed answer | Again |
| Correct, but used a hint, chose after long hesitation, or a typed answer accepted only by fuzzy match with a large edit distance | Hard |
| Correct, normal speed | Good |
| Correct, fast, in a harder format (typed recall or hard distractors) | Easy |

Keep thresholds as named constants; response time should be relative to the learner's own median, not an absolute number.

## Session builder

1. Collect due cards (`due <= now`), most overdue first; cap reviews per session.
2. Add new cards up to a daily new limit (default ~10), fewer if recent accuracy < 80% or the due backlog is large.
3. Choose new cards to build coverage: interleave regions, introduce one member of a look-alike group before its twin, and prefer flags the diagnostic marked unknown.
4. Interleave: no two consecutive questions from the same look-alike group unless it's a deliberate Duel; avoid long same-region runs.
5. Choose the format per card from its state: New/Learning → multiple choice; Review with stability past a threshold → typed recall or reverse; repeated lapses → back to multiple choice with confusable distractors.

## Diagnostic assessment

Goal: place the learner in a few minutes without 195 questions.
- Sample adaptively: start with very common flags, then probe by region and difficulty tier. If a learner misses most of a region's easy flags, assume the rest of that region is unknown.
- Known (fast correct, ideally answered by typing) → create the card and schedule it as if reviewed `Good`/`Easy` so it enters review with a longer interval. Unknown → leave as New (do not punish with lapses).
- Allow stopping at any time; partial results still apply.

## Mastery and mistake analysis

- Mastery levels derived from FSRS state: New, Learning (State.Learning/Relearning), Familiar (Review, stability < 21 d), Mastered (Review, stability ≥ 21 d). Keep this derivation in one function used by every screen.
- Record confusions: when the learner answers country B for flag A, increment `confusions[A][B]`. Use the top confusions for Duel mode, distractor selection and the "your trickiest flags" recommendation.
- Recommendations should be specific and actionable: "5 flags due", "Practice Chad vs Romania (confused 3×)", "Africa is 40% mastered — try a Region Challenge".

## Tests

Scheduling logic is pure: test it with fixed `now` dates. Cover: rating mapping, session composition limits, date rehydration round-trip, schema migration, diagnostic placement, and that a wrong answer never increases a card's interval.
