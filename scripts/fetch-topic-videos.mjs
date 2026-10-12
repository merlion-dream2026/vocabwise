#!/usr/bin/env node
// Finds YouTube video candidates for every Daily + Academic topic (YouTube Data API v3) and writes
// a review page where the picks can be ticked and exported as data/videos/videos.json.
//
//   node scripts/fetch-topic-videos.mjs            # fetch topics not yet in candidates.json, then build review.html
//   node scripts/fetch-topic-videos.mjs --review   # only rebuild review.html from candidates.json
//   node scripts/fetch-topic-videos.mjs --only=seeker,b1   # limit to some levels / books
//   node scripts/fetch-topic-videos.mjs --retry-thin       # re-search topics with < 3 videos using a broader query
//   node scripts/fetch-topic-videos.mjs --refetch-weak     # re-search topics whose saved picks are < 3 (after cleanup)
//   node scripts/fetch-topic-videos.mjs --extra="daily/ranger/pets::pet song for kids||my pet vocabulary"
//                                                          # add the top 4 finds of each hand-picked query to one topic (up to 40)
//   node scripts/fetch-topic-videos.mjs --serve            # open the review page on localhost; "Lưu" writes data/videos/videos.json
//
// Needs YOUTUBE_API_KEY in .env.local. Quota: 10,000 units/day free; each topic costs ~101
// (search 100 + videos.list 1), so ~95 topics/day — the script stops cleanly on quotaExceeded and
// resumes where it left off on the next run (progress is saved after every topic).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { createServer } from 'http'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'data', 'videos')
const CANDIDATES = join(OUT_DIR, 'candidates.json')
const REVIEW = join(OUT_DIR, 'review.html')
const VIDEOS = join(OUT_DIR, 'videos.json')
const PORT = 4321
const PER_TOPIC = 8 // candidates kept per topic (top 3 pre-ticked in the review page)

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local — rely on the shell env */ }

// ─── Trusted channels (matched on channel title, case-insensitive substring) ──
// kids = Pre-A1→A2 (Daily seeker/starter/ranger); youth = Daily explorer/scholar/master (still
// school-age learners: kid/teen-friendly explainers, never business/exam prep); academic = the
// Academic books (teen/adult, exam vocabulary is fine). TED-Ed left out on purpose (too hard).
const CHANNELS = {
  kids: [
    'super simple', 'dream english', 'maple leaf learning', 'learnenglish kids', 'british council',
    'english singsing', 'little fox', 'scratch garden', 'jack hartmann', 'bounce patrol',
    'kids vs phonics', 'fun kids english', 'pinkfong', 'sesame street', 'learn english with tv series',
    'cambridge english', 'peekaboo kidz', 'scishow kids', 'national geographic kids', 'oxford owl',
  ],
  youth: [
    'bbc learning english', 'learnenglish teens', 'british council', 'voa learning english',
    'english singsing', 'peekaboo kidz', 'scishow kids', 'crash course kids', 'national geographic kids',
    'free school', 'smile and learn', 'homeschool pop', 'learn bright', 'clarendon learning',
    'happy learning', 'kids academy', 'oxford owl', 'simple english videos',
  ],
  academic: [
    'bbc learning english', 'learnenglish teens', 'british council', 'cambridge english',
    'voa learning english', 'english singsing', 'easy english', 'scishow kids', 'crash course kids',
    'national geographic kids', 'peekaboo kidz', 'free school', 'oxford owl', 'learn english with emma',
    'english with lucy', 'mmmenglish', 'simple english videos', 'learn english with bob the canadian',
  ],
}
const MIN_SEC = 60
const MAX_SEC = { kids: 12 * 60, youth: 15 * 60, academic: 15 * 60 }

// Off-level for school-age learners (Daily, every band): adult/business/exam-prep material.
const ADULT = /marketing|business english|business vocab|corporate|career|job interview|invest|crypto|stock market|startup idea|entrepreneur|dating|red flags|leadership|\bmba\b|podcast|\btax|psycholog(ical|y) test|narcissis/i
const EXAM = /ielts|toefl|toeic|\bpte\b|band \d/i
// Titles in another script (Arabic, Cyrillic, Hindi, CJK, Korean) = not an English lesson.
const NON_LATIN = /[\u0600-\u06FF\u0400-\u04FF\u0900-\u097F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/
// Untrusted videos for youth must look aimed at learners/young people (otherwise e.g. a TED talk wins).
const YOUTH_SIGNAL = /kids|children|students|teens|for beginners|explained|esl|learn english|vocabulary|for school|science for/i
const MIN_VIEWS_UNTRUSTED = 50_000 // a non-whitelisted channel must at least be popular

// ─── Topics ───────────────────────────────────────────────────────────────────
const DAILY_LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']
const KIDS_LEVELS = new Set(['seeker', 'starter', 'ranger'])

function loadTopics() {
  const topics = []
  for (const level of DAILY_LEVELS) {
    const { topics: list } = JSON.parse(readFileSync(join(ROOT, 'data', 'words', `${level}.json`), 'utf8'))
    for (const t of list) {
      const subject = t.id.replace(/-/g, ' ')
      const band = KIDS_LEVELS.has(level) ? 'kids' : 'youth'
      topics.push({
        key: `daily/${level}/${t.id}`, group: level, band,
        label: `${t.emoji ?? ''} ${t.name} (${t.id})`,
        query: band === 'kids' ? `${subject} vocabulary for kids English` : `${subject} explained for kids and teens`,
        broadQuery: band === 'kids' ? `${subject} for kids` : `${subject} for students English`,
      })
    }
  }
  for (const book of [1, 2, 3]) {
    const dir = join(ROOT, 'data', 'vocabwise', `book${book}`)
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      const { meta } = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      topics.push({
        key: `academic/${meta.topic_id}`, group: `b${book}`, band: 'academic',
        label: `${meta.emoji ?? ''} ${meta.topic_title} — ${meta.topic_title_vi ?? ''} (${meta.topic_id}, ${meta.cefr_level})`,
        query: `${meta.topic_title} English vocabulary lesson`,
        broadQuery: `${meta.topic_title} explained for students`,
      })
    }
  }
  return topics
}

// ─── YouTube API ──────────────────────────────────────────────────────────────
class QuotaError extends Error {}

async function yt(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  for (const [k, v] of Object.entries({ ...params, key: process.env.YOUTUBE_API_KEY })) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason
    // Daily quota surfaces either as 403 quotaExceeded or as 429 "Quota exceeded … per day".
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || /quota exceeded/i.test(body?.error?.message ?? '')) throw new QuotaError(reason)
    throw new Error(`${endpoint} ${res.status}: ${body?.error?.message}`)
  }
  return body
}

// ISO 8601 duration (PT1H2M3S) → seconds
function isoSec(d) {
  const m = d?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0
}

const trusted = (band, channel) => CHANNELS[band].some(c => channel.toLowerCase().includes(c.toLowerCase()))

async function fetchTopic(t, q = t.query) {
  const search = await yt('search', {
    part: 'snippet', q, type: 'video', maxResults: 50, safeSearch: 'strict',
    videoEmbeddable: 'true', videoSyndicated: 'true', relevanceLanguage: 'en',
  })
  const ids = search.items.map(i => i.id.videoId).filter(Boolean)
  if (!ids.length) return []
  const details = await yt('videos', { part: 'snippet,contentDetails,status,statistics', id: ids.join(',') })
  const vids = details.items
    .filter(v => v.status.embeddable && v.status.privacyStatus === 'public')
    .filter(v => !(v.contentDetails.regionRestriction?.blocked ?? []).includes('VN'))
    .filter(v => !/#shorts/i.test(v.snippet.title))
    .map(v => ({
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      sec: isoSec(v.contentDetails.duration),
      views: +(v.statistics.viewCount ?? 0),
      trusted: trusted(t.band, v.snippet.channelTitle),
      rank: ids.indexOf(v.id), // YouTube's relevance order for this query
    }))
    .filter(v => v.sec >= MIN_SEC && v.sec <= MAX_SEC[t.band])
    .filter(v => v.trusted || v.views >= MIN_VIEWS_UNTRUSTED)
    .filter(v => !NON_LATIN.test(v.title))
    .filter(v => t.band === 'academic' || v.trusted || !(ADULT.test(`${v.title} ${v.channel}`) || EXAM.test(v.title)))
    .filter(v => t.band !== 'youth' || v.trusted || YOUTH_SIGNAL.test(v.title))
  // Whitelisted channels first, then YouTube's relevance order (sorting by views pulled in popular
  // but off-topic videos); at most 2 videos per channel for variety.
  vids.sort((a, b) => (+b.trusted - +a.trusted) || a.rank - b.rank)
  const perChannel = {}
  return vids.filter(v => (perChannel[v.channel] = (perChannel[v.channel] ?? 0) + 1) <= 2).slice(0, PER_TOPIC)
}

// ─── Review page ──────────────────────────────────────────────────────────────
function buildReview(topics, cand, picked = {}) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const sections = topics.filter(t => cand[t.key]).map(t => {
    const vids = cand[t.key]
    const mine = picked[t.key]?.map(p => p.id)
    const rows = vids.map((v, i) => `
      <label class="v">
        <input type="checkbox" data-key="${esc(t.key)}" data-v="${esc(JSON.stringify({ id: v.id, title: v.title, channel: v.channel, sec: v.sec }))}" ${(mine ? mine.includes(v.id) : i < 3) ? 'checked' : ''}>
        <img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg">
        <span><a href="https://www.youtube.com/watch?v=${v.id}" target="_blank">${esc(v.title)}</a><br>
        <small>${v.trusted ? '✅' : '⚠️'} ${esc(v.channel)} · ${mmss(v.sec)} · ${v.views.toLocaleString('en')} views</small></span>
      </label>`).join('')
    return `<section data-group="${t.group}"><h3>${esc(t.label)} <small class="n"></small></h3>${rows || '<p>Không tìm được video phù hợp</p>'}</section>`
  }).join('')
  const groups = [...new Set(topics.map(t => t.group))]
  return `<!doctype html><meta charset="utf-8"><title>Review topic videos</title>
<style>
body{font:14px system-ui;margin:0;background:#f8fafc}header{position:sticky;top:0;background:#fff;padding:10px 16px;border-bottom:1px solid #ddd;display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:1}
main{max-width:900px;margin:auto;padding:16px}section{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:12px}
h3{margin:0 0 8px}.v{display:flex;gap:10px;align-items:center;padding:4px 0}.v img{width:120px;border-radius:6px}a{color:#1d4ed8}
.bad{color:#dc2626}button{padding:6px 12px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}button.main{background:#2563eb;color:#fff;border:0}
</style>
<header><b>Chọn đúng 3 video / topic (✅ = kênh trong whitelist, ⚠️ = kênh ngoài, cần xem kỹ)</b>
<select id="g"><option value="">Tất cả</option>${groups.map(g => `<option>${g}</option>`).join('')}</select>
<span id="sum"></span><button class="main" id="dl">💾 Lưu lựa chọn</button><span id="msg"></span></header>
<main>${sections}</main>
<script>
const boxes=[...document.querySelectorAll('input[type=checkbox]')]
function refresh(){let bad=0;document.querySelectorAll('section').forEach(s=>{const n=s.querySelectorAll('input:checked').length;const el=s.querySelector('.n');el.textContent='('+n+'/3)';el.className='n'+(n===3?'':' bad');if(n!==3)bad++});document.getElementById('sum').textContent=bad?bad+' topic chưa đủ 3 video':'Tất cả đủ 3 video'}
boxes.forEach(b=>b.onchange=refresh);refresh()
document.getElementById('g').onchange=e=>document.querySelectorAll('section').forEach(s=>s.style.display=!e.target.value||s.dataset.group===e.target.value?'':'none')
window.onerror=(m)=>{document.getElementById('msg').textContent='❌ '+m};document.getElementById('dl').onclick=async()=>{const out={};boxes.filter(b=>b.checked).forEach(b=>(out[b.dataset.key]??=[]).push(JSON.parse(b.dataset.v)));const m=document.getElementById('msg');try{const r=await fetch('/save',{method:'POST',body:JSON.stringify(out)});m.textContent=r.ok?'✅ Đã lưu '+Object.keys(out).length+' topic vào data/videos/videos.json':'❌ Lỗi lưu'}catch{m.textContent='❌ Mở trang qua: node scripts/fetch-topic-videos.mjs --serve'}}
</script>`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const only = args.find(a => a.startsWith('--only='))?.slice(7).split(',')
let topics = loadTopics()
if (only) topics = topics.filter(t => only.includes(t.group))

mkdirSync(OUT_DIR, { recursive: true })
const picked = () => (existsSync(VIDEOS) ? JSON.parse(readFileSync(VIDEOS, 'utf8')) : {})
const cand = existsSync(CANDIDATES) ? JSON.parse(readFileSync(CANDIDATES, 'utf8')) : {}

const extra = args.find(a => a.startsWith('--extra='))?.slice(8)
if (extra) {
  if (!process.env.YOUTUBE_API_KEY) { console.error('Missing YOUTUBE_API_KEY in .env.local'); process.exit(1) }
  const [key, qs] = extra.split('::')
  const t = loadTopics().find(x => x.key === key)
  if (!t || !qs) { console.error(`Usage: --extra="<topic key>::query1||query2" (unknown key: ${key})`); process.exit(1) }
  for (const q of qs.split('||')) {
    try {
      const have = cand[key] ?? []
      // Top 4 per query so every query gets a say; whole topic capped at 40.
      const found = (await fetchTopic(t, q)).filter(v => !have.some(h => h.id === v.id)).slice(0, 4)
      cand[key] = [...have, ...found].slice(0, 40)
      writeFileSync(CANDIDATES, JSON.stringify(cand, null, 1))
      console.log(`${q} → +${found.length}`)
    } catch (e) {
      if (e instanceof QuotaError) { console.log('Quota hết — chạy lại sau 14:00.'); break }
      console.error(`${q}: ${e.message}`)
    }
  }
} else if (!args.includes('--review')) {
  if (!process.env.YOUTUBE_API_KEY) { console.error('Missing YOUTUBE_API_KEY in .env.local'); process.exit(1) }
  const retry = args.includes('--retry-thin')
  const weak = args.includes('--refetch-weak') // saved picks < 3 after review → search again with today's filters
  const saved = picked()
  const todo = topics.filter(t => weak ? cand[t.key] && (saved[t.key]?.length ?? 0) < 3
    : retry ? cand[t.key] && cand[t.key].length < 3 : !cand[t.key])
  console.log(`${topics.length - todo.length}/${topics.length} topics already fetched, ${todo.length} to go`)
  let done = 0
  for (const t of todo) {
    try {
      if (weak) {
        // Fresh results (new filters) first; old candidates that still pass stay below them.
        const fresh = await fetchTopic(t)
        cand[t.key] = [...fresh, ...cand[t.key].filter(v => !fresh.some(f => f.id === v.id))].slice(0, PER_TOPIC * 2)
      } else if (retry) {
        // Keep what we had, append new finds from the broader query (no duplicates).
        const have = cand[t.key]
        const extra = (await fetchTopic(t, t.broadQuery)).filter(v => !have.some(h => h.id === v.id))
        cand[t.key] = [...have, ...extra].slice(0, PER_TOPIC)
      } else {
        cand[t.key] = await fetchTopic(t)
      }
    } catch (e) {
      if (e instanceof QuotaError) { console.log(`\nQuota hết sau ${done} topic — chạy lại ngày mai để làm tiếp.`); break }
      console.error(`\n${t.key}: ${e.message}`); continue
    }
    writeFileSync(CANDIDATES, JSON.stringify(cand, null, 1))
    done++
    process.stdout.write(`\r${done}/${todo.length} ${t.key.padEnd(40)} → ${cand[t.key].length} video`)
  }
  console.log()
}

// The review page always covers every fetched topic, whatever --only was; ticks follow the saved
// videos.json where a topic was already reviewed.
writeFileSync(REVIEW, buildReview(loadTopics(), cand, picked()))

if (args.includes('--serve')) {
  // Browsers block downloads from file:// pages, so the page posts its picks here instead.
  createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/save') {
      let body = ''
      req.on('data', c => { body += c })
      req.on('end', () => {
        try {
          // Merge: topics not on the page (or not reviewed yet) keep their saved picks.
          const merged = { ...picked(), ...JSON.parse(body) }
          writeFileSync(VIDEOS, JSON.stringify(merged, null, 1) + '\n')
          console.log(`Saved ${Object.keys(merged).length} topics → ${VIDEOS}`)
          res.writeHead(200).end('ok')
        } catch (e) { res.writeHead(400).end(String(e)) }
      })
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(buildReview(loadTopics(), cand, picked()))
  }).listen(PORT, '127.0.0.1', () => {
    console.log(`Review: http://localhost:${PORT}  (Ctrl+C để tắt)`)
    exec(`open http://localhost:${PORT}`)
  })
}
const empty = topics.filter(t => cand[t.key] && cand[t.key].length < 3).map(t => t.key)
console.log(`Review: ${REVIEW}`)
if (empty.length) console.log(`${empty.length} topic có < 3 video: ${empty.slice(0, 10).join(', ')}${empty.length > 10 ? '…' : ''}`)
