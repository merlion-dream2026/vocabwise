// Game prompts and answers must show the whole word / meaning: long text wraps and gets a smaller
// font instead of being cut off with "…" (meanings run up to ~45 chars, words up to ~25).

/** Font class for `text`: `short` up to `limits[0]` chars, `mid` up to `limits[1]`, else `long`. */
export function fitText(text: string, [short, mid, long]: readonly [string, string, string], limits: readonly [number, number] = [12, 24]) {
  return text.length <= limits[0] ? short : text.length <= limits[1] ? mid : long
}

/** Limits for English words (shorter than Vietnamese meanings). */
export const WORD_LIMITS = [9, 14] as const
