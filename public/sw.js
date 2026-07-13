const CACHE          = 'vocabwise-v1'
const AUDIO_CACHE    = 'vocabwise-audio-v1'
const DOWNLOAD_CACHE = 'vocabwise-downloads-v1'

// Regex: matches Academic topic page URLs like /vocabwise/book1/b1-t01
const TOPIC_PAGE_RE = /^\/vocabwise\/book[123]\/b[123]-t\d+$/

// Regex: matches Daily (Kids) topic page URLs like /dashboard/<uuid>/seeker/<topicId>
const DAILY_PAGE_RE = /^\/dashboard\/[0-9a-f-]{36}\/(seeker|starter|ranger|explorer|scholar|master)\/[^/]+$/

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        // Remove outdated caches but PRESERVE downloads — user's offline content
        keys.filter(k => k !== CACHE && k !== AUDIO_CACHE && k !== DOWNLOAD_CACHE)
            .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Message API ─────────────────────────────────────────────────────────────

self.addEventListener('message', e => {
  const { type, book, topicId, childId, level } = e.data ?? {}

  if (type === 'DOWNLOAD_TOPIC' && book && topicId) {
    const url = `/vocabwise/${book}/${topicId}`
    const port = e.ports?.[0]
    e.waitUntil(
      caches.open(DOWNLOAD_CACHE).then(cache =>
        fetch(url, { credentials: 'include' })
          .then(res => {
            if (res.ok) return cache.put(url, res).then(() => { port?.postMessage({ ok: true }) })
            port?.postMessage({ ok: false })
          })
          .catch(() => { port?.postMessage({ ok: false }) })
      )
    )

  } else if (type === 'DOWNLOAD_DAILY_TOPIC' && childId && level && topicId) {
    const url = `/dashboard/${childId}/${level}/${topicId}`
    const port = e.ports?.[0]
    e.waitUntil(
      caches.open(DOWNLOAD_CACHE).then(cache =>
        fetch(url, { credentials: 'include' })
          .then(res => {
            if (res.ok) return cache.put(url, res).then(() => { port?.postMessage({ ok: true }) })
            port?.postMessage({ ok: false })
          })
          .catch(() => { port?.postMessage({ ok: false }) })
      )
    )

  } else if (type === 'REMOVE_DOWNLOAD' && book && topicId) {
    e.waitUntil(
      caches.open(DOWNLOAD_CACHE).then(cache =>
        cache.delete(`/vocabwise/${book}/${topicId}`)
      )
    )

  } else if (type === 'REMOVE_DAILY_DOWNLOAD' && childId && level && topicId) {
    e.waitUntil(
      caches.open(DOWNLOAD_CACHE).then(cache =>
        cache.delete(`/dashboard/${childId}/${level}/${topicId}`)
      )
    )

  } else if (type === 'CLEAR_DOWNLOADS') {
    e.waitUntil(caches.delete(DOWNLOAD_CACHE))
  }
})

// ─── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  if (url.hostname !== self.location.hostname) return

  // Topic pages (Academic + Daily): network-first with offline fallback from downloads cache
  const isAcademicPage = TOPIC_PAGE_RE.test(url.pathname)
  const isDailyPage    = DAILY_PAGE_RE.test(url.pathname)
  if ((isAcademicPage || isDailyPage) && e.request.mode === 'navigate') {
    const backHref = isDailyPage ? '/kids' : '/vocabwise'
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.open(DOWNLOAD_CACHE).then(cache =>
          cache.match(url.pathname).then(cached =>
            cached ?? new Response(
              `<!doctype html><html lang="vi"><head><meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Đang offline — VocabWise</title>
              <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f3ff}
              .box{text-align:center;padding:2rem}h2{color:#7c3aed}a{color:#7c3aed}</style></head>
              <body><div class="box"><h2>📴 Đang offline</h2>
              <p>Chủ đề này chưa được tải offline.</p>
              <a href="${backHref}">← Quay lại danh sách</a></div></body></html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            )
          )
        )
      )
    )
    return
  }

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

  // Catch-all: prevent native Safari "can't open the page" error when offline.
  // Topic pages already handled above; this covers /, /login, /kids, etc.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => new Response(
        `<!doctype html><html lang="vi"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>VocabWise — Offline</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,sans-serif;background:#f5f3ff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem}
          .card{background:white;border-radius:1.5rem;padding:1.75rem 1.5rem;max-width:320px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08)}
          h2{color:#7c3aed;font-size:1.2rem;font-weight:800;margin:.75rem 0 .5rem;text-align:center}
          .sub{color:#6b7280;font-size:.8125rem;text-align:center;margin-bottom:1.25rem}
          .steps{background:#f5f3ff;border-radius:1rem;padding:1rem 1rem 1rem 1.25rem;margin-bottom:1.25rem}
          .steps p{color:#5b21b6;font-size:.75rem;font-weight:700;margin-bottom:.5rem}
          .steps ol{padding-left:1rem}
          .steps li{color:#4b5563;font-size:.8125rem;line-height:1.6;margin-bottom:.2rem}
          .steps li b{color:#1f2937}
          .btns{display:flex;flex-direction:column;gap:.625rem}
          .btn-primary{background:#7c3aed;color:white;padding:.75rem;border-radius:.875rem;text-decoration:none;font-weight:700;font-size:.875rem;text-align:center;cursor:pointer;border:none;width:100%}
          .btn-secondary{background:white;color:#7c3aed;border:1.5px solid #ddd8fe;padding:.625rem;border-radius:.875rem;text-decoration:none;font-weight:600;font-size:.8125rem;text-align:center;cursor:pointer;width:100%}
        </style></head>
        <body><div class="card">
          <div style="font-size:2.5rem;text-align:center">📴</div>
          <h2>Không có kết nối mạng</h2>
          <p class="sub">VocabWise cần internet để tải trang này.</p>
          <div class="steps">
            <p>Nên làm gì?</p>
            <ol>
              <li><b>Bật lại wifi</b> hoặc dữ liệu di động</li>
              <li>Nhấn <b>"Thử lại"</b> bên dưới để tải lại</li>
              <li>Hoặc mở app → vào <b>Daily</b> → chọn chủ đề đã tải (↓) để học offline</li>
            </ol>
          </div>
          <div class="btns">
            <button class="btn-primary" onclick="location.reload()">🔄 Thử lại</button>
            <button class="btn-secondary" onclick="history.back()">← Quay lại trang trước</button>
          </div>
        </div></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      ))
    )
    return
  }
})

// ─── Push notifications ───────────────────────────────────────────────────────

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VocabWise', {
      body: data.body ?? 'Nhắc bé học từ vựng hôm nay! 📚',
      icon: '/icon',
      badge: '/icon',
      data: { url: data.url ?? '/kids' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/kids'))
})
