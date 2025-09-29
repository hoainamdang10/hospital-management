/**
 * Patient Registration Page
 * Public registration for patients only - Using new authentication system
 */

"use client";

import { PatientRegistrationForm } from "@/components/auth/PatientRegistrationForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PatientRegistrationForm />
    </div>
  );
}
