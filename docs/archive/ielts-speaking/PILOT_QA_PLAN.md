# IELTS Speaking Coach — Pilot QA Plan

## Purpose

Use this checklist after Claude integrates the package into the real VocabWise repository. The goal is not to prove official IELTS scoring accuracy. The goal is to confirm that the product is stable, pedagogically useful, and faithful to the learner-first design.

## A. Critical technical checks

Run:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Then test on:

- Chrome desktop
- Safari or Chrome on iPhone
- Chrome on Android, if available
- Installed PWA mode, if VocabWise is used as a PWA

## B. Core user journeys

### Part 1

1. Select three different topics.
2. Type a short answer and request feedback.
3. Record a 20–40 second answer.
4. Edit the transcript before evaluation.
5. Open each IELTS criterion.
6. Switch among Band 6, 7.5 and 9.
7. Listen to and copy each model answer.
8. Retry and confirm that the previous estimated band is compared.

### Part 2

1. Select a cue card.
2. Start, pause and reset the one-minute preparation timer.
3. Record at least 90 seconds.
4. Confirm that the uploaded audio remains below the server limit.
5. Check that feedback discusses cue coverage and long-turn organization.
6. Confirm that all three personalized models use the learner's story.
7. Confirm that the alternative model uses a different story.

### Part 3

1. Select both groups in a linked set.
2. Move through all three questions in a group.
3. Submit one shallow list answer and one developed answer.
4. Confirm that feedback rewards depth rather than length alone.
5. Confirm that model answers follow position → explanation → illustration → nuance.

## C. Non-negotiable quality gates

A pilot response FAILS if any of the following occurs:

- Pronunciation receives a numeric score from transcript-only evaluation.
- A quoted evidence string does not occur in the learner's answer.
- The Band 6/7.5/9 models replace the learner's central idea or personal story.
- The alternative answer merely paraphrases the learner's answer.
- A model answer copies distinctive names, places, incidents, or wording from the private coursebook reference.
- Part 1 sounds like an essay or is unnecessarily long.
- Part 2 becomes four disconnected answers to the cue points.
- Part 3 becomes a memorized essay introduction and conclusion.
- More than three low-value corrections overwhelm the learner.
- The UI exposes private reference-answer JSON to the browser.
- An unauthenticated user can call the evaluate or transcribe routes.
- Audio is stored without an explicit product decision and privacy disclosure.

## D. Recommended pilot sample

Test with at least:

- 3 learners around Band 5–5.5
- 3 learners around Band 6–6.5
- 3 learners around Band 7+
- 1 teacher reviewing all outputs

For each learner, collect:

- one Part 1 answer
- one Part 2 answer
- one Part 3 answer
- one retry after feedback

Ask the teacher to mark each output:

- score estimate: too low / reasonable / too high
- feedback: accurate / partly accurate / inaccurate
- model answers preserve learner ideas: yes / partly / no
- alternative idea is genuinely different: yes / no
- most useful feature
- most confusing feature

## E. Practical release threshold

A small private pilot is reasonable when:

- all builds and tests pass;
- no pronunciation-score violations occur;
- at least 90% of evidence quotations are valid;
- at least 85% of personalized model answers preserve the learner's central idea;
- at least 80% of teacher-reviewed feedback is rated accurate or partly accurate;
- recording and transcription work on the main target mobile devices;
- median evaluation latency is acceptable to the product owner.

Do not market the estimated band as official or examiner-verified.
