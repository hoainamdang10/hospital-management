jest.mock('uuid');

import { AuthenticateRequestUseCase } from '@application/use-cases/AuthenticateRequestUseCase';
import { ITokenVerifier, TokenVerificationResult } from '@domain/services/ITokenVerifier';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedUser } from '@domain/entities/AuthenticatedUser';
import { UserId } from '@domain/value-objects/UserId';

describe('AuthenticateRequestUseCase', () => {
  let useCase: AuthenticateRequestUseCase;
  let mockTokenVerifier: jest.Mocked<ITokenVerifier>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockUser: AuthenticatedUser;

  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const validAuthHeader = `Bearer ${validToken}`;

  beforeEach(() => {
    // Mock uuid.validate to always return true
    const { validate } = require('uuid');
    validate.mockReturnValue(true);

    mockUser = AuthenticatedUser.create({
      userId: UserId.create('550e8400-e29b-41d4-a716-446655440000'),
      email: 'test@example.com',
      roles: ['doctor'],
      permissions: ['patient:read'],
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000)
    });
    mockTokenVerifier = {
      verify: jest.fn(),
      verifyAndDecode: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new AuthenticateRequestUseCase(mockTokenVerifier, mockLogger);
  });

  describe('execute', () => {
    const validInput = {
      authorizationHeader: validAuthHeader,
      requestId: 'test-request-id',
      ip: '127.0.0.1',
      path: '/api/v1/patients'
    };

    it('should authenticate successfully with valid token', async () => {
      const mockResult: TokenVerificationResult = {
        success: true,
        user: mockUser
      };
      mockTokenVerifier.verify.mockResolvedValue(mockResult);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.userId).toBe(mockUser.userId.value);
      expect(result.user?.email).toBe(mockUser.email);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request authenticated successfully',
        expect.objectContaining({
          requestId: validInput.requestId,
          userId: mockUser.userId.value
        })
      );
    });

    it('should fail if authorization header is missing', async () => {
      const result = await useCase.execute({
        ...validInput,
        authorizationHeader: undefined
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing authorization header');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Missing authorization header',
        expect.any(Object)
      );
    });

    it('should fail if authorization header does not start with Bearer', async () => {
      const result = await useCase.execute({
        ...validInput,
        authorizationHeader: 'Basic abc123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid authorization header format - must be "Bearer <token>"');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should fail if token format is invalid', async () => {
      const result = await useCase.execute({
        ...validInput,
        authorizationHeader: 'Bearer invalid.token'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JWT token format');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid JWT token format',
        expect.any(Object)
      );
    });

    it('should fail if token verification fails', async () => {
      const mockResult: TokenVerificationResult = {
        success: false,
        error: 'Invalid signature'
      };
      mockTokenVerifier.verify.mockResolvedValue(mockResult);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token verification failed',
        expect.objectContaining({
          error: 'Invalid signature'
        })
      );
    });

    it('should fail if token is expired', async () => {
      const expiredUser = AuthenticatedUser.create({
        userId: UserId.create('550e8400-e29b-41d4-a716-446655440000'),
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: ['patient:read'],
        issuedAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000) // Expired 1 hour ago
      });

      const mockResult: TokenVerificationResult = {
        success: true,
        user: expiredUser
      };
      mockTokenVerifier.verify.mockResolvedValue(mockResult);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token expired',
        expect.any(Object)
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      mockTokenVerifier.verify.mockRejectedValue(new Error('Database connection failed'));

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal authentication error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Authentication error',
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });
  });
});

