/**
 * Runs `fn` over `items` with at most `concurrency` in flight at once, instead of
 * fully sequential (previous cron pattern: one email send at a time). Used by the
 * cron email routes so a large family count doesn't run out the Vercel function
 * timeout — errors inside `fn` should be caught by the caller, not thrown, since
 * this never short-circuits the whole batch on a single failure.
 */
export async function runInBatches<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
}
