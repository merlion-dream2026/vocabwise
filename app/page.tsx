import type { Metadata } from 'next'
import { headers } from 'next/headers'
import LandingNav from '@/components/landing/LandingNav'
import LandingHero from '@/components/landing/LandingHero'
import LandingVideoGallery from '@/components/landing/LandingVideoGallery'
import LandingScreenshotGallery from '@/components/landing/LandingScreenshotGallery'
import LandingPricing from '@/components/landing/LandingPricing'
import StickyCta from '@/components/landing/StickyCta'
import {
  FaqSection, FinalCtaSection, FounderSection, JourneySection, LandingFooter,
  ModulesSection, MotivationSection, StepsSection, TestimonialSection,
} from '@/components/landing/LandingSections'
import { FAQ_ITEMS } from '@/lib/landingContent'

// Canonical only here: set in the root layout it pointed every page (login, terms…) at '/'.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// FAQ rich-result data, built from the same items the page shows (Google wants them visible).
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

export default async function LandingPage() {
  const nonce = (await headers()).get('x-nonce') ?? ''
  return (
    <div className="min-h-screen bg-white">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingNav />
      <div>
        <LandingHero />
        <ModulesSection />
        <JourneySection />
        <MotivationSection />
        <TestimonialSection />
        <LandingScreenshotGallery />
        <LandingVideoGallery />
        <LandingPricing />
        <StepsSection />
        <FounderSection />
        <FaqSection />
        <FinalCtaSection />
      </div>
      <LandingFooter />
      <StickyCta />
    </div>
  )
}
