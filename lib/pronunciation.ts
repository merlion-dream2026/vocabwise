// Shared word-matching helpers for Phát âm cùng AI — used by the scoring API
// (/api/score-pronunciation) and by SpeakGame to colour each target word.

export function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
}

/** Words of a phrase, hyphens as word breaks (normalize alone turns sugar-free into "sugarfree"). */
export const wordParts = (s: string) => normalize(s.replace(/-/g, ' ')).split(' ').filter(Boolean)

/** Base forms a word could come from: portions → portion, unwinding → unwind/unwinde, sliced → slice,
 *  stopped → stop, studies → study. Over-generating is harmless: forms only need to overlap. */
function wordForms(w: string): Set<string> {
  const out = new Set([w])
  const add = (stem: string, ...ends: string[]) => { if (stem.length >= 3) for (const e of ends) out.add(stem + e) }
  const undouble = (stem: string) => { if (/([b-df-hj-np-tv-z])\1$/.test(stem)) add(stem.slice(0, -1), '') }
  if (w.endsWith('ies')) add(w.slice(0, -3), 'y')
  if (w.endsWith('es')) add(w.slice(0, -2), '')
  if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1), '')
  if (w.endsWith('ied')) add(w.slice(0, -3), 'y')
  if (w.endsWith('ed')) { const st = w.slice(0, -2); add(st, '', 'e'); undouble(st) }
  if (w.endsWith('ing')) { const st = w.slice(0, -3); add(st, '', 'e'); undouble(st) }
  return out
}

/** Same word apart from inflection; both already normalized. */
export const sameWord = (a: string, b: string) => {
  if (a === b) return true
  const fa = wordForms(a)
  return [...wordForms(b)].some(f => fa.has(f))
}

/** Does this displayed/Azure word belong to the key word, in any inflected or hyphenated form? */
export const isKeyWord = (text: string, keyword: string) => {
  const keys = wordParts(keyword)
  return wordParts(text).some(part => keys.some(k => sameWord(k, part)))
}

export function soundex(s: string): string {
  if (!s) return ''
  const MAP: Record<string, string> = {
    B:'1',F:'1',P:'1',V:'1',
    C:'2',G:'2',J:'2',K:'2',Q:'2',S:'2',X:'2',Z:'2',
    D:'3',T:'3', L:'4', M:'5',N:'5', R:'6',
  }
  const u = s.toUpperCase()
  let code = u[0]
  let prev = MAP[u[0]] ?? '0'
  for (let i = 1; i < u.length && code.length < 4; i++) {
    const c = MAP[u[i]] ?? '0'
    if (c !== '0' && c !== prev) code += c
    prev = c !== '0' ? c : prev
  }
  return code.padEnd(4, '0')
}

/**
 * Split the target as displayed (keeps original casing/punctuation) and flag which
 * words were heard in the transcript — exact or Soundex match, each transcript word
 * used once, any order (same rule as the API's sentence check).
 */
export function matchWords(transcript: string, target: string): { text: string; ok: boolean }[] {
  const tWords = normalize(transcript).split(' ').filter(Boolean)
  const used = new Set<number>()
  return target.split(/\s+/).filter(Boolean).map(text => {
    const tw = normalize(text)
    if (!tw) return { text, ok: true }
    const i = tWords.findIndex((tok, j) => !used.has(j) && (tok === tw || soundex(tok) === soundex(tw)))
    if (i >= 0) used.add(i)
    return { text, ok: i >= 0 }
  })
}

/** Whisper fallback verdict: the transcript has no scores, so only "was it heard" can be judged. */
export function isPronunciationCorrect(transcript: string, target: string, word: string, contrastWords: string[], threshold: number): boolean {
  const tWords   = wordParts(transcript)
  const tgtWords = wordParts(target)
  const t   = tWords.join(' ')
  const tgt = tgtWords.join(' ')

  // 0. If transcript matches a contrast word (exact or Soundex) → wrong sound was said
  const contrasts = contrastWords.map(normalize)
  if (contrasts.some(c => tWords.some(tok => tok === c || soundex(tok) === soundex(c)))) return false

  // 1. Exact / contains match (whole words)
  if (t === tgt || ` ${t} `.includes(` ${tgt} `)) return true

  // 2. Example sentences inflect the key word (portion → "portions"; "set an alarm" → "sets two alarms"),
  //    so each of its words only has to be heard if it's in this sentence, in any inflected form.
  const keyWords = wordParts(word).filter(ww => tgtWords.some(tw => sameWord(tw, ww)))
  const heard = (ww: string) => tWords.some(tok => sameWord(tok, ww) || soundex(tok) === soundex(ww))
  if (!keyWords.every(heard)) return false

  // 3. Single-word target: keyword present = sufficient (not located → step 4 still needs it heard)
  if (tgtWords.length === 1 && keyWords.length) return true

  // 4. Sentence: keyword correct + ≥threshold of ALL target words present (soundex-tolerant, any order)
  let matched = 0
  const used = new Set<number>()
  for (const tw of tgtWords) {
    for (let i = 0; i < tWords.length; i++) {
      if (!used.has(i) && (sameWord(tWords[i], tw) || soundex(tWords[i]) === soundex(tw))) {
        matched++; used.add(i); break
      }
    }
  }
  return matched / tgtWords.length >= threshold
}
