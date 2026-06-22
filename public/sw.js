const CACHE = 'vocabwise-v1'
const AUDIO_CACHE = 'vocabwise-audio-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

// Clean up old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== AUDIO_CACHE).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Skip: external origins (images, APIs) — let browser handle directly
  if (url.hostname !== self.location.hostname) return

  // Skip: API routes, Supabase, Groq — always need live network
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('groq.com')
  ) return

  // Audio: cache-first (large files, rarely change)
  if (url.pathname.startsWith('/audio/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(resp => {
          if (resp.ok) caches.open(AUDIO_CACHE).then(c => c.put(e.request, resp.clone()))
          return resp
        })
      })
    )
    return
  }

  // Next.js static chunks: cache-first (content-hashed, safe to cache forever)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(resp => {
          if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()))
          return resp
        })
      })
    )
    return
  }

  // All other requests (pages, API): go straight to network, no SW interference
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VocabWise', {
      body: data.body ?? 'Nhắc bé học từ vựng hôm nay! 📚',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/kids' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/kids'))
})
