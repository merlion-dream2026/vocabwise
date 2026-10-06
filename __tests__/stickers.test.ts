import { describe, it, expect } from 'vitest'
import { awardStickers, STICKER_LAUNCH_AT } from '@/lib/stickers'
import type { MasteryEntry } from '@/lib/topicMastery'

// Minimal fake of the supabase calls awardStickers makes: select(existing) + upsert(rows).
function fakeClient(existing: string[]) {
  const inserted: { topic_id: string; legacy: boolean }[] = []
  const client = {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ eq: async () => ({ data: existing.map((topic_id) => ({ topic_id })), error: null }) }) }) }),
      upsert: async (rows: { topic_id: string; legacy: boolean }[]) => { inserted.push(...rows); return { error: null } },
    }),
  }
  return { client: client as never, inserted }
}

const perfect = (at: string): MasteryEntry => ({
  flashcard: true, games: [],
  modes: Object.fromEntries(['listen', 'truefalse', 'match', 'fillletter', 'speak', 'spell', 'sentenceorder'].map((k) => [k, { best: 100, last: 100, at }])),
})

describe('awardStickers', () => {
  it('marks topics completed before launch as legacy and after launch as new', async () => {
    const { client, inserted } = fakeClient([])
    const fresh = await awardStickers(client, 'c1', 'seeker', {
      old: perfect('2026-09-01T00:00:00.000Z'),
      recent: perfect('2026-10-07T10:00:00.000Z'),
    })
    expect(fresh).toEqual(['recent'])
    expect(inserted.find((r) => r.topic_id === 'old')?.legacy).toBe(true)
    expect(inserted.find((r) => r.topic_id === 'recent')?.legacy).toBe(false)
    expect(STICKER_LAUNCH_AT > '2026-09-01').toBe(true)
  })

  it('skips topics that already have a sticker and topics not mastered', async () => {
    const { client, inserted } = fakeClient(['done'])
    const fresh = await awardStickers(client, 'c1', 'seeker', {
      done: perfect('2026-10-07T10:00:00.000Z'),
      partial: { flashcard: true, games: [], modes: { listen: { best: 100, last: 100, at: '2026-10-07T10:00:00.000Z' } } },
    })
    expect(fresh).toEqual([])
    expect(inserted).toEqual([])
  })

  it('never awards Daily stickers for non-vocab levels like phonics', async () => {
    const { client, inserted } = fakeClient([])
    const fresh = await awardStickers(client, 'c1', 'phonics', { p1: perfect('2026-10-07T10:00:00.000Z') })
    expect(fresh).toEqual([])
    expect(inserted).toEqual([])
  })
})
