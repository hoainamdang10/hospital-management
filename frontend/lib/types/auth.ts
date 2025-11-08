// Authentication Types
// Based on Identity Service API

export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  userId: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
  role?: UserRole;
  acceptTerms: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  pendingRegistrationId?: string; // For verify-first approach
  email?: string;
  requiresEmailVerification: boolean; // Always true for verify-first
  user?: User; // Only present after email verification (legacy)
  accessToken?: string; // Only present after email verification (legacy)
  refreshToken?: string; // Only present after email verification (legacy)
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}
