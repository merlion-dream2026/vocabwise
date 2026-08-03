# Parts 2 & 3 Implementation Report

## Content coverage

- 60 linked sets
- 60 Part 2 cue cards
- 120 Part 3 discussion groups
- 360 Part 3 questions
- 180 private Part 2 reference talks
- 1,080 private Part 3 reference responses

## New client-safe data file

`data/ielts-speaking/parts2-3-question-bank.json` was derived from the normalized answer banks. It intentionally excludes all model-answer fields so the client can navigate the full question bank without shipping the proprietary answer bank in the browser bundle.

## Evaluation integration

The API now resolves:

- Part 1 IDs via `getPart1QuestionById()`;
- Part 2 IDs via `getPart2CueCardById()`;
- Part 3 IDs via `getPart3QuestionById()`.

It then loads the corresponding private reference routes with `getSpeakingReferenceByQuestionId()`.

Part 2 receives cue-card bullet points in the evaluation prompt and a larger output budget. Part 3 receives the linked topic, group theme and question-specific quick analysis.

## Validation performed outside the full repo

- TypeScript isolated compile: passed.
- JSON counts and ID uniqueness: passed.
- Every Part 2 and Part 3 client question ID resolves to a private reference entry: passed.
- Client-safe Parts 2–3 JSON contains no `model_answers`, `ta_refined` or `alternative_a` fields: passed.

Claude Code must still run the full repository lint, tests and production build after integration.
