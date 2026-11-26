# FlagMaster — Road to 195

An adaptive web app that takes you from knowing some flags to recognising **every national flag in the world** from memory — the 193 UN member states plus Palestine and Vatican City — with long-term retention, not short-term cramming.

No account, no API key, no paid service. Progress is saved in your browser.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. `npm run dev` first regenerates the country data and flag files (`scripts/build-data.mjs`).

Production build and preview:

```bash
npm run build
```

```bash
npm run preview
```

## Deploy to Netlify (free)

`netlify.toml` already contains the build command, publish folder (`dist`), Node version and the single-page-app redirect.

1. Push this repository to GitHub.
2. In Netlify choose **Add new site → Import an existing project** and pick the repository.
3. Keep the detected settings (`npm run build`, publish `dist`) and deploy.

Or with the Netlify CLI:

```bash
npm run build && npx netlify deploy --prod --dir=dist
```

## Tests

Unit tests (data integrity, fuzzy search, scheduling, mastery, diagnostic, planner, gamification — 92 tests):

```bash
npm run data && npm test
```

End-to-end browser tests (31 scenarios: every mode, diagnostic resume, exam, persistence, export/import/reset, answer-leak checks, mobile overflow, keyboard and touch). They need Playwright's Chromium (`npx playwright install chromium`) and a running preview:

```bash
npm run build && npx vite preview --port 4173 &
```

```bash
npm run e2e
```

## What is in it

| Area | Where |
|---|---|
| Diagnostic assessment (all 195, random order, resumable, checkpoints every 25, no feedback until the end, confidence + timing) | `src/pages/Diagnostic.tsx`, `src/engine/diagnostic.ts` |
| Spelling-tolerant answer box + A–Z picker | `src/components/CountryPicker.tsx`, `src/search/countrySearch.ts` |
| Spaced repetition (FSRS), mastery rules, priorities, session planner | `src/engine/` |
| 6-stage lessons for groups of 4–7 new flags | `src/quiz/Lesson.tsx` |
| Flag Detective (look-alike groups + personal confusion pairs) | `src/pages/Detective*.tsx`, `src/data/similar.ts` |
| Game modes | Smart Training, Daily Review, Flag Detective, World, Continental, Speed, Mistake Crusher, Reverse, Survival, Custom, Final Mastery Exam, Bonus territories |
| Dashboard, world map, collection, achievements | `src/pages/Stats.tsx` |
| Flag Atlas | `src/pages/Atlas*.tsx`, `src/data/content.ts` |
| Saving, export/import/reset | `src/store/store.ts`, `src/pages/Settings.tsx` |

## Data sources and verification

- **Countries:** [mledoze/countries](https://github.com/mledoze/countries) (`world-countries` 5.1.0). The core set is every `unMember` entry plus `VAT` and `PSE`, checked against an explicit list of 195 ISO codes in `src/data/data.test.ts`. Note: the dataset marks Vatican City as a UN member (it is an observer state); the explicit list guards against such errors.
- **Flags:** `svg-country-flags` (Wikimedia Commons SVGs at **official proportions** — e.g. Switzerland and Vatican 1:1, Qatar 11:28, Nepal's double pennant). Every flag was compared visually against the current [flag-icons](https://github.com/lipis/flag-icons) set; two designs had changed since that package's last release and are corrected in the build script: **Kyrgyzstan** (2023, straight sun rays — taken from flag-icons and re-framed to 3:5) and **Syria** (2025, green–white–black with three red stars — drawn from the specification). Afghanistan is shown with the flag recognised at the UN, with a note about the flag used by the Taliban administration.
- Flag files get opaque names and have titles/descriptions stripped, so the page source never reveals the answer.
- **Map:** Natural Earth 1:110m via `world-atlas`; microstates are drawn as dots.
- **Bonus entities** (Taiwan, Kosovo, Greenland, Puerto Rico, Hong Kong, England, Scotland, Wales and others) are scored separately and never count towards 195.

## The learning science, and where it is implemented

| Principle | Evidence | Implementation |
|---|---|---|
| Retrieval practice / active recall | Roediger & Karpicke (2006) *Psychological Science*; Dunlosky et al. (2013) rate practice testing "high utility" | Flags are always recalled, never just re-read. The Atlas does not count as progress. Only an unassisted first attempt is graded. |
| Spaced repetition | Cepeda et al. (2006) meta-analysis, Cepeda et al. (2008) optimal gaps; Dunlosky et al. "high utility" distributed practice | FSRS (`ts-fsrs`) schedules each flag at 90% target retention. Reviews are capped per day, so a break never creates an avalanche. |
| Interleaving | Kornell & Bjork (2008), Rohrer & Taylor (2007); Dunlosky et al. "moderate utility" | New-flag selection rotates continents; mastery checks mix new flags with earlier ones; look-alike drills alternate directions. |
| Discrimination learning | Category-learning research shows interleaved contrast helps tell similar items apart (Kang & Pashler 2012; Birnbaum et al. 2013) | Flag Detective: 30 curated look-alike groups plus your own confusions; side-by-side comparison at true proportions; drills run until each flag is right 3 times in a row. |
| Immediate corrective feedback | Hattie & Timperley (2007); Butler & Roediger (2008) — feedback after errors prevents learning the wrong answer | Every miss shows the flag you saw next to the flag you named, with the distinguishing cue. The diagnostic and the exam deliberately withhold feedback until the end. |
| Elaborative encoding and visual association | Dunlosky et al. (elaborative interrogation, "moderate"); dual coding | Each flag has a visual description, a memory trick (clearly marked as invented) and documented symbolism, plus its location on a map. |
| Desirable difficulty and adaptive difficulty | Bjork (1994) | Lessons fade hints (3 options + description → 4 options + continent → 5 options → typed recall). The group size adapts (4–7) to your recent recall accuracy. |
| Mastery learning | Bloom (1968) | A flag is "mastered" only after correct, unassisted recall on at least 2 different days, including one success after a gap of 3 or more days, with the latest answer correct. A later miss removes mastery. |

### Review priority

`src/engine/planner.ts` orders work as requested:

1. flags you keep getting wrong (open mistakes),
2. flags you confuse with another country,
3. new flags (taught in lessons, confused ones first),
4. flags due for spaced review,
5. flags recognised slowly or uncertainly that are coming due.

Mastered flags that are not due score zero, so they are not repeated needlessly.

### Answer evaluation

Suggestions depend only on what you type, never on the flag being asked. Ranking ties are broken alphabetically. An answer is evaluated only after you select and submit a real country, so spelling can never make an answer wrong. Countries with near-identical names (Niger/Nigeria, Dominica/Dominican Republic, the two Congos, Guinea and its namesakes) are always suggested side by side and never merged.

## Project skills

`.claude/skills/` holds five project-specific Claude Code skills used while building this app: flag learning science, world flag geography, educational game design, adaptive learning algorithms, and FlagMaster QA.
