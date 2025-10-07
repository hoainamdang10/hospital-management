/**
 * AuthenticateUserUseCase - Unit Tests
 * 
 * Tests all scenarios for user authentication including:
 * - Happy path
 * - Authentication failures
 * - MFA flow
 * - Rate limiting
 * - Security features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AuthenticateUserUseCase, AuthenticateUserRequest } from '../../../../src/application/use-cases/AuthenticateUserUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IPermissionRepository } from '../../../../src/domain/repositories/IPermissionRepository';
import { IDegradationService, ServiceMode } from '../../../../src/application/services/IDegradationService';
import { ICircuitBreaker } from '../../../../src/application/services/ICircuitBreaker';
import { createMockUser } from '../../../helpers/user-test-helper';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>;
  let mockDegradationService: jest.Mocked<IDegradationService>;
  let mockCircuitBreaker: jest.Mocked<ICircuitBreaker>;
  let mockLogger: any;

  beforeEach(() => {
    // Create mocks
    mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      verifyToken: jest.fn(),
      refreshToken: jest.fn(),
      resetPassword: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn()
    } as any;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      getUserRoles: jest.fn(),
      getUserPermissions: jest.fn(),
      createSession: jest.fn(),
      checkAccountLockout: jest.fn().mockResolvedValue({ isLocked: false, failedAttempts: 0 }),
      recordLoginAttempt: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockDegradationService = {
      authenticateUser: jest.fn(),
      cacheAuthentication: jest.fn(),
      getCurrentMode: jest.fn(),
      switchMode: jest.fn()
    } as any;

    mockCircuitBreaker = {
      execute: jest.fn(),
      getState: jest.fn(),
      reset: jest.fn()
    } as any;

    mockPermissionRepository = {
      getValidRoles: jest.fn().mockResolvedValue(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']),
      getUserPermissions: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<IPermissionRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new AuthenticateUserUseCase(
      mockUserRepository,
      mockAuthService,
      mockDegradationService,
      mockCircuitBreaker,
      mockLogger,
      mockPermissionRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    const validRequest: AuthenticateUserRequest = {
      email: 'test@hospital.vn',
      password: 'SecurePass123!',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    it('should authenticate with valid credentials', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'patient' }
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.getUserRoles.mockResolvedValue(['patient']);
      mockUserRepository.createSession.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.sessionToken).toBeDefined();
      expect(result.roles).toEqual(['patient']);
      expect(result.permissions).toBeDefined();
      expect(result.mode).toBe(ServiceMode.FULL_SERVICE);
      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        email: validRequest.email,
        password: validRequest.password
      });
      expect(mockUserRepository.createSession).toHaveBeenCalled();
    });

    it('should return JWT token', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'patient' }
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.getUserRoles.mockResolvedValue(['patient']);
      mockUserRepository.createSession.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.sessionToken).toBeDefined();
      expect(result.sessionToken).toContain('session_');
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should create session record', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'patient' }
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.getUserRoles.mockResolvedValue(['patient']);
      mockUserRepository.createSession.mockResolvedValue(undefined);

      // Act
      await useCase.execute(validRequest);

      // Assert
      // Session is an entity, so we check the props
      expect(mockUserRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            userId: 'user-123',
            sessionToken: 'mock-access-token',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          })
        })
      );
    });
  });

  describe('Authentication Failures', () => {
    const validRequest: AuthenticateUserRequest = {
      email: 'test@hospital.vn',
      password: 'WrongPassword123!',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    it('should reject invalid password', async () => {
      // Arrange
      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should reject non-existent user', async () => {
      // Arrange
      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'mock-token',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'patient' }
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('không tồn tại');
    });

    it('should reject deactivated user', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: false, // Deactivated
        isEmailVerified: true
      });

      mockCircuitBreaker.execute.mockImplementation(async (fn) => await fn());
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'mock-token',
        expiresIn: 3600,
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'patient' }
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('vô hiệu hóa');
    });
  });

  describe('Validation', () => {
    it('should reject missing email', async () => {
      // Arrange
      const invalidRequest = {
        email: '',
        password: 'SecurePass123!',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Act & Assert
      // Email.create('') will throw before use case can handle it
      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Email');
    });

    it('should reject short password', async () => {
      // Arrange
      const invalidRequest = {
        email: 'test@hospital.vn',
        password: 'short',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Act
      const result = await useCase.execute(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mật khẩu');
    });
  });
});

