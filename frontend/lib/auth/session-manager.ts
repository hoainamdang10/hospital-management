import { HospitalUser } from './supabase-auth'

export interface AuthSession {
  user: HospitalUser
  accessToken: string
  refreshToken: string
  expiresAt: number
  createdAt: number
}

export interface SessionState {
  isAuthenticated: boolean
  isLoading: boolean
  user: HospitalUser | null
  session: AuthSession | null
  lastChecked: number
}

class SessionManager {
  private static instance: SessionManager
  private readonly SESSION_KEY = 'hospital_auth_session'
  private readonly STATE_KEY = 'hospital_auth_state'
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private readonly CLEAR_ON_TAB_CLOSE = false // DISABLED: auto-clear on tab close for development
  
  private sessionState: SessionState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    session: null,
    lastChecked: 0
  }

  private listeners: Set<(state: SessionState) => void> = new Set()

  private constructor() {
    this.initializeSession()
    this.setupEventListeners()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Initialize session from storage
  private initializeSession(): void {
    if (typeof window === 'undefined') return

    try {
      // Always use localStorage for persistent sessions (development mode)
      const storage = localStorage
      const storedSession = storage.getItem(this.SESSION_KEY)
      const storedState = sessionStorage.getItem(this.STATE_KEY)

      if (storedSession) {
        const session: AuthSession = JSON.parse(storedSession)

        // Check if session is still valid
        if (this.isSessionValid(session)) {
          this.sessionState = {
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
            session: session,
            lastChecked: Date.now()
          }

          console.log('🔄 [SessionManager] Valid session restored:', {
            userId: session.user.id,
            role: session.user.role,
            expiresIn: Math.round((session.expiresAt - Date.now()) / 1000 / 60) + ' minutes',
            storage: 'localStorage (persistent)'
          })
        } else {
          console.log('🔄 [SessionManager] Session expired, clearing...')
          this.clearSession()
        }
      }

      if (storedState) {
        const state: Partial<SessionState> = JSON.parse(storedState)
        this.sessionState = { ...this.sessionState, ...state }
      }
    } catch (error) {
      console.error('❌ [SessionManager] Error initializing session:', error)
      this.clearSession()
    }
  }

  // Check if session is valid
  private isSessionValid(session: AuthSession): boolean {
    const now = Date.now()
    const isNotExpired = session.expiresAt > now
    const isNotTooOld = (now - session.createdAt) < this.SESSION_DURATION
    
    return isNotExpired && isNotTooOld && session.user && session.accessToken
  }

  // Save session to storage
  saveSession(user: HospitalUser, accessToken: string, refreshToken: string, expiresIn: number): void {
    const now = Date.now()
    const session: AuthSession = {
      user,
      accessToken,
      refreshToken,
      expiresAt: now + (expiresIn * 1000), // Convert seconds to milliseconds
      createdAt: now
    }

    this.sessionState = {
      isAuthenticated: true,
      isLoading: false,
      user,
      session,
      lastChecked: now
    }

    try {
      // Always use localStorage for persistent sessions (development mode)
      const storage = localStorage

      storage.setItem(this.SESSION_KEY, JSON.stringify(session))
      sessionStorage.setItem(this.STATE_KEY, JSON.stringify({
        isAuthenticated: true,
        lastChecked: now
      }))

      console.log('✅ [SessionManager] Session saved:', {
        userId: user.id,
        role: user.role,
        expiresIn: Math.round(expiresIn / 60) + ' minutes',
        storage: 'localStorage (persistent)'
      })

      this.notifyListeners()
    } catch (error) {
      console.error('❌ [SessionManager] Error saving session:', error)
    }
  }

  // Get current session
  getSession(): AuthSession | null {
    if (!this.sessionState.session) return null
    
    if (!this.isSessionValid(this.sessionState.session)) {
      this.clearSession()
      return null
    }

    return this.sessionState.session
  }

  // Get current user
  getUser(): HospitalUser | null {
    const session = this.getSession()
    return session?.user || null
  }

  // Get session state
  getState(): SessionState {
    return { ...this.sessionState }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  // Check if session needs refresh
  needsRefresh(): boolean {
    const session = this.getSession()
    if (!session) return false

    const now = Date.now()
    const timeUntilExpiry = session.expiresAt - now
    const refreshThreshold = 10 * 60 * 1000 // 10 minutes

    return timeUntilExpiry < refreshThreshold
  }

  // Check if we should verify session with server
  shouldVerifySession(): boolean {
    const now = Date.now()
    const timeSinceLastCheck = now - this.sessionState.lastChecked
    
    return timeSinceLastCheck > this.CHECK_INTERVAL
  }

  // Update last checked timestamp
  updateLastChecked(): void {
    this.sessionState.lastChecked = Date.now()
    
    try {
      sessionStorage.setItem(this.STATE_KEY, JSON.stringify({
        isAuthenticated: this.sessionState.isAuthenticated,
        lastChecked: this.sessionState.lastChecked
      }))
    } catch (error) {
      console.error('❌ [SessionManager] Error updating last checked:', error)
    }
  }

  // Clear session
  clearSession(): void {
    this.sessionState = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      lastChecked: Date.now()
    }

    try {
      // Clear from both storages
      localStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.STATE_KEY)
      console.log('🔄 [SessionManager] Session cleared')
      this.notifyListeners()
    } catch (error) {
      console.error('❌ [SessionManager] Error clearing session:', error)
    }
  }

  // Set loading state
  setLoading(loading: boolean): void {
    this.sessionState.isLoading = loading
    this.notifyListeners()
  }

  // Subscribe to session changes
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call with current state
    listener(this.getState())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Notify all listeners
  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('❌ [SessionManager] Error in listener:', error)
      }
    })
  }

  // Get access token
  getAccessToken(): string | null {
    const session = this.getSession()
    return session?.accessToken || null
  }

  // Get refresh token
  getRefreshToken(): string | null {
    const session = this.getSession()
    return session?.refreshToken || null
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role === role
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser()
    return user ? roles.includes(user.role) : false
  }

  // Setup event listeners for tab close detection
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    // Handle tab/window close - DISABLED for development
    window.addEventListener('beforeunload', () => {
      // DISABLED: Auto-clear session on tab close for development convenience
      // if (this.CLEAR_ON_TAB_CLOSE && this.isAuthenticated()) {
      //   console.log('🔄 [SessionManager] Tab closing, clearing session...')
      //   this.clearSession()
      // }
      console.log('🔄 [SessionManager] Tab closing, but auto-clear is disabled for development')
    })

    // Handle page visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('🔄 [SessionManager] Tab hidden')
        // Optionally clear session when tab is hidden for a long time
        // this.scheduleSessionClear()
      } else {
        console.log('🔄 [SessionManager] Tab visible')
        // Verify session when tab becomes visible again
        if (this.isAuthenticated() && this.shouldVerifySession()) {
          this.updateLastChecked()
        }
      }
    })

    // Handle storage events (session cleared in another tab)
    window.addEventListener('storage', (event) => {
      if (event.key === this.SESSION_KEY && event.newValue === null) {
        console.log('🔄 [SessionManager] Session cleared in another tab')
        this.clearSession()
      }
    })
  }

  // Force clear session (can be called manually)
  forceLogout(): void {
    console.log('🔄 [SessionManager] Force logout initiated')
    this.clearSession()
  }

  // Enable/disable auto-clear on tab close - DISABLED for development
  setAutoCleanOnTabClose(enabled: boolean): void {
    // DISABLED: Auto-clear functionality is disabled for development convenience
    console.log(`🔄 [SessionManager] Auto-clear on tab close request: ${enabled ? 'enabled' : 'disabled'} (IGNORED - disabled for development)`)
  }
}

export const sessionManager = SessionManager.getInstance()
