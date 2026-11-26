---
name: flagmaster-qa
description: Quality assurance for the FlagMaster flag-learning website — verifying the 195-country database is complete and correct, detecting wrong, outdated or mis-proportioned flags, testing spelling-tolerant (Fuse.js) answer matching, hunting for accidental answer hints, testing progress persistence and FSRS scheduling, and checking that every learning mode, achievement and screen works on desktop and mobile. Use this before any commit, release or "is it done?" claim on FlagMaster, and whenever writing tests, reviewing a change, or investigating a reported wrong answer or lost progress.
---

# FlagMaster Quality Assurance Expert

Evidence before claims: run the checks, read the output, then report. Pair with `superpowers:verification-before-completion` and use `webapp-testing` (Playwright) for browser checks.

## 1. Country database (automated test, must pass)

- Exactly **195** entries; unique `cca3` and `cca2`; contains `VAT` and `PSE`; contains all 193 UN members; contains none of XKX (Kosovo), TWN, ESH, or dependent territories.
- Every entry has: display name, at least one alias, region, a flag asset that exists on disk/bundle, and a positive `flagRatio`.
- Spot-check a sample of names and regions against the source dataset, and the known special cases in the `world-flag-geography` skill (Nepal shape, Switzerland/Vatican square, Qatar 11:28, Monaco vs Indonesia).

## 2. Flags

- Every flag file resolves (no 404 in the network log) and renders non-blank.
- Rendered aspect ratio matches `flagRatio` within ~2% (measure in Playwright via `getBoundingClientRect`).
- Screenshot a full gallery and visually review it against Wikipedia's gallery of sovereign state flags; list any mismatch with the country and what differs.

## 3. Fuzzy answer matching (table-driven tests)

- Accept: exact names, case/diacritic variants ("cote divoire", "Türkiye"/"turkey"), common aliases ("UK", "USA"; document any debatable ones such as "Holland"), single typos ("Phillipines", "Columbia" → Colombia, "Kyrgistan").
- Reject (must not match the target): Niger↔Nigeria, Dominica↔Dominican Republic, Guinea↔Guinea-Bissau↔Equatorial Guinea, Congo↔DR Congo, Sudan↔South Sudan, Austria↔Australia, Iran↔Iraq, Mali↔Malawi, Gambia↔Zambia, Slovakia↔Slovenia, Mauritania↔Mauritius.
- Empty, whitespace-only, very long and emoji inputs don't crash.
- Autocomplete suggestions draw from all 195 countries and never rank the correct answer first merely because it is the answer.

## 4. No accidental hints

During a question, inspect the DOM and accessibility tree: the country name must not appear in `alt`, `title`, `aria-label`, visible text, page `<title>`, URL, or `data-*` attributes; tooltips and hover states reveal nothing; multiple-choice option order is shuffled and the correct option's position is uniformly distributed; the correct option has no distinct styling, focus or timing before answering.

## 5. Persistence and scheduling

- Answer questions, reload: progress, streak, achievements and card due dates persist exactly.
- Corrupt or old-version saved data is migrated or backed up, never silently wiped.
- With a mocked clock: a wrong answer schedules the card sooner; due reviews appear when due; new-card daily limit holds; streak handles day boundaries in the learner's local time zone.

## 6. Modes, UI, accessibility, performance

- Walk every mode end to end (start → answer right → answer wrong → finish screen) via Playwright at 390px and 1280px widths; zero console errors.
- Keyboard-only play works (Enter to submit, number keys for options if offered); visible focus; screen-reader announces correct/incorrect; colour isn't the only signal; respects `prefers-reduced-motion`.
- Lighthouse (Chromium at /opt/pw-browsers/chromium) performance and accessibility scores recorded; flag images lazy-loaded outside the active question.

## Reporting

Report as: what was checked, how (command/test), result, and any failures with reproduction steps. Never write "all tests pass" without the command output in hand.
