/**
 * Mock Identity Service for Testing
 */

import type { User, ListUsersResponse, UserSession, ListSessionsResponse } from '../identityService';

export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  phoneNumber: '0123456789',
  role: 'PATIENT',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: '2024-01-15T10:00:00.000Z',
};

export const mockAdminUser: User = {
  id: 'admin-123',
  email: 'admin@example.com',
  fullName: 'Admin User',
  phoneNumber: '0987654321',
  role: 'ADMIN',
  isActive: true,
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockUsers: User[] = [
  mockAdminUser,
  mockUser,
  {
    id: 'doctor-123',
    email: 'doctor@example.com',
    fullName: 'Doctor User',
    phoneNumber: '0111222333',
    role: 'DOCTOR',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

export const mockListUsersResponse: ListUsersResponse = {
  success: true,
  users: mockUsers,
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  },
};

export const mockSession: UserSession = {
  id: 'session-123',
  userId: 'user-123',
  deviceInfo: {
    platform: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
  },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  expiresAt: '2024-12-31T23:59:59.000Z',
  isActive: true,
  isCurrent: true,
  createdAt: '2024-01-15T10:00:00.000Z',
  lastAccessedAt: '2024-01-15T12:00:00.000Z',
};

export const mockListSessionsResponse: ListSessionsResponse = {
  success: true,
  sessions: [mockSession],
  currentSessionId: 'session-123',
};

export const login = jest.fn().mockResolvedValue({
  success: true,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
});

export const register = jest.fn().mockResolvedValue({
  success: true,
  userId: 'user-123',
  email: 'test@example.com',
  message: 'Registration successful',
});

export const logout = jest.fn().mockResolvedValue(undefined);

export const refreshToken = jest.fn().mockResolvedValue({
  success: true,
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  user: mockUser,
});

export const getUser = jest.fn().mockResolvedValue(mockUser);

export const updateUser = jest.fn().mockResolvedValue(mockUser);

export const getUserPermissions = jest.fn().mockResolvedValue([
  'users:read',
  'users:write',
]);

export const checkPermission = jest.fn().mockResolvedValue(true);

export const forgotPassword = jest.fn().mockResolvedValue(undefined);

export const resetPassword = jest.fn().mockResolvedValue(undefined);

export const listUsers = jest.fn().mockResolvedValue(mockListUsersResponse);

export const deleteUser = jest.fn().mockResolvedValue(undefined);

export const listSessions = jest.fn().mockResolvedValue(mockListSessionsResponse);

export const terminateSession = jest.fn().mockResolvedValue(undefined);

export const terminateAllSessions = jest.fn().mockResolvedValue(undefined);

export const changePassword = jest.fn().mockResolvedValue(undefined);

export const enableMFA = jest.fn().mockResolvedValue({
  qrCode: 'data:image/png;base64,mock-qr-code',
  secret: 'MOCK-SECRET-KEY',
});

export const disableMFA = jest.fn().mockResolvedValue(undefined);

export const provisionStaff = jest.fn().mockResolvedValue({
  success: true,
  invitationToken: 'mock-token',
  invitationUrl: 'http://localhost:3000/auth/activate?token=mock-token',
  expiresAt: '2024-12-31T23:59:59.000Z',
});

export const acceptStaffInvitation = jest.fn().mockResolvedValue({
  success: true,
  userId: 'staff-123',
  email: 'staff@example.com',
  role: 'DOCTOR',
  message: 'Staff account activated',
});

