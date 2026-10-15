// Shared word-matching helpers for Phát âm cùng AI — used by the scoring API
// (/api/score-pronunciation) and by SpeakGame to colour each target word.

export function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
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
