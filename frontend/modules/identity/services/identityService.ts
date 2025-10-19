/**
 * Identity Service API Client
 * Handles all API calls to Identity Service (Port 3021)
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_IDENTITY_SERVICE_URL || 'http://localhost:3021';

export interface LoginRequest {
  email: string;
  password: string;
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

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  userId?: string;
  email?: string;
  message: string;
  requiresEmailVerification?: boolean;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Login user
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Register new user
 * Returns RegisterResponse (no JWT token, requires email verification)
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logout(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Logout failed');
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Token refresh failed');
  }

  return response.json();
}

/**
 * Get user by ID
 */
export async function getUser(userId: string, accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  const data = await response.json();
  return data.user;
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>,
  accessToken: string
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }

  const data = await response.json();
  return data.user;
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string, accessToken: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/permissions/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch permissions');
  }

  const data = await response.json();
  return data.permissions;
}

/**
 * Check if user has permission
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/v1/permissions/check`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, resource, action }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.allowed;
}

/**
 * Forgot password
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to send reset email');
  }
}

/**
 * Reset password
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }
}

// ==================== STAFF INVITATION ENDPOINTS ====================

export interface ProvisionStaffRequest {
  email: string;
  fullName: string;
  roleType: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  phoneNumber?: string;
}

export interface ProvisionStaffResponse {
  success: boolean;
  invitationToken?: string;
  invitationUrl?: string;
  expiresAt?: string;
  error?: string;
  errorCode?: string;
}

export interface AcceptStaffInvitationRequest {
  invitationToken: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AcceptStaffInvitationResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Provision staff account (Admin only)
 * Creates staff invitation and sends email
 */
export async function provisionStaff(
  data: ProvisionStaffRequest,
  accessToken: string
): Promise<ProvisionStaffResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/staff/register`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to provision staff');
  }

  return response.json();
}

/**
 * Accept staff invitation (Public)
 * Staff activates account by setting password
 */
export async function acceptStaffInvitation(
  data: AcceptStaffInvitationRequest
): Promise<AcceptStaffInvitationResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/activate-staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to activate staff account');
  }

  return response.json();
}

// ==================== USER MANAGEMENT ENDPOINTS ====================

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  roleType?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export interface ListUsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List all users (Admin only)
 */
export async function listUsers(
  params: ListUsersRequest,
  accessToken: string
): Promise<ListUsersResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.roleType) queryParams.append('roleType', params.roleType);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params.searchTerm) queryParams.append('search', params.searchTerm);

  const response = await fetch(`${API_BASE_URL}/api/v1/users?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to list users');
  }

  return response.json();
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(
  userId: string,
  accessToken: string,
  hardDelete: boolean = false,
  reason?: string
): Promise<void> {
  const queryParams = new URLSearchParams();
  if (hardDelete) queryParams.append('hard', 'true');

  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}?${queryParams}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: reason ? JSON.stringify({ reason }) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
}

// ==================== SESSION MANAGEMENT ENDPOINTS ====================

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    platform?: string;
    browser?: string;
    os?: string;
  };
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  lastAccessedAt: string;
}

export interface ListSessionsResponse {
  success: boolean;
  sessions: UserSession[];
  currentSessionId: string;
}

/**
 * List active sessions for user
 */
export async function listSessions(
  userId: string,
  accessToken: string
): Promise<ListSessionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to list sessions');
  }

  return response.json();
}

/**
 * Terminate a specific session
 */
export async function terminateSession(
  userId: string,
  sessionId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to terminate session');
  }
}

/**
 * Terminate all sessions except current
 */
export async function terminateAllSessions(
  userId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/sessions`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to terminate all sessions');
  }
}

// ==================== PASSWORD & SECURITY ENDPOINTS ====================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(
  userId: string,
  data: ChangePasswordRequest,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
}

/**
 * Enable MFA
 */
export async function enableMFA(
  userId: string,
  accessToken: string
): Promise<{ qrCode: string; secret: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/mfa/enable`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to enable MFA');
  }

  return response.json();
}

/**
 * Disable MFA
 */
export async function disableMFA(
  userId: string,
  password: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/mfa/disable`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to disable MFA');
  }
}

