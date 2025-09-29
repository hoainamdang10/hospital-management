"use client"

import React from 'react'
import { UnifiedAuthProvider, useUnifiedAuth, UnifiedUser } from './unified-auth-context'

// Re-export unified auth hook as the main useAuth hook
export function useAuth() {
  return useUnifiedAuth()
}

// Compatibility wrapper for existing components
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedAuthProvider>
      {children}
    </UnifiedAuthProvider>
  )
}

// Export types for compatibility
export type { UnifiedUser as HospitalUser }

// Role checking hooks for compatibility
export function useUser(): UnifiedUser | null {
  const { user } = useUnifiedAuth()
  return user
}

export function useAuthLoading(): boolean {
  const { loading } = useUnifiedAuth()
  return loading
}

export function useIsAdmin(): boolean {
  const { user } = useUnifiedAuth()
  return user?.role === 'admin'
}

export function useIsDoctor(): boolean {
  const { user } = useUnifiedAuth()
  return user?.role === 'doctor'
}

export function useIsPatient(): boolean {
  const { user } = useUnifiedAuth()
  return user?.role === 'patient'
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useUnifiedAuth()
  return isAuthenticated
}

// Auth type switching utilities
export function useAuthType() {
  const { authType, switchAuthType } = useUnifiedAuth()
  return { authType, switchAuthType }
}

// Enhanced auth context compatibility
export function useEnhancedAuth() {
  const auth = useUnifiedAuth()
  return {
    ...auth,
    // Add any additional methods that enhanced auth context had
  }
}

// Export the provider and hook
export { UnifiedAuthProvider, useUnifiedAuth }
export default AuthProvider
