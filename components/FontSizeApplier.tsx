'use client'
import { useEffect } from 'react'

export default function FontSizeApplier() {
  useEffect(() => {
    const v = localStorage.getItem('vw_fontsize') ?? ''
    document.documentElement.classList.remove('vw-large', 'vw-xl')
    if (v === 'large') document.documentElement.classList.add('vw-large')
    else if (v === 'xl') document.documentElement.classList.add('vw-xl')
  }, [])
  return null
}
