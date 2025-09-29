/**
 * Session Persistence Utility
 * Handles saving and restoring user sessions across page reloads
 */

export interface UserSession {
  id: string
  email: string
  role: string
  full_name: string
  is_active: boolean
  sessionTimestamp: number
  loginMethod: string
  authType: 'service'
  // Additional fields to match UnifiedUser
  email_confirmed_at?: string
  email_verified?: boolean
  phone_verified?: boolean
  created_at: string
  phone_number?: string
  gender?: string
  date_of_birth?: string
  // Role-specific IDs
  doctor_id?: string
  patient_id?: string
  admin_id?: string
  profile_id?: string
}

const USER_DATA_KEY = 'user_data'
const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

/**
 * Save user session to localStorage
 */
export function saveUserSession(user: any, tokens?: { access_token?: string; refresh_token?: string }) {
  try {
    const sessionData: UserSession = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      is_active: user.is_active,
      sessionTimestamp: Date.now(),
      loginMethod: 'auth_service',
      authType: 'service',
      // Additional fields
      email_confirmed_at: user.email_confirmed_at,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at || new Date().toISOString(),
      phone_number: user.phone_number,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      // Role-specific IDs
      doctor_id: user.doctor_id,
      patient_id: user.patient_id,
      admin_id: user.admin_id,
      profile_id: user.profile_id || user.id
    }

    localStorage.setItem(USER_DATA_KEY, JSON.stringify(sessionData))

    if (tokens?.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, tokens.access_token)
    }

    if (tokens?.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
    }

    return true
  } catch (error) {
    console.error('❌ [SessionPersistence] Error saving session:', error)
    return false
  }
}

/**
 * Restore user session from localStorage
 */
export function restoreUserSession(): UserSession | null {
  try {
    const storedData = localStorage.getItem(USER_DATA_KEY)
    if (!storedData) {
      return null
    }

    const sessionData: UserSession = JSON.parse(storedData)

    // Check if session is not too old (optional - for security)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    const age = Date.now() - sessionData.sessionTimestamp

    if (age > maxAge) {
      clearUserSession()
      return null
    }

    return sessionData
  } catch (error) {
    console.error('❌ [SessionPersistence] Error restoring session:', error)
    return null
  }
}

/**
 * Get stored auth tokens
 */
export function getStoredTokens() {
  return {
    authToken: localStorage.getItem(AUTH_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY)
  }
}

/**
 * Clear user session from localStorage
 */
export function clearUserSession() {
  try {
    localStorage.removeItem(USER_DATA_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    
    // Also clear from sessionStorage
    sessionStorage.removeItem(USER_DATA_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    

    return true
  } catch (error) {
    console.error('❌ [SessionPersistence] Error clearing session:', error)
    return false
  }
}

/**
 * Check if user session exists
 */
export function hasStoredSession(): boolean {
  return !!localStorage.getItem(USER_DATA_KEY)
}

/**
 * Update session timestamp (for activity tracking)
 */
export function updateSessionActivity() {
  try {
    const storedData = localStorage.getItem(USER_DATA_KEY)
    if (storedData) {
      const sessionData = JSON.parse(storedData)
      sessionData.lastActivity = Date.now()
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(sessionData))
    }
  } catch (error) {
    console.error('❌ [SessionPersistence] Error updating activity:', error)
  }
}

/**
 * Force save user data (for development/testing)
 */
export function forceSaveUserData(userData: any) {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({
      ...userData,
      sessionTimestamp: Date.now(),
      loginMethod: 'force_save'
    }))
    console.log('🔧 [SessionPersistence] Force saved user data:', userData.role)
    return true
  } catch (error) {
    console.error('❌ [SessionPersistence] Error force saving:', error)
    return false
  }
}

/**
 * Debug session state
 */
export function debugSessionState() {
  const userData = localStorage.getItem(USER_DATA_KEY)
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

  console.log('🔍 [SessionPersistence] Debug State:', {
    hasUserData: !!userData,
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    userDataLength: userData?.length || 0,
    authTokenLength: authToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0
  })

  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      console.log('👤 [SessionPersistence] Stored User:', {
        role: parsed.role,
        email: parsed.email,
        timestamp: new Date(parsed.sessionTimestamp).toLocaleString()
      })
    } catch (e) {
      console.error('❌ [SessionPersistence] Error parsing user data:', e)
    }
  }

  return {
    hasUserData: !!userData,
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    userData: userData ? JSON.parse(userData) : null
  }
}
