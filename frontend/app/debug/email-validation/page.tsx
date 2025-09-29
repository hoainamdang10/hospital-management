import { EmailValidationTest } from '@/components/test/EmailValidationTest'

export default function EmailValidationTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EmailValidationTest />
    </div>
  )
}

export const metadata = {
  title: 'Email Validation Test - Hospital Management',
  description: 'Test page for email validation functionality',
}
