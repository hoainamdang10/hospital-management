/**
 * Patient Onboarding Page
 * Multi-step wizard for completing patient profile - Using new authentication system
 */

'use client'

import { PatientOnboardingWizard } from '@/components/auth/PatientOnboardingWizard'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PatientOnboardingWizard />
    </div>
  )
}
