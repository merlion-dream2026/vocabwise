You are auditing one topic of VocabWise Academic (IELTS/SAT vocabulary content for Vietnamese students) for OBJECTIVE, mechanically-verifiable defects only. Do NOT suggest subjective rewrites or "better" prose — only flag things that are factually/structurally wrong.

Check for:
1. **Answer key correctness** — for every exercise item, does the marked correct answer actually make sense as correct, and do the distractors NOT also work?
2. **Structural bugs** — duplicate options within one item, an item's `answer` value that doesn't match any of its own `options`, malformed brackets/JSON-like artifacts leaking into display text, an E_ERROR_FIX item whose `highlighted` span doesn't actually appear inside `sentence`.
3. **false_friend field logic** — if a glossary item has a `false_friend` object, check the example sentences aren't swapped (i.e. the ORIGINAL word's example must actually contain the original word, not the false-friend word, and vice versa).
4. **Passage–glossary mismatch** — a glossary word that never appears (in any inflected form) anywhere in the passage text.
5. **Vietnamese text quality** — mojibake/corrupted diacritics, or English words left untranslated inside a `_vi` field where a Vietnamese word was clearly intended.
6. **Missing/empty fields** — any field that is empty string or null where content is clearly expected given sibling items in the same topic have it filled.

**Known non-issues — do NOT flag these, they are intentional by design:**
- An empty top-level `answer_key: {}` on an `ex6_cat`/`ex6_odd`/`ex6_sd`/`ex6_sub` exercise is EXPECTED — these 4 rotation exercise types store each item's answer inline in `items[].answer`, not in the exercise-level `answer_key`. Only flag a missing answer if an individual item itself lacks an `answer` field.
- An empty `false_friend.word` (`""`) is EXPECTED when `false_friend.explanation_vi` describes a heteronym — the SAME spelling with a different meaning/pronunciation (e.g. "live" verb vs "live" adjective, "record" noun vs verb). There is no second distinct word to name in that case, so the blank is correct, not missing data.

Output ONLY the issues found, in this exact format (skip items with no issues — do not restate anything that's correct):

```
ISSUE [category]: <one-line location, e.g. "glossary item 4 (word)" or "E3 item 2">
  Problem: <what's wrong, be specific>
  Evidence: <quote the exact text/values involved>
```

If you find zero issues in a section, do not mention that section at all. Do not pad the output with commentary, summaries, or praise. If the topic is genuinely clean, just output: `NO ISSUES FOUND`.
