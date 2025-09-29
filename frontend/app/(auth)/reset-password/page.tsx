/**
 * Reset Password Page
 * Password reset with token - Using new authentication system
 */

'use client'

import { ResetPasswordForm } from '@/components/auth/PasswordResetFlow'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  )
}
