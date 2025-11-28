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
 * Handles all auth-related API calls via API Gateway
 * Routes: /auth/* (proxied to Identity Service)
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
   * Get current user from session
   * GET /auth/me
   */
  async getCurrentUser(): Promise<{ success: boolean; user: any }> {
    const response = await apiClient.get('/auth/me');
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
   * GET /auth/verify-email?token=xxx
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.get(`/auth/verify-email?token=${data.token}`);
    return response.data;
  },

  /**
   * Request password reset
   * POST /auth/forgot-password
   */
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<{ success: boolean; message: string }> {
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
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  async inviteStaffAdmin(data: {
    email: string;
    fullName: string;
    roleType: 'doctor' | 'receptionist' | 'admin';
    phoneNumber?: string;
    // professional fields (flattened) to avoid fallback profile
    departmentCode?: string;
    specialization?: string;
    specializationCode?: string;
    specializationName?: string;
    title?: string;
    position?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    education?: string[];
    bio?: string;
    departmentName?: string;
    employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern' | 'volunteer';
    workSchedule?: {
      workingDays?: string[];
      workingHours?: { start?: string; end?: string };
      timeZone?: string;
      isFlexible?: boolean;
    };
  }): Promise<{ success: boolean; invitationUrl?: string; expiresAt?: string; message?: string }> {
    const response = await apiClient.post('/admin/staff/register', data);
    return response.data;
  },

  async validateInvitation(
    token: string
  ): Promise<{ success: boolean; isValid: boolean; invitationData?: any }> {
    const response = await apiClient.get(
      `/auth/validate-invitation?token=${encodeURIComponent(token)}`
    );
    return response.data;
  },

  async activateStaff(data: {
    invitationToken: string;
    password: string;
    confirmPassword: string;
    fullName?: string;
    phoneNumber?: string;
  }): Promise<{
    success: boolean;
    user: { id: string; email: string; role: string };
    accessToken?: string;
    refreshToken?: string;
  }> {
    const response = await apiClient.post('/auth/activate-staff', data);
    return response.data;
  },

  async listStaffInvitations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    email?: string;
  }): Promise<{
    success: boolean;
    invitations: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/admin/staff/invitations', { params });
    return response.data;
  },

  async getStaffInvitation(id: string): Promise<{ success: boolean; invitation: any }> {
    const response = await apiClient.get(`/admin/staff/invitations/${id}`);
    return response.data;
  },

  async cancelStaffInvitation(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/admin/staff/invitations/${id}`, { data: { reason } });
    return response.data;
  },

  async resendStaffInvitation(
    id: string
  ): Promise<{ success: boolean; invitationUrl?: string; expiresAt?: string; message?: string }> {
    const response = await apiClient.post(`/admin/staff/invitations/${id}/resend`);
    return response.data;
  },
};
