'use client'

import { useState, useEffect } from 'react'
import { AdminPanel } from './_components/AdminPanel'
import { LoginPanel } from './_components/LoginPanel'

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/me').then(r => {
      if (r.ok) setAuthed(true)
      setChecking(false)
    })
  }, [])

  if (checking) return null
  return authed ? <AdminPanel /> : <LoginPanel onLogin={() => setAuthed(true)} />
}
