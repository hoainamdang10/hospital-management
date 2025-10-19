'use client';

/**
 * Authentication Context Provider
 * Manages global authentication state
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AuthState,
  AuthContextValue,
  User,
  LoginRequest,
  RegisterRequest,
} from '@/modules/identity/types';
import * as identityService from '@/modules/identity/services/identityService';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hospital_auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const { user, accessToken, refreshToken } = JSON.parse(stored);
          setState({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage and cookies
  const saveAuthState = useCallback((user: User, accessToken: string, refreshToken: string) => {
    const authData = { user, accessToken, refreshToken };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

    // Also save to cookie for middleware
    document.cookie = `${AUTH_STORAGE_KEY}=${accessToken}; path=/; max-age=86400; SameSite=Strict`;

    setState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }, []);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    // Also clear cookie
    document.cookie = `${AUTH_STORAGE_KEY}=; path=/; max-age=0`;

    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await identityService.login(credentials);
      saveAuthState(response.user, response.accessToken, response.refreshToken);
      
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [router, saveAuthState]);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await identityService.register(data);

      // Don't auto-login, redirect to verify-email page
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [router]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (state.accessToken) {
        await identityService.logout(state.accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
      router.push('/login');
    }
  }, [state.accessToken, clearAuthState, router]);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await identityService.refreshToken(state.refreshToken);
      saveAuthState(response.user, response.accessToken, response.refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
      router.push('/login');
    }
  }, [state.refreshToken, saveAuthState, clearAuthState, router]);

  // Update user
  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      if (!state.user || !state.accessToken) {
        throw new Error('Not authenticated');
      }

      const updatedUser = await identityService.updateUser(
        state.user.id,
        updates,
        state.accessToken
      );

      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      // Update localStorage
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        authData.user = updatedUser;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.user, state.accessToken]);

  // Check permission
  const checkPermission = useCallback(async (resource: string, action: string): Promise<boolean> => {
    try {
      if (!state.user || !state.accessToken) {
        return false;
      }

      return await identityService.checkPermission(
        state.user.id,
        resource,
        action,
        state.accessToken
      );
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }, [state.user, state.accessToken]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    checkPermission,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

