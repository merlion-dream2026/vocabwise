'use client'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function LandingUpgradeButton({
  label,
  className,
}: {
  label: string
  className: string
}) {
  const [show, setShow] = useState(false)
  return (
    <>
      {show && <UpgradeModal onClose={() => setShow(false)} />}
      <button onClick={() => setShow(true)} className={className}>
        {label}
      </button>
    </>
  )
}
