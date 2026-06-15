'use client'
import CertificateModal from '@/components/vocabwise/CertificateModal'
import { useRouter } from 'next/navigation'

export default function CertificatePreviewPage() {
  const router = useRouter()
  return (
    <CertificateModal
      book="book2"
      bookTitle="VocabWise Progress"
      cefr="B1–B2"
      emoji="🚀"
      color="from-blue-500 to-cyan-500"
      mastered={24}
      total={60}
      onClose={() => router.push('/vocabwise')}
    />
  )
}
