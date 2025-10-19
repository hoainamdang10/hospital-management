/**
 * Identity Module TypeScript Types
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT';

export interface UserProfile extends User {
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  avatar?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  roleType: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'admin';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

export interface RegisterResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Password Management Types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Permission Types
export interface Permission {
  resource: string;
  action: string;
}

export interface CheckPermissionRequest {
  userId: string;
  resource: string;
  action: string;
}

export interface CheckPermissionResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

export interface UserPermissions {
  userId: string;
  permissions: string[];
  roles: string[];
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Auth Context Types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  clearError: () => void;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  touched: Record<string, boolean>;
}

// UI Component Props Types
export interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  defaultRole?: 'patient' | 'doctor' | 'nurse' | 'receptionist';
}

export interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
  editable?: boolean;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

