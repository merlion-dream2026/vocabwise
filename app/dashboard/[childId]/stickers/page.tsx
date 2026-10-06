'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// The album now lives in the child's profile; keep this URL so old links/bookmarks still work.
export default function StickersRedirect() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  useEffect(() => { router.replace(`/dashboard/${childId}/profile${window.location.search}`) }, [childId, router])
  return null
}
