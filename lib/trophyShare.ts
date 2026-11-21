import { createHmac, timingSafeEqual } from 'crypto'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { DAILY_LEVEL_ORDER } from '@/lib/childProgress'
import { isMascotCharacter, type MascotCharacter } from '@/lib/mascots'

// "Topic conquered" share links: /c/{token}. The token carries the few facts the card shows and is
// HMAC-signed, so the public page and its images can only ever show a card our server issued (no
// arbitrary text rendered on our domain). Stateless — nothing stored in the DB.

export const CEFR: Record<string, string> = {
  seeker: 'Pre-A1', starter: 'A1', ranger: 'A2', explorer: 'B1', scholar: 'B2', master: 'C1',
}

type Payload = {
  n: string        // child's name
  l: string        // Daily level id
  t: string        // topicId
  m: 'r' | 'b'     // mascot
  d: string        // date conquered, YYYY-MM-DD (Vietnam time)
  r?: string       // family referral code → CTA goes through /r/{code}
}

export type TrophyCard = {
  childName: string
  level: string
  levelLabel: string
  topicName: string      // Vietnamese (data/words)
  topicNameEn: string    // English (data/daily-topic-names-en.json); falls back to topicName
  topicEmoji: string
  wordCount: number
  mascot: MascotCharacter
  date: string        // DD/MM/YYYY
  referralCode?: string
}

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET missing')
  return s
}

const sign = (body: string) =>
  createHmac('sha256', `trophy-share:${secret()}`).update(body).digest('base64url').slice(0, 22)

export function createTrophyToken(p: { name: string; level: string; topicId: string; mascot: MascotCharacter; referralCode?: string | null }): string {
  const d = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
  const payload: Payload = { n: p.name.trim().slice(0, 24), l: p.level, t: p.topicId, m: p.mascot === 'bubi' ? 'b' : 'r', d }
  if (p.referralCode) payload.r = p.referralCode
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

function verify(token: string): Payload | null {
  const [body, mac] = token.split('.')
  if (!body || !mac || token.length > 400) return null
  const want = Buffer.from(sign(body))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload
    return typeof p.n === 'string' && typeof p.l === 'string' && typeof p.t === 'string' ? p : null
  } catch { return null }
}

type LevelFile = { topics: { id: string; name: string; emoji: string; words: unknown[] }[] }

export async function findDailyTopic(level: string, topicId: string) {
  if (!(DAILY_LEVEL_ORDER as readonly string[]).includes(level) || !/^[a-z0-9-]{1,60}$/.test(topicId)) return null
  const raw = await readFile(join(process.cwd(), 'data', 'words', `${level}.json`), 'utf-8')
  const t = (JSON.parse(raw) as LevelFile).topics.find((x) => x.id === topicId)
  if (!t) return null
  enNamesP ??= readFile(join(process.cwd(), 'data', 'daily-topic-names-en.json'), 'utf-8')
    .then((s) => JSON.parse(s) as Record<string, Record<string, string>>)
  const en = (await enNamesP)[level]?.[topicId]
  return { name: t.name, nameEn: en ?? t.name, emoji: t.emoji, wordCount: t.words.length }
}

// English topic titles, keyed level → topicId (topic ids repeat across levels with different scope).
let enNamesP: Promise<Record<string, Record<string, string>>> | null = null

// /c/demo — fixed sample card for testing link previews and for marketing.
const DEMO: Payload = { n: 'Mia', l: 'starter', t: 'time', m: 'b', d: '2026-11-21' }

export async function loadTrophyCard(token: string): Promise<TrophyCard | null> {
  const p = token === 'demo' ? DEMO : verify(decodeURIComponent(token))
  if (!p) return null
  const topic = await findDailyTopic(p.l, p.t)
  if (!topic) return null
  const [y, mo, da] = p.d.split('-')
  const mascot = p.m === 'b' ? 'bubi' : 'rocky'
  return {
    childName: p.n,
    level: p.l,
    levelLabel: CEFR[p.l] ?? p.l,
    topicName: topic.name,
    topicNameEn: topic.nameEn,
    topicEmoji: topic.emoji,
    wordCount: topic.wordCount,
    mascot: isMascotCharacter(mascot) ? mascot : 'rocky',
    date: `${da}/${mo}/${y}`,
    referralCode: p.r && /^[A-Z0-9]{6,8}$/.test(p.r) ? p.r : undefined,
  }
}
