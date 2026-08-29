// Shared content-generation guardrails — root-cause fixes for the truncation /
// code-switching / mistranslation / duplicate-item bug categories found in the
// 2026-08-26 Gemini audit (see exports/gemini-audit-trial/). Every content-
// generation script should run its output through these before writing to DB,
// instead of each script reinventing its own partial checks.
//
// Two tiers:
//   - mechanical (free, instant): finish_reason truncation check, duplicate
//     word-set check
//   - semantic (1 extra Groq call, ~1-2s): self-critique pass that catches
//     code-switching and mistranslation — the two categories no mechanical
//     check can see

// Read lazily (not captured at module-load time) — callers commonly run
// dotenv.config() *after* their other requires, which would otherwise freeze
// this at undefined.
function groqApiKey() { return process.env.GROQ_API_KEY }

/** True if the API response was cut off by max_tokens before finishing. Far more
 *  reliable than guessing from output length/punctuation (which false-positives
 *  on legitimate markdown-italic endings). */
function isTruncated(apiResponse) {
  return apiResponse?.choices?.[0]?.finish_reason === 'length'
}

/** Normalize a word-set for order-independent duplicate comparison. */
function wordSetKey(words) {
  return (words || []).slice().sort().join('|').toLowerCase()
}

/** True if `words` (as a set) duplicates any set already in `existingSets` (array of wordSetKey strings). */
function isDuplicateWordSet(words, existingSets) {
  return existingSets.includes(wordSetKey(words))
}

/**
 * Calls Groq chat completions with automatic retry-on-truncation (raises
 * max_tokens and retries, up to `maxRetries` times, instead of silently
 * writing a cut-off response like the original scripts did).
 */
async function generateWithRetry({ prompt, maxTokens = 500, temperature = 0.7, json = false, maxRetries = 3 }) {
  let tokens = maxTokens
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqApiKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: tokens,
          temperature,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
      })
    } catch (e) {
      if (attempt === maxRetries) throw e
      continue // transient network error — just retry, same token budget
    }
    if (res.status === 429) throw new Error('RATE_LIMIT')
    if (!res.ok) {
      const body = await res.text()
      // json_object mode: model ran out of budget mid-JSON before closing it —
      // same root cause as a truncated plain-text answer, just surfaced as a
      // 400 instead of finish_reason:'length'. Treat identically: grow and retry.
      if (res.status === 400 && body.includes('json_validate_failed')) {
        tokens = Math.round(tokens * 1.7); continue
      }
      throw new Error(`HTTP_${res.status}: ${body}`)
    }
    const d = await res.json()
    if (isTruncated(d)) { tokens = Math.round(tokens * 1.6); continue }
    return d.choices?.[0]?.message?.content?.trim() ?? ''
  }
  throw new Error('STILL_TRUNCATED_AFTER_RETRIES')
}

/**
 * Semantic self-critique pass — catches code-switching and mistranslation that
 * mechanical checks can't see. Second Groq call reviews the Vietnamese text and
 * rewrites it if flawed. Returns the original text if clean, or the rewritten
 * text if issues were found and fixed.
 */
async function critiqueVietnameseText(text, word) {
  const prompt = `Đọc đoạn giải thích tiếng Việt sau (dành cho học sinh Việt Nam học từ vựng tiếng Anh "${word}"):

"""
${text}
"""

Kiểm tra 3 lỗi:
1. Từ tiếng Anh bị chèn giữa câu tiếng Việt mà lẽ ra phải dịch — BAO GỒM cả chính từ mục tiêu "${word}" nếu nó xuất hiện bên trong một câu tiếng Việt đang mô tả ví dụ/ngữ cảnh (ví dụ SAI: "giúp cải thiện khả năng ${word} của trẻ em" — phải dịch "${word}" ra tiếng Việt ở đây). CHỈ được giữ nguyên "${word}" khi nó đứng độc lập để định nghĩa (vd: **${word}** là tính từ nghĩa là...) hoặc nằm trong 1 câu ví dụ TOÀN TIẾNG ANH có ngoặc kép/in nghiêng riêng.
2. Dịch sai nghĩa, sai từ loại (noun/verb/adj...), hoặc thông tin sai sự thật
3. Từ/cụm từ tiếng Việt bị bịa ra, không có nghĩa, hoặc không phải tiếng Việt thật (ví dụ: "ốp dịch", "ổn lươn rau" — đọc qua nghe như tiếng Việt nhưng vô nghĩa khi tra từ điển)

Nếu đoạn văn KHÔNG có lỗi nào, trả về: {"ok": true}
Nếu CÓ lỗi, trả về: {"ok": false, "fixed": "<toàn bộ đoạn văn viết lại, sửa hết lỗi, giữ nguyên văn phong và độ dài>"}

Chỉ trả về JSON, không thêm text khác.`

  // Budget must cover: hidden reasoning (~300-500) + JSON wrapper + a full
  // rewritten copy of `text` in the worst case (ok:false) — character count
  // alone under-provisions this badly for reasoning models.
  const raw = await generateWithRetry({ prompt, maxTokens: Math.max(1000, text.length * 2), temperature: 0.3, json: true })
  const result = JSON.parse(raw)
  if (result.ok) return text
  if (!result.fixed || result.fixed.length < 60) return text // guard against a bad rewrite nuking the content
  return result.fixed
}

module.exports = { isTruncated, wordSetKey, isDuplicateWordSet, generateWithRetry, critiqueVietnameseText }
