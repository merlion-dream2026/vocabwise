'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const UpgradeModal = dynamic(() => import('@/components/UpgradeModal'), { ssr: false })

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
