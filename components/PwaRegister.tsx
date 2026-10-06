'use client'
import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // sw.js caches /_next/static/ cache-first; dev chunks aren't content-hashed, so a registered
    // worker keeps serving stale JS/CSS. Skip it in dev and drop any worker/cache left from before.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {})
      caches?.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {})
      return
    }
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])
  return null
}
