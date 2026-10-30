import { supabase } from './supabaseServer'
import { DEFAULT_BARS, sanitizeBars, type Bars } from './pronunciationScore'

// Pronunciation bars edited in /superadmin (Cài đặt → Ngưỡng phát âm), stored as JSON in
// admin_config. Cached per server instance for a minute — a change applies within ~60 s, no deploy.
export const BARS_KEY = 'pronunciation_bars'
const TTL_MS = 60_000
let cache: { bars: Bars; at: number } | null = null

export async function getPronunciationBars(): Promise<Bars> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.bars
  let bars = DEFAULT_BARS
  try {
    const { data } = await supabase.from('admin_config').select('value').eq('key', BARS_KEY).maybeSingle()
    if (data?.value) bars = sanitizeBars(JSON.parse(data.value))
  } catch { /* bad JSON / DB hiccup → defaults */ }
  cache = { bars, at: Date.now() }
  return bars
}

export async function savePronunciationBars(raw: unknown): Promise<Bars> {
  const bars = sanitizeBars(raw)
  const { error } = await supabase.from('admin_config').upsert({ key: BARS_KEY, value: JSON.stringify(bars) }, { onConflict: 'key' })
  if (error) throw error
  cache = { bars, at: Date.now() }
  return bars
}
