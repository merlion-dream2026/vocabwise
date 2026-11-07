import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aiChat } from './aiChat'

const reply = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }), { status: 200 })
const opts = { order: ['groq', 'gemini'] as ('groq' | 'gemini')[], prompt: 'hi', maxTokens: 10, temperature: 0 }
const fetchMock = vi.fn<typeof fetch>()

describe('aiChat fallback', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('GROQ_API_KEY', 'g')
    vi.stubEnv('GEMINI_API_KEY', 'm')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

  it('does not call Gemini when Groq answers', async () => {
    fetchMock.mockResolvedValueOnce(reply('from groq'))
    expect(await aiChat(opts)).toBe('from groq')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to Gemini when Groq is rate limited', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(reply('from gemini'))
    expect(await aiChat(opts)).toBe('from gemini')
    expect(String(fetchMock.mock.calls[1][0])).toContain('generativelanguage.googleapis.com')
    expect(fetchMock.mock.calls[1][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('returns null when Gemini times out too', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 })).mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
    expect(await aiChat(opts)).toBeNull()
  })

  it('skips Gemini when its key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }))
    expect(await aiChat(opts)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
