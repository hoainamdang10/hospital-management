/**
 * @deprecated THIS FILE IS DEPRECATED!
 * 
 * DO NOT USE - Use auth.service.ts instead
 * 
 * This file uses localStorage-based authentication which has been replaced
 * with session-based authentication using HTTP-only cookies.
 * 
 * Migration path: Use auth.service.ts from './auth.service'
 */

import apiClient from './client';
import { STORAGE_KEYS } from '@/lib/constants';
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';

/**
 * @deprecated Authentication API Service - USE auth.service.ts INSTEAD
 */

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await apiClient.post('/api/v1/auth/login', credentials);
    return response.data.data;
  },

  /**
   * Register new patient
   */
  async register(data: RegisterData): Promise<{ user: User }> {
    const response = await apiClient.post('/api/v1/auth/register', data);
    return response.data.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
    return response.data.data;
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.get(`/api/v1/auth/verify-email?token=${token}`);
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/resend-verification', { email });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/auth/reset-password', { token, newPassword });
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data.data;
  },

  /**
   * Enable MFA
   */
  async enableMfa(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiClient.post('/api/v1/auth/mfa/enable');
    return response.data.data;
  },

  /**
   * Disable MFA
   */
  async disableMfa(mfaCode: string): Promise<void> {
    await apiClient.post('/api/v1/auth/mfa/disable', { mfaCode });
  },

  /**
   * Verify MFA code
   */
  async verifyMfa(mfaCode: string): Promise<void> {
    await apiClient.post('/api/v1/auth/mfa/verify', { mfaCode });
  },
};

/**
 * Store auth tokens in localStorage
 */
export function storeAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * Store user data in localStorage
 */
export function storeUserData(user: User): void {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getStoredUserData(): User | null {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Clear all auth data
 */
export function clearAuthData(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}
