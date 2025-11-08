import apiClient from './axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/lib/types/auth';

/**
 * Authentication Service
 * Handles all auth-related API calls to Identity Service
 */
export const authService = {
  /**
   * Login user
   * POST /auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', data);
    return response.data;
  },

  /**
   * Logout user
   * POST /auth/logout
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/auth/logout');
    return response.data;
  },

  /**
   * Verify email
   * POST /auth/verify-email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Request password reset
   * POST /auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Change password (authenticated)
   * POST /auth/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  /**
   * Get current user profile
   * GET /auth/me
   */
  async getCurrentUser(): Promise<LoginResponse['user']> {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },
};
