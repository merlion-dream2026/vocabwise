# Pronunciation thresholds plan (VocabWise + AXANH Global English)

Approved by Andie 2026-10-30. Same plan in both repos (`docs/pronunciation-thresholds-plan.md`).

## Context
- Both apps score pronunciation with **Azure Pronunciation Assessment**, sharing one F0 key
  (Andie's Azure account, resource `axanh-speech`, region southeastasia: ~5 audio h/month,
  1 concurrent request). Busy / over quota / not configured → automatic fallback to Whisper + string match.
- Current bars are **first guesses**, not calibrated:
  - AXANH (`lib/pronunciationScore.ts`): pronScore ≥ 70, headword words ≥ 60, completeness ≥ 70.
  - VocabWise (`lib/pronunciationScore.ts`, `barFor(level)`):
    | Level | pron | key word / sound | completeness |
    |---|---|---|---|
    | seeker/starter/ranger + phonics | 60 | 50 | 60 |
    | explorer (default) | 65 | 55 | 65 |
    | scholar/master | 70 | 60 | 70 |
  - VocabWise Phonics judges the lesson's own sounds (British IPA → Azure en-US IPA via `azurePhonemes()`).
- Score logs: AXANH `ax_events` (type `pronounce_transcribe`, `meta.engine = 'azure'`);
  VocabWise `pronunciation_log` (one row per Azure-scored clip).

## Goal / targets
- False accept (said it wrong, passed) ≤ 10 %; false reject (said it right, failed) ≤ 15 % (≤ 10 % for kids).
- First-try pass rate 60–80 % per level (challenging, not discouraging).

## Decisions (Andie)
- Golden set: adults (Andie + 1–2 teachers) **and** 3–5 kids with parental consent (VocabWise).
- **Do not store learners' audio** — scores only. Ground truth comes from the golden set + the dispute button.
- Build now, in both apps:
  1. **"Con đọc đúng mà" button** — shown under a failed result; logs a dispute (false-reject signal) with the scores.
  2. **Thresholds editable in admin** (no deploy): AXANH `/admin/settings` (`ax_settings`), VocabWise superadmin.
     Code keeps today's values as defaults.
  3. **Kinder bars for sounds hard for Vietnamese learners** at low levels, tightening with level:
     θ ð, final consonants (p t k b d g s z), ʒ, l/n, iː/ɪ, æ/e, ʃ/s, v/w (VocabWise phonics + young levels;
     AXANH by learner level if available).
  4. **Golden-set script**: folder of labelled recordings (`<item>__correct.m4a` / `<item>__wrong-<type>.m4a`)
     → convert to 16 kHz WAV → Azure → CSV (scores per clip/word/phoneme) + suggested bars that best separate
     correct vs wrong (min false accept + false reject), per group (adult / kid).

## Built in VocabWise (2026-10-30)
| Piece | Where |
|---|---|
| Bars + hard-sound allowance (pure) | `lib/pronunciationScore.ts`: `DEFAULT_BARS`, `sanitizeBars`, `wordOk`, `isHardSound`; `passes` / `markWords` / `phonicsVerdict` take `bars` |
| Admin-editable bars | `admin_config` key `pronunciation_bars` (JSON) via `lib/pronunciationBars.ts` (60 s cache) · Superadmin → Cài đặt → **Ngưỡng chấm phát âm** (`/api/superadmin/pronunciation`): edit, reset to defaults, 30-day pass + dispute rate per group, latest 20 disputes |
| Hard sounds | allowance `hard` = points off the word/sound bar (default young 10 · mid 5 · ielts 0) when every sound below the bar is θ ð ʒ l n i ɪ æ ɛ ʃ s v w or word-final p t k b d g s z. Phonics: no allowance when Azure heard the other lesson sound (sheep → ship) |
| Dispute | "Con đọc đúng mà" under a failed Azure result (SpeakGame, PhonicsSpeak) → `/api/score-pronunciation/dispute` sets `pronunciation_log.disputed_at`; verdict unchanged. Quick record button: none (too small) |
| Log | `pronunciation_log` + `grp`, `detail` (per-word + phoneme scores, no audio), `disputed_at` — migration `20261030100000_pronunciation_log_dispute.sql` (apply in SQL Editor). Phonics sends `targets`/`symbols` so the logged verdict = the sound-level verdict the kid sees |
| Golden-set script | `scripts/pron-golden-set.mjs` (below) |

### Golden set — how to record and run
- Folder (e.g. on Drive): `adult/` and `kid/` subfolders; file names `<item>__correct.m4a`, `<item>__wrong-<error>.m4a`
  (e.g. `think__wrong-sink.m4a`); several takes: `think__correct-2.m4a`. Phone voice memos are fine.
- Optional `items.csv`: `item,text,keyword,level,symbols,targets` — text = what is read (e.g. `I think so.`),
  Phonics items add `symbols` `iː|ɪ` + `targets` `sheep`. Without it the item name is the text.
- Run: `node --env-file=.env.local scripts/pron-golden-set.mjs <folder> [--bars bars.json]`
  (needs ffmpeg; the shared Azure key is in `.env.local` since 2026-10-30).
- Output `<folder>/results/`: `clips.csv`, `phonemes.csv`, `suggest.md` (current FA/FR + suggested bar per metric per group).
  Azure answers are cached in `results/raw/` → reruns only spend quota on new clips.
- Smoke test with 4 macOS TTS clips (2026-10-30): sheep/ship separated only by the /i/ phoneme score (23 vs 100;
  overall score 98 vs 99), but "I sink so" scored /θ/ 100 against reference "I think so" → overall/word scores
  alone don't catch every substitution; the real golden set must check θ→s, ʃ→s, final-consonant drops.

## Steps
| Step | Who | What | When |
|---|---|---|---|
| 1. Golden set | Andie + teachers (+ kids) | ~40 items, each read correctly and with a typical Vietnamese error; run the script | 1 session |
| 2. Live data | automatic | after 2–4 weeks or ~300 attempts per level group: first-try pass rate, score distributions, hardest words/sounds, dispute rate | 2–4 weeks |
| 3. Tune | Claude proposes, Andie approves | old vs new bars table with data → change in admin | monthly, first quarter |

## Notes
- VocabWise Supabase migration history differs from the repo (16 remote-only 2026-06..08 migrations):
  `supabase db push` refuses; apply new SQL via the SQL Editor until that is repaired (separate task).
- Watch shared F0 usage; consider Standard S0 (check current Azure pricing) when fallbacks to Whisper become frequent.
