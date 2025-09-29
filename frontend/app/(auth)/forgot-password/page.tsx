/**
 * Forgot Password Page
 * Password reset request - Using new authentication system
 */

'use client'

import { ForgotPasswordForm } from '@/components/auth/PasswordResetFlow'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  )
}
