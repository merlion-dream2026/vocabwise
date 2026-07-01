const key = (childId: string, topicId: string, gameKey: string) =>
  `vw_ss_${childId}_${topicId}_${gameKey}`

export function saveStepScore(
  childId: string, topicId: string, gameKey: string,
  correct: number, total: number,
) {
  try { localStorage.setItem(key(childId, topicId, gameKey), JSON.stringify({ correct, total })) } catch {}
}

export function getStepScore(
  childId: string, topicId: string, gameKey: string,
): { correct: number; total: number } | null {
  try {
    const s = localStorage.getItem(key(childId, topicId, gameKey))
    return s ? (JSON.parse(s) as { correct: number; total: number }) : null
  } catch { return null }
}
