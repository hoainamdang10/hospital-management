'use client';

import { apiClient, ApiResponse } from './client';

// Auth API Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient';
  phone_number?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  specialty?: string;
  license_number?: string;
  qualification?: string;
  department_id?: string;
  address?: any;
  emergency_contact?: any;
  insurance_info?: any;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  email_confirmed_at?: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  newPassword: string;
}

export interface VerifyTokenResponse {
  user?: AuthUser;
  error?: string;
}

// Auth API Service
export const authServiceApi = {
  // =====================================================
  // AUTHENTICATION ENDPOINTS
  // =====================================================

  // Sign up new user (no auth required)
  signUp: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/auth/signup', userData, false);
  },

  // Sign in existing user (no auth required)
  signIn: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/auth/signin', credentials, false);
  },

  // Sign out user
  signOut: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/signout');
  },

  // Send magic link for passwordless login
  sendMagicLink: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/magic-link', { email }, false);
  },

  // Send OTP to phone number
  sendPhoneOTP: async (phoneNumber: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/phone-otp', { phone_number: phoneNumber }, false);
  },

  // Verify phone OTP and sign in
  verifyPhoneOTP: async (phoneNumber: string, otpCode: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/auth/verify-otp', {
      phone_number: phoneNumber,
      otp_code: otpCode
    }, false);
  },

  // Initiate OAuth login
  initiateOAuth: async (provider: 'google' | 'github' | 'facebook' | 'apple'): Promise<ApiResponse<{ url: string }>> => {
    return apiClient.get<{ url: string }>(`/auth/oauth/${provider}`, false);
  },

  // Handle OAuth callback
  handleOAuthCallback: async (code: string, state: string, provider?: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/auth/oauth/callback', {
      code,
      state,
      provider
    }, false);
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<AuthUser>> => {
    return apiClient.get<AuthUser>('/auth/me');
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<AuthSession>> => {
    return apiClient.post<AuthSession>('/auth/refresh');
  },

  // Verify token
  verifyToken: async (token: string): Promise<ApiResponse<VerifyTokenResponse>> => {
    return apiClient.post<VerifyTokenResponse>('/auth/verify', { token });
  },

  // =====================================================
  // PASSWORD MANAGEMENT
  // =====================================================

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  // Update password
  updatePassword: async (data: UpdatePasswordData): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/update-password', data);
  },

  // =====================================================
  // USER MANAGEMENT
  // =====================================================

  // Get user profile
  getUserProfile: async (userId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/users/${userId}/profile`);
  },

  // Update user profile
  updateUserProfile: async (userId: string, profileData: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/users/${userId}/profile`, profileData);
  },

  // Deactivate user
  deactivateUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>(`/users/${userId}/deactivate`);
  },

  // Activate user
  activateUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>(`/users/${userId}/activate`);
  },

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  // Get all user sessions
  getUserSessions: async (userId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/sessions/user/${userId}`);
  },

  // Revoke session
  revokeSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/sessions/${sessionId}`);
  },

  // Revoke all sessions
  revokeAllSessions: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/sessions/user/${userId}/all`);
  },

  // =====================================================
  // ADMIN ENDPOINTS
  // =====================================================

  // Get all users (admin only)
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<{
    users: AuthUser[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    return apiClient.get<{
      users: AuthUser[];
      total: number;
      page: number;
      limit: number;
    }>('/users', params);
  },

  // Get user by ID (admin only)
  getUserById: async (userId: string): Promise<ApiResponse<AuthUser>> => {
    return apiClient.get<AuthUser>(`/users/${userId}`);
  },

  // Update user role (admin only)
  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.put<{ message: string }>(`/users/${userId}/role`, { role });
  },

  // Delete user (admin only)
  deleteUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/users/${userId}`);
  },
};

// Export for backward compatibility
export const authApi = authServiceApi;

// Helper functions
export const isAuthSuccess = (response: ApiResponse<any>): boolean => {
  return response.success && !response.error;
};

export const getAuthError = (response: ApiResponse<any>): string => {
  return response.error?.message || 'Unknown error occurred';
};

export const handleAuthError = (response: ApiResponse<any>): never => {
  throw new Error(getAuthError(response));
};
