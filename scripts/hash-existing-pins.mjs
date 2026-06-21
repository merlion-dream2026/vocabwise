/**
 * One-time migration: hash all plaintext PINs in the children table.
 * Run once: node scripts/hash-existing-pins.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data: children, error } = await supabase
  .from('children')
  .select('id, pin')
  .not('pin', 'is', null)

if (error) { console.error('Fetch error:', error); process.exit(1) }

let updated = 0
let skipped = 0

for (const child of children ?? []) {
  if (!child.pin || child.pin.startsWith('$2')) { skipped++; continue }
  const hash = await bcrypt.hash(child.pin, 12)
  const { error: updateError } = await supabase
    .from('children')
    .update({ pin: hash })
    .eq('id', child.id)
  if (updateError) console.error(`Error updating ${child.id}:`, updateError)
  else updated++
}

console.log(`Done — updated: ${updated}, skipped (already hashed): ${skipped}`)
