/**
 * Accept Invitation Page
 * For staff/doctor/admin invitation acceptance - Using new authentication system
 */

'use client'

import { InviteAcceptanceForm } from '@/components/auth/InviteAcceptanceForm'

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <InviteAcceptanceForm />
    </div>
  )
}
