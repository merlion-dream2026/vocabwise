#!/usr/bin/env node
/**
 * Import QC'd Markdown back into phonicsKnowledge.json + phonicsLevels.json.
 *
 * Usage:
 *   node scripts/import-phonics.js [path/to/file.md] [--dry-run]
 *
 * Reads: exports/phonics-audit/phonics.md by default, or the path given as
 *   the first non-flag argument (e.g. exports/phonics-audit/phonics-fixes.md)
 * Writes: data/phonicsKnowledge.json, data/phonicsLevels.json
 *
 * Parses the format produced by scripts/export-phonics.js. Only lessons/fields
 * present in the MD are written back — omitted lessons and structural fields
 * in phonicsLevels.json (games, masteryGames, pairAudio, sounds, etc.) are
 * left untouched. This means a partial-diff file (only changed lessons, only
 * changed fields within them) works exactly like a full re-export.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const mdArg = process.argv.slice(2).find(a => !a.startsWith('--'));
const mdPath = mdArg ? path.resolve(mdArg) : path.join(ROOT, 'exports', 'phonics-audit', 'phonics.md');
const levelsPath = path.join(ROOT, 'data', 'phonicsLevels.json');
const knowledgePath = path.join(ROOT, 'data', 'phonicsKnowledge.json');

const mdText = fs.readFileSync(mdPath, 'utf8');
const levelsData = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));

// ── Parse MD into lesson blocks ───────────────────────────────────────────────

// Split on "---\n## LESSON:" markers (lesson separator)
// Keep the preamble but ignore it (level headers are cosmetic)
const lessonBlocks = [];
const lessonPattern = /^---\n## LESSON: ([^\n|]+)\s*\|\s*type:\s*(\S+)\s*\|[^\n]*$/m;

const parts = mdText.split(/^---$/m).map(s => s.trim()).filter(Boolean);

for (const part of parts) {
  const firstLine = part.split('\n')[0];
  const m = firstLine.match(/^## LESSON: ([^\|]+)\s*\|\s*type:\s*(\S+)/);
  if (!m) continue;

  const id = m[1].trim();
  const type = m[2].trim();
  lessonBlocks.push({ id, type, text: part });
}

console.log(`Parsed ${lessonBlocks.size || lessonBlocks.length} lesson blocks from MD`);

// ── Text helpers ──────────────────────────────────────────────────────────────

function extractSection(text, header) {
  // Matches from "### HEADER\n" to next "### " or end
  const re = new RegExp(`### ${header}\\n([\\s\\S]*?)(?=\\n### |$)`);
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function parseListField(block, fieldName) {
  // Matches "**fieldName:**\n- item\n- item"
  const re = new RegExp(`\\*\\*${escapeRe(fieldName)}:\\*\\*\\n((?:- [^\\n]+\\n?)+)`);
  const m = block.match(re);
  if (!m) return null;
  return m[1].trim().split('\n').map(l => l.replace(/^- /, '').trim()).filter(Boolean);
}

function parseInlineField(block, fieldName) {
  // Matches "**fieldName:** value on same line"
  const re = new RegExp(`\\*\\*${escapeRe(fieldName)}:\\*\\* (.+)`);
  const m = block.match(re);
  if (!m) return null;
  const value = m[1].trim();
  return value === 'undefined' ? null : value;
}

// Strip IPA notation e.g. "tree /triː/" → "tree"
function stripIPA(s) {
  return s.replace(/\s*\/[^/]+\//g, '').trim();
}

// Extract IPA from e.g. "tree /triː/" → "/triː/" (null if absent)
function extractIPA(s) {
  const m = s.trim().match(/\/([^/]+)\/$/);
  return m ? `/${m[1]}/` : null;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Parse spelling: "- pattern | ex1, ex2, ex3" ──────────────────────────────
function parseSpelling(block) {
  const re = /\*\*spelling:\*\*\n((?:- [^\n]+\n?)+)/;
  const m = block.match(re);
  if (!m) return null;

  return m[1].trim().split('\n').map(l => {
    const raw = l.replace(/^- /, '').trim();
    const pipeIdx = raw.indexOf(' | ');
    if (pipeIdx === -1) return null;
    const pattern = raw.slice(0, pipeIdx).trim();
    const rawExamples = raw.slice(pipeIdx + 3).split(',').map(s => s.trim()).filter(Boolean);
    const examples = rawExamples.map(s => stripIPA(s));
    const ipaList = rawExamples.map(s => extractIPA(s));
    const hasIPA = ipaList.some(x => x !== null);
    const entry = { pattern, examples };
    if (hasIPA) entry.examples_ipa = ipaList.map(x => x ?? '');
    return entry;
  }).filter(Boolean);
}

// ── Parse practice_sentences: "1. Sentence. [w1, w2]" ────────────────────────
function parseSentences(block) {
  const re = /\*\*practice_sentences:\*\*\n((?:\d+\. [^\n]+\n?)+)/;
  const m = block.match(re);
  if (!m) return null;

  return m[1].trim().split('\n').map(l => {
    const lineMatch = l.match(/^\d+\. (.+?)(?:\s+\[([^\]]+)\])?$/);
    if (!lineMatch) return null;
    const en = lineMatch[1].trim();
    const highlight = lineMatch[2] ? lineMatch[2].split(',').map(s => s.trim()).filter(Boolean) : [];
    return { en, highlight };
  }).filter(Boolean);
}

// ── Parse rhythm sentences: "1. Sentence. [stressed: w1, w2] [vi: ...]" ──────
function parseRhythmSentences(block) {
  const re = /\*\*sentences:\*\*\n((?:\d+\. [^\n]+\n?)+)/;
  const m = block.match(re);
  if (!m) return null;

  return m[1].trim().split('\n').map(l => {
    // Format: "N. En text [stressed: w1, w2] [vi: Vietnamese text]"
    const stressedMatch = l.match(/\[stressed: ([^\]]+)\]/);
    const viMatch = l.match(/\[vi: ([^\]]+)\]/);
    const enMatch = l.match(/^\d+\. (.+?)(?:\s+\[stressed:|$)/);
    if (!enMatch) return null;

    const en = enMatch[1].trim();
    const stressed = stressedMatch ? stressedMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
    const vi = viMatch ? viMatch[1].trim() : '';
    return { en, stressed, vi };
  }).filter(Boolean);
}

// ── Parse buckets ─────────────────────────────────────────────────────────────
function parseBuckets(bucketsSection) {
  if (!bucketsSection) return null;
  const buckets = [];
  const bucketBlocks = bucketsSection.split(/^#### BUCKET:/m).slice(1);

  for (const b of bucketBlocks) {
    const lines = b.trim().split('\n');
    const label = lines[0].trim();
    const obj = { label, condition: '', tip: '', words: [] };

    for (const l of lines.slice(1)) {
      if (l.startsWith('condition: ')) obj.condition = l.slice('condition: '.length).trim();
      else if (l.startsWith('tip: ')) obj.tip = l.slice('tip: '.length).trim();
      else if (l.startsWith('words: ')) obj.words = l.slice('words: '.length).split(' | ').map(s => stripIPA(s.trim())).filter(Boolean);
    }
    if (!obj.tip) delete obj.tip;
    buckets.push(obj);
  }
  return buckets;
}

// ── Build lookup: lesson id → lesson object in levelsData ────────────────────
const levelLessonMap = {};
for (const level of levelsData.levels) {
  for (const lesson of level.lessons) {
    levelLessonMap[lesson.id] = lesson;
  }
}

// ── Process each lesson block ─────────────────────────────────────────────────
let updatedKnowledge = 0;
let updatedLessons = 0;
const errors = [];

for (const { id, type, text } of lessonBlocks) {
  const kSection = extractSection(text, 'KNOWLEDGE');
  const practiceSection = extractSection(text, 'PRACTICE');
  const bucketsSection = extractSection(text, 'BUCKETS');

  // ── Update phonicsKnowledge.json ───────────────────────────────────────────
  if (kSection) {
    const entry = knowledgeData[id] || {};

    if (type === 'rule' || type === 'rhythm') {
      const why = parseInlineField(kSection, 'why');
      if (why !== null) entry.why = why;

      const how_to = parseListField(kSection, 'how_to');
      if (how_to) entry.how_to = how_to;

      const exceptions = parseListField(kSection, 'exceptions');
      if (exceptions) entry.exceptions = exceptions;

      const vs = parseInlineField(kSection, 'vs_vietnamese');
      if (vs !== null) entry.vs_vietnamese = vs;
    } else {
      // pair / consonant / challenge type
      const how_to = parseListField(kSection, 'how_to');
      if (how_to) entry.how_to = how_to;

      const vs = parseInlineField(kSection, 'vs_vietnamese');
      if (vs !== null) entry.vs_vietnamese = vs;

      const spelling = parseSpelling(kSection);
      if (spelling) entry.spelling = spelling;

      const mistakes = parseListField(kSection, 'mistakes');
      if (mistakes) entry.mistakes = mistakes;

      const mnemonic = parseInlineField(kSection, 'mnemonic');
      if (mnemonic !== null) entry.mnemonic = mnemonic;
    }

    knowledgeData[id] = entry;
    updatedKnowledge++;
  }

  // ── Update phonicsLevels.json ──────────────────────────────────────────────
  const lesson = levelLessonMap[id];
  if (!lesson) {
    errors.push(`Lesson not found in phonicsLevels.json: ${id}`);
    continue;
  }

  if (practiceSection) {
    if (type === 'rhythm') {
      const rhythmSentences = parseRhythmSentences(practiceSection);
      if (rhythmSentences) lesson.sentences = rhythmSentences;
    } else {
      const tip = parseInlineField(practiceSection, 'tip');
      if (tip !== null) lesson.tip = tip;

      const pwLine = parseInlineField(practiceSection, 'practice_words');
      if (pwLine !== null) {
        const rawWords = pwLine.split(',').map(s => s.trim()).filter(Boolean);
        lesson.practice_words = rawWords.map(s => stripIPA(s));
        const ipaList = rawWords.map(s => extractIPA(s));
        if (ipaList.some(x => x !== null)) {
          lesson.practice_words_ipa = ipaList.map(x => x ?? '');
        } else {
          delete lesson.practice_words_ipa;
        }
      }

      const sentences = parseSentences(practiceSection);
      if (sentences) lesson.practice_sentences = sentences;
    }

    updatedLessons++;
  }

  if (bucketsSection) {
    const incoming = parseBuckets(bucketsSection);
    if (incoming) {
      // Merge per bucket label instead of replacing the whole array — GPT audit
      // output often omits `words`/`condition`/`tip` for buckets it didn't change,
      // which must fall back to the existing value, not become empty.
      const existingByLabel = {};
      for (const b of (lesson.buckets || [])) existingByLabel[b.label] = b;

      const seenLabels = new Set();
      const merged = incoming.map(inc => {
        seenLabels.add(inc.label);
        const cur = existingByLabel[inc.label] || {};
        const obj = { label: inc.label, condition: inc.condition || cur.condition || '' };
        const tip = inc.tip !== undefined ? inc.tip : cur.tip;
        if (tip) obj.tip = tip;
        obj.words = (inc.words && inc.words.length) ? inc.words : (cur.words || []);
        return obj;
      });
      for (const b of (lesson.buckets || [])) {
        if (!seenLabels.has(b.label)) merged.push(b);
      }
      lesson.buckets = merged;
    }
    updatedLessons++;
  }
}

// ── Write output ──────────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('DRY RUN — no files written');
} else {
  fs.writeFileSync(knowledgePath, JSON.stringify(knowledgeData, null, 2), 'utf8');
  fs.writeFileSync(levelsPath, JSON.stringify(levelsData, null, 2), 'utf8');
}

console.log(`✅ Updated knowledge entries: ${updatedKnowledge}`);
console.log(`✅ Updated level lessons: ${updatedLessons}`);
if (errors.length) {
  console.error('\n⚠️  Errors:');
  errors.forEach(e => console.error(' -', e));
}
if (DRY_RUN) console.log('\n(dry run — rerun without --dry-run to write)');
