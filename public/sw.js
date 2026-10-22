const CACHE       = 'vocabwise-v1'
const AUDIO_CACHE = 'vocabwise-audio-v1'
// Backup link shown when the main domain can't be reached (e.g. VNNIC .id.vn DNS outage)
const MAIN_ORIGIN     = 'https://vocabwise.id.vn'
const FALLBACK_ORIGIN = 'https://vocabwise.vercel.app'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        // Remove every other cache — incl. 'vocabwise-downloads-v1' left by the removed
        // offline-download feature (Oct 2026), which can hold many MB on a child's phone.
        keys.filter(k => k !== CACHE && k !== AUDIO_CACHE)
            .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch handler ────────────────────────────────────────────────────────────

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

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

  // Catch-all: prevent native Safari "can't open the page" error when offline.
  if (e.request.mode === 'navigate') {
    const fallbackStep = self.location.origin === MAIN_ORIGIN
      ? `<li>Vẫn không vào được? Mở <b>link dự phòng</b>:<br>
              <a class="alt" href="${FALLBACK_ORIGIN + url.pathname + url.search}">vocabwise.vercel.app</a></li>`
      : ''
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
          .steps .alt{color:#7c3aed;font-weight:700;word-break:break-all}
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
              ${fallbackStep}
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
