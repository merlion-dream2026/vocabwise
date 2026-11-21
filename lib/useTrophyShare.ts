'use client'

import { useCallback, useEffect, useRef } from 'react'

type Args = {
  enabled: boolean
  childId: string
  level: string
  topicId: string
  childName?: string
  topicName: string
  topicEmoji: string
}

type Ready = { url: string; file: File | null }

// "Topic conquered" share. Everything is fetched ahead of the tap (signed /c/{token} link + the
// certificate PNG), because iOS only allows navigator.share() straight from the tap — an await in
// between loses the user gesture.
//   1. Phone can share files → send the certificate as a photo, caption with a plain domain.
//   2. Otherwise → share the /c/{token} link; its og:image is the personalised preview card.
//   3. No Web Share (desktop) → copy that link.
export function useTrophyShare({ enabled, childId, level, topicId, childName, topicName, topicEmoji }: Args) {
  const ready = useRef<Ready | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ready.current = null
    ;(async () => {
      const res = await fetch('/api/share/trophy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, level, topicId }),
      })
      if (!res.ok) return
      const { url, cardUrl } = await res.json() as { url: string; cardUrl: string }
      if (cancelled) return
      ready.current = { url, file: null }
      const img = await fetch(cardUrl)
      if (!img.ok || cancelled) return
      const blob = await img.blob()
      ready.current = { url, file: new File([blob], `giay-khen-${topicId}.png`, { type: 'image/png' }) }
    })().catch(() => {})
    return () => { cancelled = true }
  }, [enabled, childId, level, topicId])

  return useCallback(() => {
    const who = childName || 'Bé'
    const r = ready.current
    const file = r?.file
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({
        files: [file],
        text: `🎉 ${who} vừa nhận giấy khen chủ đề ${topicEmoji} ${topicName}!\nHọc tiếng Anh cùng bé tại 👉 vocabwise.id.vn`,
      }).catch(() => {})
      return
    }
    const url = r?.url ?? 'https://vocabwise.id.vn'
    const text = `🏆 ${who} vừa chinh phục chủ đề ${topicEmoji} ${topicName}!`
    if (navigator.share) {
      navigator.share({ title: 'VocabWise Daily', text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`).catch(() => {})
      alert('Đã sao chép! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }, [childName, topicName, topicEmoji])
}
