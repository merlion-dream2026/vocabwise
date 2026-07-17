// Shared helper for Level Test (Daily) / Module Test (Academic): picks a contiguous
// chunk of a large word pool so that consecutive attempts never reuse the same chunk
// (avoids students memorizing answers) and, over SET_COUNT attempts, the whole pool
// gets covered instead of a few words dominating pure-random draws.
export const TEST_SET_COUNT = 5

export function pickTestSet<T>(pool: T[], attempt: number, setCount = TEST_SET_COUNT): T[] {
  if (pool.length === 0) return []
  const chunkSize = Math.ceil(pool.length / setCount)
  const setIdx = ((attempt % setCount) + setCount) % setCount
  const start = setIdx * chunkSize
  return pool.slice(start, start + chunkSize)
}
