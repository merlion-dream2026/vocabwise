// Shared chat-completion caller for the AI text-helper endpoints (explain, hint,
// grammar-note, writing-check, generate-exercises). Tries providers in the given
// order and falls back to the next one on any failure (missing key, network error,
// non-2xx incl. provider-side rate limiting) — so a single provider's outage or
// daily quota doesn't take the feature down.

type Provider = 'groq' | 'cerebras'

type ProviderConfig = {
  url: string
  key: () => string | undefined
  model: string
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-120b', // llama-3.1-8b-instant decommissioned by Groq (2026-08)
  },
  cerebras: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    key: () => process.env.CEREBRAS_API_KEY,
    model: 'gpt-oss-120b',
  },
}

type ChatOptions = {
  order: Provider[]
  prompt: string
  maxTokens: number
  temperature: number
  json?: boolean
  /** gpt-oss reasoning tokens count against maxTokens — 'low' leaves room for the answer */
  reasoningEffort?: 'low' | 'medium' | 'high'
  /** Treat a max_tokens cut-off as a failure (try next provider / return null) instead of returning half a sentence */
  rejectTruncated?: boolean
}

async function callProvider(provider: Provider, opts: Omit<ChatOptions, 'order'>): Promise<string | null> {
  const cfg = PROVIDERS[provider]
  const apiKey = cfg.key()
  if (!apiKey) return null

  let res: Response
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: opts.prompt }],
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
      }),
    })
  } catch (e) {
    console.error(`[aiChat] ${provider} fetch failed:`, e)
    return null
  }

  if (!res.ok) {
    console.error(`[aiChat] ${provider} error:`, res.status)
    return null
  }

  const d = await res.json()
  if (opts.rejectTruncated && d.choices?.[0]?.finish_reason === 'length') {
    console.error(`[aiChat] ${provider} hit max_tokens — output truncated`)
    return null
  }
  return d.choices?.[0]?.message?.content?.trim() ?? ''
}

/** Returns the trimmed completion text, or null if every provider in `order` failed. */
export async function aiChat(opts: ChatOptions): Promise<string | null> {
  for (const provider of opts.order) {
    const content = await callProvider(provider, opts)
    if (content !== null) return content
  }
  return null
}
