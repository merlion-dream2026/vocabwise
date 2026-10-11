// One-off: spread each child-level's overdue Daily SRS backlog (vocab_sync.srs) over the coming
// days, so nobody faces "2,000 từ cần ôn". Before the 2026-10 SRS fix every first-seen word was
// due the same day and only the SRS page ever moved a word on, so seen words piled up as due.
//
// For every vocab_sync row: take the entries due today or earlier, most overdue first, and give
// them due dates today, tomorrow, … at PER_DAY words a day — PER_DAY = max(20, ⌈backlog/30⌉), so a
// backlog never stretches past 30 days. Only `due` changes (interval and ef stay), nothing is deleted.
//
// Usage:
//   node --env-file=.env.local scripts/spread-srs-backlog.mjs           # dry run: stats only
//   node --env-file=.env.local scripts/spread-srs-backlog.mjs --apply   # write
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const MIN_PER_DAY = 20
const MAX_DAYS = 30

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const vnDate = (days = 0) => new Date(Date.now() + 7 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10)
const today = vnDate()

const rows = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('vocab_sync').select('id, child_id, level, srs').range(from, from + 999)
  if (error) throw error
  rows.push(...data)
  if (data.length < 1000) break
}

let touched = 0, movedWords = 0, totalDue = 0
const biggest = []
for (const row of rows) {
  const srs = row.srs ?? {}
  const due = Object.entries(srs).filter(([, e]) => (e?.due ?? '') <= today).sort(([, a], [, b]) => (a.due < b.due ? -1 : 1))
  totalDue += due.length
  if (due.length <= MIN_PER_DAY) continue
  const perDay = Math.max(MIN_PER_DAY, Math.ceil(due.length / MAX_DAYS))
  const next = { ...srs }
  due.forEach(([word, e], i) => { next[word] = { ...e, due: vnDate(Math.floor(i / perDay)) } })
  touched++
  movedWords += due.length - perDay
  biggest.push({ child: row.child_id.slice(0, 8), level: row.level, due: due.length, perDay, days: Math.ceil(due.length / perDay) })
  if (APPLY) {
    const { error } = await sb.from('vocab_sync').update({ srs: next }).eq('id', row.id)
    if (error) throw error
  }
}

biggest.sort((a, b) => b.due - a.due)
console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} · today(VN)=${today} · rows=${rows.length} · due now=${totalDue}`)
console.log(`rows spread: ${touched} · words moved to later days: ${movedWords}`)
console.table(biggest.slice(0, 15))
