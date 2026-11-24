import { describe, expect, it } from 'vitest'
import { clipKey } from './recordedVoice'
import index from '@/data/phonics-audio.json'

describe('clipKey', () => {
  it('ignores case, markdown bold, curly quotes, spacing and end punctuation', () => {
    expect(clipKey('  The **fish**  swims.  ')).toBe('the fish swims')
    expect(clipKey('Isn’t it?')).toBe("isn't it")
    expect(clipKey('Ship')).toBe(clipKey('ship!'))
  })
  it('is what the generator used for every key in data/phonics-audio.json', () => {
    for (const k of Object.keys(index)) expect(clipKey(k)).toBe(k)
  })
})
