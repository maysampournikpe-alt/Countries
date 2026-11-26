---
name: educational-game-design
description: Educational game design for the FlagMaster flag-learning app — engaging game modes, meaningful progression, levels, streaks, achievements, adaptive difficulty, motivation, session pacing and user-friendly challenges that serve learning rather than distract from it. Use this whenever designing or changing FlagMaster game modes, challenges, scoring, XP, badges, streaks, onboarding, rewards, timers, leaderboards or the overall feel of a session, even if the request only says "make it more fun" or "add achievements".
---

# Educational Game Designer

Fun should come *from* learning (mastering a hard look-alike pair, finishing a continent) rather than from rewards bolted on top. Every mechanic must pass the test: **would a learner who games this mechanic still learn more flags?** If not, redesign it.

## Design principles

- **Reward mastery, not grinding.** XP and badges track flags moved to long-term retention, perfect discrimination of a confusable group, and completed regions — not raw question count, which encourages farming easy flags.
- **Visible, meaningful progression.** Show a world/continent map or grid of 195 flags filling in by mastery state (new → learning → reviewing → mastered). This is the main motivational surface and doubles as a study guide.
- **Short sessions with a clear end.** Default session ≈ 2–5 minutes (e.g. 15–20 questions or "all due reviews + 5 new"). A clear finish screen with what improved beats an endless feed.
- **Adaptive difficulty.** Difficulty comes from the learning engine: question format (multiple choice → reverse → typed recall), distractor similarity, and time pressure only in optional challenge modes. Keep success around 80–90%.
- **Streaks, gently.** A daily streak helps habit formation; allow a streak freeze/grace day so one missed day doesn't cause quitting. Never shame.
- **Optional pressure.** Timed and "survival/lives" modes are opt-in challenges. Core learning mode has no timer — timers hurt recall of new items and accessibility.
- **Celebrate briefly.** Small animation and sound on milestones (respect `prefers-reduced-motion` and a mute toggle). No modal walls between questions.
- **Honest feedback.** Wrong answers are shown clearly with the correct flag; never hide mistakes to keep the mood up.
- **Low-friction start.** First screen gets the learner answering a question within one tap. Diagnostic assessment is framed as "Let's find what you already know" and can be skipped or stopped early.

## Recommended mode set (adapt to the main spec)

1. **Learn / Daily Review** — FSRS-driven, the default.
2. **Diagnostic** — places the learner quickly; skips flags they already know.
3. **Region Challenge** — one continent, track best score and completion.
4. **Look-alike Duel** — confusable pairs only, discrimination practice.
5. **Speed Round / Survival** — optional, timed or 3 lives, personal bests.
6. **Reverse Mode** — country name → pick the flag.
7. **Browse / Study** — flag gallery with facts; does not count as reviews.

## Achievements guidance

Make 15–30 achievements across tiers: first steps (first 10 mastered), breadth (each continent completed), depth (all 195 mastered), discrimination (all look-alike groups cleared), consistency (7/30/100-day streaks), skill (perfect speed round). Each needs a clear, checkable condition, a name, an icon, and progress (e.g. 37/54). Avoid achievements that reward volume alone.

## Review checklist

Is the next action obvious? Does the session end on a positive, specific note? Can a learner on a phone with one thumb play it? Does any mechanic reward behaviour that harms retention? Is everything usable with keyboard and screen reader?
