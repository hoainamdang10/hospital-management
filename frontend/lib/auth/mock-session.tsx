'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, MockSession, mockSessions } from '@/lib/mock';

interface AuthContextType {
  session: MockSession;
  setSession: (session: MockSession) => void;
  login: (role: Role) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<MockSession>(mockSessions.guest);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const savedSession = localStorage.getItem('hospital-mock-session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setSessionState(parsed);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Save session to localStorage when changed
  const setSession = (newSession: MockSession) => {
    setSessionState(newSession);
    try {
      localStorage.setItem('hospital-mock-session', JSON.stringify(newSession));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const login = (role: Role) => {
    const newSession = mockSessions[role];
    setSession(newSession);
  };

  const logout = () => {
    setSession(mockSessions.guest);
    localStorage.removeItem('hospital-mock-session');
  };

  return (
    <AuthContext.Provider value={{ session, setSession, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for session detection from URL params (for demo purposes)
export function useSessionFromUrl() {
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const mockRole = urlParams.get('role') as Role;
    
    if (mockRole && mockSessions[mockRole]) {
      login(mockRole);
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('role');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [login]);
}

// Supabase-compatible session interface (for future integration)
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
      role?: Role;
      avatar_url?: string;
    };
  };
}

// Mock Supabase client for development
export const mockSupabaseClient = {
  auth: {
    getSession: async (): Promise<{ data: { session: SupabaseSession | null } }> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const savedSession = localStorage.getItem('hospital-mock-session');
      if (!savedSession) {
        return { data: { session: null } };
      }

      try {
        const mockSession: MockSession = JSON.parse(savedSession);
        if (!mockSession.user) {
          return { data: { session: null } };
        }

        // Convert mock session to Supabase format
        const supabaseSession: SupabaseSession = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: {
            id: mockSession.user.id,
            email: mockSession.user.email,
            user_metadata: {
              name: mockSession.user.name,
              role: mockSession.user.role,
              avatar_url: mockSession.user.avatar,
            },
          },
        };

        return { data: { session: supabaseSession } };
      } catch (error) {
        console.error('Failed to parse session:', error);
        return { data: { session: null } };
      }
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication logic
      const { email, password } = credentials;
      
      // Test credentials
      const testCredentials = {
        'patient@hospital.com': { password: 'Patient123.', role: 'patient' as Role },
        'doctor@hospital.com': { password: 'Doctor123.', role: 'doctor' as Role },
        'admin@hospital.com': { password: 'Admin123.', role: 'admin' as Role },
      };

      const userCreds = testCredentials[email as keyof typeof testCredentials];
      
      if (!userCreds || userCreds.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' },
        };
      }

      const mockSession = mockSessions[userCreds.role];
      localStorage.setItem('hospital-mock-session', JSON.stringify(mockSession));

      return {
        data: {
          user: mockSession.user,
          session: mockSession,
        },
        error: null,
      };
    },

    signUp: async (credentials: { email: string; password: string; options?: { data?: any } }) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { email, password, options } = credentials;
      const role = options?.data?.role || 'patient';

      // Create new mock user
      const newUser = {
        id: `${role.toUpperCase()}-${Date.now()}`,
        email,
        name: options?.data?.name || email.split('@')[0],
        role: role as Role,
        avatar: '/placeholder.svg?height=40&width=40',
      };

      const newSession: MockSession = { user: newUser };
      localStorage.setItem('hospital-mock-session', JSON.stringify(newSession));

      return {
        data: {
          user: newUser,
          session: newSession,
        },
        error: null,
      };
    },

    signOut: async () => {
      localStorage.removeItem('hospital-mock-session');
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock auth state change listener
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'hospital-mock-session') {
          const session = e.newValue ? JSON.parse(e.newValue) : null;
          callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
            },
          },
        },
      };
    },
  },
};

// Hook for Supabase-style auth
export function useSupabaseAuth() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    mockSupabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = mockSupabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    loading,
    signIn: mockSupabaseClient.auth.signInWithPassword,
    signUp: mockSupabaseClient.auth.signUp,
    signOut: mockSupabaseClient.auth.signOut,
  };
}
