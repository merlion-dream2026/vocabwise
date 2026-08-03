# Final Practical Polish

This package adds three low-risk, learner-facing improvements without new dependencies.

## 1. Listen and copy controls

A new `AnswerActions.tsx` component uses the browser Web Speech API and Clipboard API.

It is available for:

- examiner questions;
- Part 2 cue cards, including the bullet points;
- Band 6, Band 7.5 and Band 9 model answers;
- the alternative-idea answer.

The controls also show:

- word count;
- approximate speaking duration at a moderate 125-word-per-minute practice pace.

Browser text-to-speech is a convenience feature, not a pronunciation model. Voice availability and quality depend on the user's operating system and browser.

## 2. Smaller audio uploads

`RecordAnswerButton.tsx` now requests a 64 kbps audio bitrate. This is appropriate for speech and lowers upload size and latency for longer Part 2 recordings while retaining the existing MIME-type feature detection.

## 3. Pilot QA kit

Added:

- `PILOT_QA_PLAN.md`
- `test-fixtures/ielts-speaking/pilot-evaluation-fixtures.json`

The fixtures contain representative Part 1, Part 2 and Part 3 answers with expected behavioral invariants rather than brittle exact-band assertions.
