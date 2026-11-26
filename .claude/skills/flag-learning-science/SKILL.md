---
name: flag-learning-science
description: Evidence-based learning science for memorizing world flags in the FlagMaster app — active recall, spaced repetition, interleaving, visual memorization, discrimination learning between look-alike flags, corrective feedback, and long-term retention. Use this whenever designing or reviewing any FlagMaster quiz, lesson, review session, feedback screen, hint, question order, or study mode, even if the request only says "make the quiz better", "add a practice mode", or "why aren't users remembering flags".
---

# Flag Learning Science Expert

Your job is to make every FlagMaster interaction produce durable memory, not just a pleasant session. Judge every feature by one question: *does this make the learner retrieve, discriminate, and get corrected at the right moment?*

## Core principles and how they apply to flags

1. **Active recall beats recognition.** Typing or picking the country name from memory (flag → name) is stronger than recognising a name in a short list. Use multiple choice for new flags and early stages, then move to free recall (typed answer with fuzzy matching) once a flag has been answered correctly a couple of times. Reverse direction (name → choose flag) trains a different retrieval path; use both.
2. **Spacing.** Review just before forgetting. Scheduling is delegated to FSRS (see the `adaptive-learning-algorithm` skill); this skill decides *what counts as a review*: only an unassisted first attempt counts as a graded review. A retry after seeing the answer is practice, not evidence of memory.
3. **Interleaving.** Mix regions and mix confusable flags within a session instead of blocking "all of Europe". Blocking feels easier and produces worse retention. Exception: the *first* exposure to a confusable set can be side-by-side (see 5).
4. **Small new-item batches.** Introduce ~5–10 new flags per session, interleaved with due reviews. Too many new items crowds out reviews and causes a review avalanche later.
5. **Discrimination learning.** Most flag errors are confusions between look-alikes (Chad/Romania, Indonesia/Monaco, Ireland/Côte d'Ivoire, Australia/New Zealand). After a confusion error, show both flags side by side and name the *distinguishing feature* ("Romania: brighter yellow and lighter blue; Chad: darker indigo blue"). Later, deliberately put both flags in the same session and as distractors for each other.
6. **Corrective feedback, immediately and specifically.** On a wrong answer show: the correct country, the flag the learner *thought* it was (if their answer was another country), and one distinguishing cue. Keep it to one or two lines; long explanations are skipped. On a correct but slow or hard answer, a brief reinforcement is enough.
7. **Visual memorization aids.** Offer one short, concrete mnemonic per flag tied to a visible feature (colour order, emblem, star count, layout), plus optional symbolism. Mnemonics are shown in feedback and in the study/browse view, never during the question itself (that would give the answer away).
8. **Desirable difficulty, not frustration.** Aim for roughly 80–90% success in a session. If accuracy drops lower, reduce new items and add more multiple-choice; if higher, increase new items or move to free recall.
9. **Retrieval over re-reading.** A "browse all flags" page is fine for curiosity, but don't let it count toward progress. Progress comes from answered questions.
10. **Confidence calibration.** Optional "I knew it / I guessed" signal or response time can map to FSRS ratings (Again/Hard/Good/Easy) instead of asking the learner to self-rate every card.

## Question design checklist

- The prompt must not leak the answer: no country name in alt text, image filename visible on hover, tooltip, URL or page title during the question.
- Multiple-choice distractors should include at least one plausible confusable flag once the learner is past the novice stage; random distractors from other continents are too easy.
- One flag per question, rendered large enough that details (emblems, stars) are visible on a phone.
- Free recall accepts reasonable alternative names and spelling mistakes, but a *different* real country must never be accepted (e.g. "Niger" for Nigeria, "Dominica" for the Dominican Republic).

## Reviewing a feature

When asked to evaluate a mode or flow, report briefly: which principles it uses, which it violates, and the single highest-value change. Prefer concrete fixes ("add the confused flag next to the correct one in feedback") over general advice.
