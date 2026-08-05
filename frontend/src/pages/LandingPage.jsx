import React from 'react'
import Hero from '../features/landing/Hero'
import HowItWorks from '../features/landing/HowItWorks'
import GroundedSection from '../features/landing/GroundedSection'
import FeatureGrid from '../features/landing/FeatureGrid'
import WorkflowTabs from '../features/landing/WorkflowTabs'
import TrustSection from '../features/landing/TrustSection'
import FinalCta from '../features/landing/FinalCta'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <GroundedSection />
      <FeatureGrid />
      <WorkflowTabs />
      <TrustSection />
      <FinalCta />
    </>
  )
}
