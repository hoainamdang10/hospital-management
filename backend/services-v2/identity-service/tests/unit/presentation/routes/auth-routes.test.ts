/**
 * Auth Routes Unit Tests
 * Unit tests for authentication routes with mocked dependencies
 *
 * NOTE: These are UNIT tests, not integration tests.
 * For integration tests with real database, see tests/integration/
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import express, { Application } from 'express';
import { createAuthRoutes } from '../../src/presentation/routes/auth.routes';
import { RouteDependencies } from '../../src/presentation/routes/types';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn()
};

// Mock use cases
const mockAuthenticateUserUseCase = {
  execute: jest.fn()
};

const mockRegisterUserUseCase = {
  execute: jest.fn()
};

const mockForgotPasswordUseCase = {
  execute: jest.fn()
};

const mockResetPasswordUseCase = {
  execute: jest.fn()
};

const mockVerifyEmailUseCase = {
  execute: jest.fn()
};

const mockLogoutUserUseCase = {
  execute: jest.fn()
};

const mockEnableMFAUseCase = {
  execute: jest.fn()
};

const mockVerifyMFAUseCase = {
  execute: jest.fn()
};

const mockDisableMFAUseCase = {
  execute: jest.fn()
};

const mockRefreshTokenUseCase = {
  execute: jest.fn()
};

const mockAcceptStaffInvitationUseCase = {
  execute: jest.fn()
};

// Create test app
function createTestApp(): Application {
  const app = express();
  app.use(express.json());

  const deps: RouteDependencies = {
    authenticateUserUseCase: mockAuthenticateUserUseCase as any,
    registerUserUseCase: mockRegisterUserUseCase as any,
    forgotPasswordUseCase: mockForgotPasswordUseCase as any,
    resetPasswordUseCase: mockResetPasswordUseCase as any,
    verifyEmailUseCase: mockVerifyEmailUseCase as any,
    logoutUserUseCase: mockLogoutUserUseCase as any,
    enableMFAUseCase: mockEnableMFAUseCase as any,
    verifyMFAUseCase: mockVerifyMFAUseCase as any,
    disableMFAUseCase: mockDisableMFAUseCase as any,
    refreshTokenUseCase: mockRefreshTokenUseCase as any,
    acceptStaffInvitationUseCase: mockAcceptStaffInvitationUseCase as any,
    getUserUseCase: {} as any,
    updateUserUseCase: {} as any,
    deleteUserUseCase: {} as any,
    listUsersUseCase: {} as any,
    provisionStaffUseCase: {} as any,
    assignRoleUseCase: {} as any,
    lockAccountUseCase: {} as any,
    unlockAccountUseCase: {} as any,
    listActiveSessionsUseCase: {} as any,
    terminateSessionUseCase: {} as any,
    terminateAllSessionsUseCase: {} as any,
    getPasswordPolicyUseCase: {} as any,
    updatePasswordPolicyUseCase: {} as any,
    getRecoveryMethodsUseCase: {} as any,
    updateRecoveryMethodsUseCase: {} as any,
    getRecoveryHistoryUseCase: {} as any,
    checkPermissionUseCase: {} as any,
    authMiddleware: {} as any,
    permissionMiddleware: {} as any
  };

  const authRoutes = createAuthRoutes(deps);
  app.use('/auth', authRoutes);

  return app;
}

describe('Auth Routes Unit Tests', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        userId: 'user-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        roles: ['PATIENT'],
        permissions: ['patients:read'],
        expiresAt: new Date(),
        mode: 'NORMAL'
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'patient@hospital.vn',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('user-123');
      expect(response.body.accessToken).toBeDefined();
      expect(mockAuthenticateUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'patient@hospital.vn',
          password: 'Password123!'
        })
      );
    });

    it('should fail with invalid credentials', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
        mode: 'NORMAL'
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid@hospital.vn',
          password: 'wrong-password'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing email', async () => {
      const mockResponse = {
        success: false,
        error: 'Email is required',
        mode: 'NORMAL'
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const mockResponse = {
        success: false,
        error: 'Password is required',
        mode: 'NORMAL'
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'patient@hospital.vn'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle MFA code when provided', async () => {
      const mockResponse = {
        success: true,
        userId: 'user-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        roles: ['DOCTOR'],
        permissions: ['patients:read', 'patients:write'],
        expiresAt: new Date(),
        mode: 'NORMAL'
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'doctor@hospital.vn',
          password: 'Password123!',
          mfaCode: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockAuthenticateUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          mfaCode: '123456'
        })
      );
    });

    it('should handle system errors gracefully', async () => {
      mockAuthenticateUserUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'patient@hospital.vn',
          password: 'Password123!'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Lỗi hệ thống, vui lòng thử lại sau');
    });
  });

  describe('POST /auth/register', () => {
    it('should successfully register a new patient', async () => {
      const mockResponse = {
        success: true,
        userId: 'user-456',
        message: 'Registration successful'
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newpatient@hospital.vn',
          password: 'Password123!',
          fullName: 'Nguyễn Văn A',
          phoneNumber: '0901234567',
          citizenId: '001234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          address: 'Hà Nội'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe('user-456');
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newpatient@hospital.vn',
          roleType: 'PATIENT'
        })
      );
    });

    it('should force PATIENT role regardless of input', async () => {
      const mockResponse = {
        success: true,
        userId: 'user-789',
        message: 'Registration successful'
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'hacker@hospital.vn',
          password: 'Password123!',
          fullName: 'Hacker',
          roleType: 'ADMIN'
        });

      expect(response.status).toBe(201);
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          roleType: 'PATIENT'
        })
      );
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset email sent'
      };

      mockForgotPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'patient@hospital.vn'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockForgotPasswordUseCase.execute).toHaveBeenCalledWith({
        email: 'patient@hospital.vn'
      });
    });

    it('should fail with invalid email format', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid email format'
      };

      mockForgotPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not reveal if email exists (security)', async () => {
      const mockResponse = {
        success: true,
        message: 'If email exists, password reset email will be sent'
      };

      mockForgotPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@hospital.vn'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should successfully reset password with valid token', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset successful'
      };

      mockResetPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith({
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      });
    });

    it('should fail with mismatched passwords', async () => {
      const mockResponse = {
        success: false,
        error: 'Passwords do not match'
      };

      mockResetPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const mockResponse = {
        success: false,
        error: 'Password does not meet policy requirements'
      };

      mockResetPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          accessToken: 'valid-access-token',
          refreshToken: 'valid-refresh-token',
          newPassword: 'weak',
          confirmPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      const mockResponse = {
        success: false,
        error: 'Reset token has expired'
      };

      mockResetPasswordUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          accessToken: 'expired-token',
          refreshToken: 'expired-refresh-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should successfully verify email with valid token', async () => {
      const mockResponse = {
        success: true,
        message: 'Email verified successfully'
      };

      mockVerifyEmailUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          email: 'patient@hospital.vn',
          token: 'valid-verification-token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith({
        email: 'patient@hospital.vn',
        token: 'valid-verification-token'
      });
    });

    it('should fail with invalid token', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid verification token'
      };

      mockVerifyEmailUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          email: 'patient@hospital.vn',
          token: 'invalid-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      const mockResponse = {
        success: false,
        error: 'Verification token has expired'
      };

      mockVerifyEmailUseCase.execute.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          email: 'patient@hospital.vn',
          token: 'expired-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

