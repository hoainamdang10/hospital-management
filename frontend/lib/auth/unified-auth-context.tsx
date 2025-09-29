"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authServiceApi, AuthUser, RegisterData } from '../api/auth'
import { sessionManager } from './session-manager'
import { getDashboardPath } from './dashboard-routes'
import { saveUserSession, restoreUserSession, clearUserSession, getStoredTokens } from './session-persistence'

// Auth types - now only using Auth Service
export type AuthType = 'service'

// Unified user interface
export interface UnifiedUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'doctor' | 'patient'
  is_active: boolean
  email_confirmed_at?: string
  email_verified?: boolean
  phone_verified?: boolean
  created_at: string
  // Additional fields
  phone_number?: string
  gender?: string
  date_of_birth?: string
  // Role-specific IDs
  doctor_id?: string
  patient_id?: string
  admin_id?: string
  profile_id?: string
  authType: AuthType
}

// Unified auth context interface
interface UnifiedAuthContextType {
  user: UnifiedUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  authType: AuthType
  signIn: (email: string, password: string, authType?: AuthType) => Promise<void>
  signUp: (userData: RegisterData, authType?: AuthType) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  clearAuthData: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  switchAuthType: (type: AuthType) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  // Note: Removed getSupabaseClient as we now use Auth Service exclusively
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState<AuthType>('service') // Default to Auth Service microservice
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const initRef = useRef(false)

  // Detect auth type from stored session/token
  const detectAuthType = (): AuthType => {
    try {
      // Check for auth service token
      const serviceToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (serviceToken) {
        return 'service'
      }

      // Check for supabase session
      const supabaseSession = sessionManager.getSession()
      if (supabaseSession) {
        return 'supabase'
      }

      // Check URL for auth type hint
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const authTypeParam = urlParams.get('authType') as AuthType
        if (authTypeParam === 'service' || authTypeParam === 'supabase') {
          return authTypeParam
        }
      }

      return 'service' // Default to Auth Service microservice
    } catch (error) {
      console.error('Error detecting auth type:', error)
      return 'service' // Default to Auth Service microservice
    }
  }



  // Convert AuthUser to UnifiedUser
  const convertAuthUser = (authUser: AuthUser): UnifiedUser => ({
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.full_name,
    role: authUser.role,
    is_active: authUser.is_active,
    email_confirmed_at: authUser.last_sign_in_at,
    email_verified: true, // Auth service users are email verified
    phone_verified: authUser.phone_verified || false,
    created_at: authUser.created_at || new Date().toISOString(),
    phone_number: authUser.phone_number,
    // Add role-specific IDs if available
    doctor_id: authUser.doctor_id,
    patient_id: authUser.patient_id,
    admin_id: authUser.admin_id,
    profile_id: authUser.id,
    authType: 'service'
  })

  // Initialize auth state
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 [UnifiedAuth] Initializing auth state...')

        // Always use Auth Service
        setAuthType('service')
        console.log('🔍 [UnifiedAuth] Using Auth Service')

        // First try to restore from localStorage immediately for faster UX
        const restoredSession = restoreUserSession()
        if (restoredSession) {
          setUser(restoredSession)
          console.log('⚡ [UnifiedAuth] Quick restore from session persistence for:', restoredSession.email)
        }

        await initializeAuthService()
      } catch (err) {
        console.error('❌ [UnifiedAuth] Failed to initialize auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Clear all authentication data
  const clearAuthData = () => {
    console.log('🧹 [UnifiedAuth] Clearing all authentication data')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('user_data')

    // Clear cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    clearUserSession()
    setUser(null)
    setError(null)
  }

  // Validate token before using it
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await authServiceApi.getCurrentUser()
      return response.success && !!response.data?.user
    } catch (error) {
      console.error('❌ [UnifiedAuth] Token validation failed:', error)
      return false
    }
  }

  // Initialize Auth Service
  const initializeAuthService = async () => {
    try {
      // First check if we have a stored token
      const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

      if (!storedToken) {
        // Don't override user if already restored from session persistence
        if (user) {
          return
        }

        // Try to restore from stored user data even without token (for development)
        try {
          const restoredSession = restoreUserSession()
          if (restoredSession) {
            setUser(restoredSession)
            return
          }
        } catch (fallbackErr) {
          console.error('❌ [UnifiedAuth] Session restoration failed:', fallbackErr)
        }

        return
      }

      // Validate token before using it
      const isTokenValid = await validateToken(storedToken)
      if (!isTokenValid) {
        console.log('🔄 [UnifiedAuth] Token is invalid, clearing auth data')
        clearAuthData()
        return
      }

      const response = await authServiceApi.getCurrentUser()

      if (response.success && response.data?.user) {
        const unifiedUser = convertAuthUser(response.data.user)
        setUser(unifiedUser)

        // Update stored user data for faster future restoration
        saveUserSession(unifiedUser, {
          access_token: storedToken,
          refresh_token: localStorage.getItem('refresh_token') || ''
        })

        console.log('✅ [UnifiedAuth] Auth Service user restored from token:', unifiedUser.role)
      } else {
        console.log('🔄 [UnifiedAuth] Failed to get user data, clearing auth data')
        clearAuthData()
      }
    } catch (err) {
      console.error('❌ [UnifiedAuth] Auth Service initialization failed:', err)

      // If it's a network error, try to restore from stored user data as fallback
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        try {
          const storedUserData = localStorage.getItem('user_data')
          if (storedUserData) {
            const userData = JSON.parse(storedUserData)
            setUser(userData)
            console.log('⚡ [UnifiedAuth] Using cached user data due to network error')
            return
          }
        } catch (fallbackErr) {
          console.error('❌ [UnifiedAuth] Fallback restoration failed:', fallbackErr)
        }
      }

      // Clear potentially corrupted tokens
      clearAuthData()
    }
  }



  // Sign in with unified interface
  const signIn = async (email: string, password: string, preferredAuthType?: AuthType) => {
    try {
      setLoading(true)
      setError(null)

      await signInWithAuthService(email, password)
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign in failed:', err)
      setError(err.message || 'Sign in failed')
      throw err // Re-throw to handle in UI
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Auth Service
  const signInWithAuthService = async (email: string, password: string) => {
    try {
      const response = await authServiceApi.signIn({ email, password })

      if (!response.success || !response.data?.user) {
        throw new Error(response.error?.message || 'Invalid credentials')
      }

      const unifiedUser = convertAuthUser(response.data.user)
      setUser(unifiedUser)
      setAuthType('service')

      // Store token for future requests - use both localStorage and cookies
      if (response.data.session?.access_token) {
        // Store in localStorage for frontend access
        localStorage.setItem('auth_token', response.data.session.access_token)

        if (response.data.session.refresh_token) {
          localStorage.setItem('refresh_token', response.data.session.refresh_token)
        }

        // Store in cookies for middleware access
        document.cookie = `auth_token=${response.data.session.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        if (response.data.session.refresh_token) {
          document.cookie = `refresh_token=${response.data.session.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
        }

        // Store user data using session persistence utility
        saveUserSession(unifiedUser, {
          access_token: response.data.session.access_token,
          refresh_token: response.data.session.refresh_token
        })

        console.log('✅ [UnifiedAuth] Sign in successful, tokens stored in localStorage and cookies')

        // Redirect to dashboard with a small delay to ensure state is updated
        setTimeout(() => {
          const dashboardPath = getDashboardPath(unifiedUser.role as any)
          console.log('🔄 [UnifiedAuth] Redirecting to:', dashboardPath)
          router.replace(dashboardPath)
        }, 100)
      } else {
        throw new Error('No access token received')
      }
    } catch (error) {
      console.error('❌ [UnifiedAuth] Sign in error:', error)
      // Clear any partial auth data on error
      clearAuthData()
      throw error
    }
  }



  // Sign up with Auth Service
  const signUp = async (userData: RegisterData, preferredAuthType?: AuthType) => {
    try {
      setLoading(true)
      setError(null)

      await signUpWithAuthService(userData)
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign up failed:', err)
      setError(err.message || 'Sign up failed')
      throw err // Re-throw to handle in UI
    } finally {
      setLoading(false)
    }
  }

  // Sign up with Auth Service
  const signUpWithAuthService = async (userData: RegisterData) => {
    const response = await authServiceApi.signUp(userData)

    if (!response.success) {
      throw new Error(response.error?.message || 'Registration failed')
    }

    // Note: User might need to verify email before signing in
  }



  // Sign out from Auth Service
  const signOut = async () => {
    try {
      setLoading(true)

      await authServiceApi.signOut()
      // Clear all stored session data using session persistence utility
      clearUserSession()
      sessionManager.clearSession()

      setUser(null)
      setError(null)
      router.replace('/auth/login')
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign out failed:', err)
      setError(err.message || 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      await initializeAuthService()
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Failed to refresh user:', err)
      setError(err.message || 'Failed to refresh user data')
    }
  }

  // Switch auth type
  const switchAuthType = (type: AuthType) => {
    setAuthType(type)
    setUser(null)
    setError(null)
  }

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    try {
      // TODO: Implement auth service change password
      return { error: 'Change password not implemented for auth service yet' }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Change password failed:', err)
      return { error: err.message || 'Failed to change password' }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      // TODO: Implement auth service reset password
      return { error: 'Reset password not implemented for auth service yet' }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Reset password failed:', err)
      return { error: err.message || 'Failed to reset password' }
    }
  }

  // Update password (for reset password flow)
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      // TODO: Implement auth service update password
      return { error: 'Update password not implemented for auth service yet' }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Update password failed:', err)
      return { error: err.message || 'Failed to update password' }
    }
  }

  // Note: Removed getSupabaseClient - Auth Service is now the exclusive authentication method

  // Role checking methods
  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const clearError = () => {
    setError(null)
  }

  const isAuthenticated = !!user

  const value: UnifiedAuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    authType,
    signIn,
    signUp,
    signOut,
    refreshUser,
    clearError,
    clearAuthData,
    hasRole,
    hasAnyRole,
    switchAuthType,
    changePassword,
    resetPassword,
    updatePassword
  }

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang khởi tạo hệ thống xác thực...</p>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  )
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider')
  }
  return context
}

// Export for convenience
export default UnifiedAuthProvider
