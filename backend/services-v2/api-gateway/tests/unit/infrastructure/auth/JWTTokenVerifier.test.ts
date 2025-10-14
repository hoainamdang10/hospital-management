jest.mock('uuid');

import { JWTTokenVerifier, JWTPayload } from '@infrastructure/auth/JWTTokenVerifier';
import { JWTToken } from '@domain/value-objects/JWTToken';
import { ILogger } from '@application/services/ILogger';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JWTTokenVerifier', () => {
  let verifier: JWTTokenVerifier;
  let mockLogger: jest.Mocked<ILogger>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  const config = {
    jwtSecret: 'test-secret',
    jwtIssuer: 'hospital-management-system',
    jwtAudience: 'api-gateway'
  };

  const validPayload: JWTPayload = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    roles: ['doctor'],
    permissions: ['patient:read', 'patient:write'],
    sessionId: '660e8400-e29b-41d4-a716-446655440000',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const validToken = JWTToken.create('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    verifier = new JWTTokenVerifier(config, mockLogger);
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('should verify valid token successfully', async () => {
      // Mock uuid.validate to always return true for this test
      const { validate } = require('uuid');
      validate.mockReturnValue(true);

      mockJwt.verify.mockReturnValue(validPayload as any);

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.userId.value).toBe(validPayload.userId);
      expect(result.user?.email).toBe(validPayload.email);
      expect(result.user?.roles).toEqual(validPayload.roles);
      expect(result.user?.permissions).toEqual(validPayload.permissions);
      
      expect(mockJwt.verify).toHaveBeenCalledWith(
        validToken.value,
        config.jwtSecret,
        {
          issuer: config.jwtIssuer,
          audience: config.jwtAudience
        }
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Token verified successfully',
        expect.objectContaining({
          userId: validPayload.userId,
          email: validPayload.email
        })
      );
    });

    it('should fail if token payload is missing userId', async () => {
      const invalidPayload = { ...validPayload, userId: undefined };
      mockJwt.verify.mockReturnValue(invalidPayload as any);

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token payload - missing required fields');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid JWT payload - missing required fields',
        expect.any(Object)
      );
    });

    it('should fail if token payload is missing email', async () => {
      const invalidPayload = { ...validPayload, email: undefined };
      mockJwt.verify.mockReturnValue(invalidPayload as any);

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token payload - missing required fields');
    });

    it('should fail if token payload is missing roles', async () => {
      const invalidPayload = { ...validPayload, roles: undefined };
      mockJwt.verify.mockReturnValue(invalidPayload as any);

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token payload - missing required fields');
    });

    it('should fail if token payload is missing permissions', async () => {
      const invalidPayload = { ...validPayload, permissions: undefined };
      mockJwt.verify.mockReturnValue(invalidPayload as any);

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token payload - missing required fields');
    });

    it('should handle expired token', async () => {
      const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
      mockJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token expired',
        expect.objectContaining({
          expiredAt: expiredError.expiredAt
        })
      );
    });

    it('should handle invalid token signature', async () => {
      // Create a proper error object that matches jwt.JsonWebTokenError
      const invalidError = Object.create(jwt.JsonWebTokenError.prototype);
      invalidError.message = 'invalid signature';
      invalidError.name = 'JsonWebTokenError';

      mockJwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token: invalid signature');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid token',
        expect.objectContaining({
          error: 'invalid signature'
        })
      );
    });

    it('should handle unexpected errors', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await verifier.verify(validToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token verification failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Token verification error',
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });
  });

  describe('verifyAndDecode', () => {
    it('should verify and decode valid token string', async () => {
      // Mock uuid.validate to always return true for this test
      const { validate } = require('uuid');
      validate.mockReturnValue(true);

      mockJwt.verify.mockReturnValue(validPayload as any);

      const result = await verifier.verifyAndDecode(validToken.value);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.userId.value).toBe(validPayload.userId);
    });

    it('should fail for invalid token format', async () => {
      const result = await verifier.verifyAndDecode('invalid.token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token format');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid token format',
        expect.any(Object)
      );
    });
  });

  describe('issuer and audience validation', () => {
    it('should validate issuer and audience', async () => {
      mockJwt.verify.mockReturnValue(validPayload as any);

      await verifier.verify(validToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        validToken.value,
        config.jwtSecret,
        expect.objectContaining({
          issuer: config.jwtIssuer,
          audience: config.jwtAudience
        })
      );
    });

    it('should work without issuer and audience', async () => {
      const verifierWithoutIssuer = new JWTTokenVerifier(
        { jwtSecret: 'test-secret' },
        mockLogger
      );

      mockJwt.verify.mockReturnValue(validPayload as any);

      await verifierWithoutIssuer.verify(validToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        validToken.value,
        'test-secret',
        expect.objectContaining({
          issuer: undefined,
          audience: undefined
        })
      );
    });
  });
});

