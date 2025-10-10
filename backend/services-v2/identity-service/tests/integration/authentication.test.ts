jest.mock('@supabase/supabase-js', () => require('../helpers/mock-supabase-client'));

/**
 * Authentication Integration Tests
 * Tests for authentication flow using an in-memory Supabase mock.
 */

import { SupabaseAuthClient } from '../../src/infrastructure/auth/SupabaseAuthClient';
import { SupabaseUserRepository } from '../../src/infrastructure/repositories/SupabaseUserRepository';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn()
};

// Test configuration
const testConfig = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || 'test-secret'
};

const supabaseMock = require('@supabase/supabase-js') as typeof import('../helpers/mock-supabase-client');

const TEST_USER = {
  id: 'user-123',
  email: 'doctor@hospital.vn',
  password: 'Password123!',
  full_name: 'Dr. Integration Test',
  role_type: 'doctor'
};

const TEST_USER_EMAIL = TEST_USER.email;
const TEST_USER_PASSWORD = TEST_USER.password;
const TEST_USER_ID = TEST_USER.id;

describe('Authentication Integration Tests', () => {
  let authClient: SupabaseAuthClient;
  let userRepository: SupabaseUserRepository;

  beforeAll(() => {
    supabaseMock.__resetMock();
    supabaseMock.__seedUsers([
      {
        id: TEST_USER.id,
        email: TEST_USER.email,
        password: TEST_USER.password,
        full_name: TEST_USER.full_name,
        role_type: TEST_USER.role_type,
        is_verified: true,
        is_active: true
      }
    ]);

    authClient = new SupabaseAuthClient(testConfig, mockLogger);
    userRepository = new SupabaseUserRepository(
      testConfig.supabaseUrl,
      testConfig.supabaseServiceRoleKey,
      mockLogger
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock.__resetAuthState();
  });

  describe('Sign In', () => {
    it('should successfully sign in with valid credentials', async () => {
      const result = await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.email).toBe(TEST_USER_EMAIL);
      expect(result.sessionToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.roles).toBeDefined();
      expect(result.permissions).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const result = await authClient.signInWithPassword({
        email: 'invalid@hospital.vn',
        password: 'wrong-password'
      });

      expect(result.success).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('should fail with missing email', async () => {
      const result = await authClient.signInWithPassword({
        email: '',
        password: 'password123'
      });

      expect(result.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const result = await authClient.signInWithPassword({
        email: 'test@hospital.vn',
        password: ''
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', async () => {
      // First sign in to get a token
      const signInResult = await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      expect(signInResult.success).toBe(true);
      expect(signInResult.sessionToken).toBeDefined();

      // Verify the token
      const user = await authClient.verifyToken(signInResult.sessionToken!);

      expect(user).toBeDefined();
      expect(user?.email).toBe(TEST_USER_EMAIL);
    });

    it('should reject invalid token', async () => {
      const user = await authClient.verifyToken('invalid-token');
      expect(user).toBeNull();
    });

    it('should reject expired token', async () => {
      // Use a token that's clearly expired
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      const user = await authClient.verifyToken(expiredToken);
      expect(user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should refresh session with valid refresh token', async () => {
      // First sign in to get tokens
      const signInResult = await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      expect(signInResult.success).toBe(true);
      expect(signInResult.refreshToken).toBeDefined();

      // Refresh the session
      const refreshResult = await authClient.refreshSession(signInResult.refreshToken!);

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.sessionToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
    });

    it('should fail to refresh with invalid refresh token', async () => {
      const refreshResult = await authClient.refreshSession('invalid-refresh-token');
      expect(refreshResult.success).toBe(false);
    });
  });

  describe('Sign Out', () => {
    it('should call Supabase sign out without errors', async () => {
      await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      await expect(authClient.signOut()).resolves.toBeUndefined();
      expect(supabaseMock.__getSignOutCalls()).toBe(1);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('User Profile Loading', () => {
    it('should load user profile with roles and permissions', async () => {
      const result = await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      expect(result.success).toBe(true);
      expect(result.roles).toBeDefined();
      expect(result.roles!.length).toBeGreaterThan(0);
      expect(result.permissions).toBeDefined();
      expect(result.permissions).toEqual([]);
    });
  });

  describe('Permission Loading', () => {
    it('should load permissions from database', async () => {
      const permissions = await userRepository.getUserPermissions(
        { value: TEST_USER_ID } as any
      );

      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should return empty array for non-existent user', async () => {
      const permissions = await userRepository.getUserPermissions(
        { value: 'non-existent-user-id' } as any
      );

      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBe(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log successful login attempt', async () => {
      await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      // Check that logger was called
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log failed login attempt', async () => {
      await authClient.signInWithPassword({
        email: 'invalid@hospital.vn',
        password: 'wrong-password'
      });

      // Check that logger was called for error
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should record login audit entry and update last login', async () => {
      const ipAddress = '203.0.113.11';

      await authClient.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        ipAddress
      });

      const loginAttempts = supabaseMock.__getLoginAttempts();
      expect(loginAttempts.length).toBe(1);
      expect(loginAttempts[0]).toMatchObject({
        email: TEST_USER_EMAIL,
        ip_address: ipAddress,
        success: true
      });

      const rpcCalls = supabaseMock.__getRpcCalls();
      expect(
        rpcCalls.some(
          (call) => call.fn === 'auth_update_user_last_login' && call.payload?.user_id === TEST_USER_ID
        )
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Create client with invalid URL
      const invalidClient = new SupabaseAuthClient(
        {
          supabaseUrl: 'https://invalid-url-that-does-not-exist.supabase.co',
          supabaseServiceRoleKey: 'invalid-key',
          jwtSecret: 'test-secret'
        },
        mockLogger
      );

      const result = await invalidClient.signInWithPassword({
        email: 'test@hospital.vn',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle malformed credentials', async () => {
      const result = await authClient.signInWithPassword({
        email: 'not-an-email',
        password: '123'
      });

      expect(result.success).toBe(false);
    });
  });
});

