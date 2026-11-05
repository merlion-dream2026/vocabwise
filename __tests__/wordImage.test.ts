import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getWordIcon, getWordImage } from '@/lib/wordIcon'
import { SENSE_IMAGES, WORD_IMAGES } from '@/lib/wordImageIcons'

describe('word images', () => {
  it('picks the image by sense, not by spelling', () => {
    expect(getWordImage('remote', '🎛️')).toBe('/icons/words/remote.webp')
    expect(getWordImage('remote', '🏕️')).toBeNull()
  })

  it('every mapped image exists in public/', () => {
    for (const src of [...Object.values(SENSE_IMAGES), ...Object.values(WORD_IMAGES)]) {
      expect(existsSync(`public${src}`), src).toBe(true)
    }
  })

  it('concrete words with a correct emoji have no Phosphor override', () => {
    for (const w of ['desert', 'record', 'lantern', 'robot']) expect(getWordIcon(w)).toBeNull()
  })
})
