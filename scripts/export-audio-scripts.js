/**
 * Export stories as DOCX files for ElevenLabs TTS production
 * One file per level — only topics that need new/regenerated audio
 * Output: exports/audio-scripts/[level]-audio-script.docx
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

const storiesPath = path.join(__dirname, '../data/stories.json');
const wordsPath = path.join(__dirname, '../data/words.json');
const outDir = path.join(__dirname, '../exports/audio-scripts');

const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const wordData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

fs.mkdirSync(outDir, { recursive: true });

// ─── Topics needing audio per level ──────────────────────────────────────────

const AUDIO_NEEDED = {
  seeker: [
    'everyday-food'
  ],
  starter: [
    'animals', 'food', 'toys', 'school', 'fruits-vegetables',
    'daily-routine', 'parties-celebrations', 'outdoor-nature', 'sea',
    'music', 'nature', 'princess-magic', 'describing-things',
    'city-places', 'cooking'
  ],
  explorer: [
    'science', 'sports-competition', 'achievement', 'laboratory',
    'critical-thinking', 'engineering', 'architecture', 'mission',
    'environment', 'climate-change', 'communication', 'music-performance',
    'digital-life', 'history', 'business-startup', 'global-issues',
    'art-creativity'
  ],
  scholar: null,  // null = all 30
  master: null    // null = all 30
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanText(text) {
  return text.replace(/\*\*/g, '').trim();
}

function titleCase(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getTopicIds(level) {
  if (AUDIO_NEEDED[level] !== null) return AUDIO_NEEDED[level];
  return wordData[level].topics.map(t => t.id);
}

// ─── Build DOCX for one level ─────────────────────────────────────────────────

function buildDoc(level) {
  const topicIds = getTopicIds(level);
  const levelLabel = titleCase(level) + ' Level';

  const children = [];

  // ── Document title
  children.push(
    new Paragraph({
      text: `VocabWise ${levelLabel} — Audio Scripts`,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${topicIds.length} stories · English text only · Strip **bold markers** before pasting into ElevenLabs`,
          italics: true,
          color: '666666',
          size: 20,
        })
      ],
      spacing: { after: 600 },
    })
  );

  topicIds.forEach((topicId, i) => {
    const key = `${level}.${topicId}`;
    const story = stories[key];

    if (!story) {
      console.warn(`  ⚠ No story found for: ${key}`);
      return;
    }

    const topicLabel = titleCase(topicId);
    const filename = `${level}.${topicId}.mp3`;
    const storyText = cleanText(story.en);

    // ── Separator line (except first)
    if (i > 0) {
      children.push(
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
          spacing: { before: 400, after: 0 },
          text: '',
        })
      );
    }

    // ── Topic heading (number + name)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${String(i + 1).padStart(2, '0')}. ${topicLabel}`,
            bold: true,
            size: 28,
            color: '1A1A2E',
          })
        ],
        spacing: { before: 320, after: 80 },
      })
    );

    // ── File label
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Audio file: ', size: 18, color: '888888', italics: true }),
          new TextRun({ text: filename, size: 18, color: '2563EB', bold: true, italics: true }),
        ],
        spacing: { after: 160 },
      })
    );

    // ── Story text
    children.push(
      new Paragraph({
        children: [new TextRun({ text: storyText, size: 24 })],
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  });

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 }
        }
      },
      children
    }]
  });
}

// ─── Generate all files ───────────────────────────────────────────────────────

const levels = Object.keys(AUDIO_NEEDED);

async function main() {
  console.log('\n=== Exporting audio script DOCX files ===\n');

  for (const level of levels) {
    const topicIds = getTopicIds(level);
    const doc = buildDoc(level);
    const buf = await Packer.toBuffer(doc);
    const outPath = path.join(outDir, `${level}-audio-script.docx`);
    fs.writeFileSync(outPath, buf);
    console.log(`  ✅ ${level}-audio-script.docx  (${topicIds.length} stories)`);
  }

  console.log(`\n✅ All files saved to: exports/audio-scripts/\n`);
  console.log('📂 Totals:');
  levels.forEach(l => {
    const n = getTopicIds(l).length;
    console.log(`   ${l}: ${n} stories`);
  });
  console.log(`   TOTAL: ${levels.reduce((s, l) => s + getTopicIds(l).length, 0)} stories`);
}

main().catch(e => { console.error(e); process.exit(1); });
