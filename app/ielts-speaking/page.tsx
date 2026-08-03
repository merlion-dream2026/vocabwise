import type { Metadata } from 'next'
import SpeakingCoach from '@/components/ielts-speaking/SpeakingCoach'

export const metadata: Metadata = {
  title: 'IELTS Speaking Coach · VocabWise',
  description: 'Luyện IELTS Speaking Parts 1, 2 và 3 với band ước lượng, feedback theo tiêu chí và model answers Band 6, 7.5, 9.',
}

export default function IeltsSpeakingPage() {
  return <SpeakingCoach />
}
