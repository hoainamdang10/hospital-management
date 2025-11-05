import { apiClient } from "../../services/api/client";

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    department?: string;
    specialization?: string;
    phone?: string;
  };
  token: string;
  refreshToken?: string;
  requiresMfa?: boolean;
  mfaMethod?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<{
    success: boolean;
    data?: LoginResponse;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await apiClient.post<LoginResponse>(
        "/identity-service/auth/login",
        credentials
      );

      if (response.success && response.data) {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }
          localStorage.setItem(
            "hospital_user",
            JSON.stringify(response.data.user)
          );
        }
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/identity-service/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("hospital_user");
    }
  }

  async register(data: RegisterRequest): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> {
    return apiClient.post("/identity-service/auth/register", data);
  }

  async refreshToken(): Promise<{
    success: boolean;
    data?: { token: string; refreshToken?: string };
    error?: string;
  }> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return { success: false, error: "No refresh token" };
    }

    const response = await apiClient.post<{
      token: string;
      refreshToken?: string;
    }>("/identity-service/auth/refresh", { refreshToken });

    if (response.success && response.data) {
      localStorage.setItem("token", response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
    }

    return response;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("hospital_user");
    return !!token && !!user;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem("hospital_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentToken(): string | null {
    return localStorage.getItem("token");
  }

  isMfaEnabled(): boolean {
    const user = this.getCurrentUser();
    return user?.mfaEnabled || false;
  }

  async verifyMfa(
    userId: string,
    code: string,
    attemptType?: "login" | "enable" | "disable",
    method?: string
  ): Promise<{
    success: boolean;
    data?: LoginResponse;
    error?: string;
  }> {
    // Fixed: Endpoint should be /auth/mfa/verify not /auth/verify-mfa
    return apiClient.post("/identity-service/auth/mfa/verify", {
      userId,
      code,
      attemptType: attemptType || "login",
      method: method || "2fa_app",
    });
  }

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.post("/identity-service/auth/forgot-password", { email });
  }

  async resetPassword(
    accessToken: string,
    refreshToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    // Fixed: Backend expects accessToken, refreshToken, newPassword, confirmPassword
    return apiClient.post("/identity-service/auth/reset-password", {
      accessToken,
      refreshToken,
      newPassword,
      confirmPassword,
    });
  }

  // Email Verification
  async verifyEmail(token: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.get(`/identity-service/auth/verify-email?token=${token}`);
  }

  async verifyEmailByCode(
    email: string,
    code: string
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.post("/identity-service/auth/verify-email", {
      email,
      code,
    });
  }

  async resendVerification(email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.post("/identity-service/auth/resend-verification", {
      email,
    });
  }

  // MFA Management
  async enableMfa(
    userId: string,
    method: "2fa_app" | "sms" | "email" = "2fa_app"
  ): Promise<{
    success: boolean;
    data?: { qrCode?: string; secret?: string; backupCodes?: string[] };
    error?: string;
    message?: string;
  }> {
    return apiClient.post("/identity-service/auth/mfa/enable", {
      userId,
      method,
    });
  }

  async disableMfa(
    userId: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.post("/identity-service/auth/mfa/disable", {
      userId,
      password,
    });
  }

  // Staff Activation
  async activateStaff(
    token: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return apiClient.post("/identity-service/auth/activate-staff", {
      token,
      password,
    });
  }
}

export const authService = new AuthService();
