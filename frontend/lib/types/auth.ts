// Authentication Types
// Based on Identity Service API

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

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
  staffId?: string;
  patientId?: string; // PAT-202511-XXX format
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  roles?: string[]; // Backend returns roles array
  userId?: string; // Backend returns userId
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
  accessToken: string;
  refreshToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  invalidateOtherSessions?: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}
