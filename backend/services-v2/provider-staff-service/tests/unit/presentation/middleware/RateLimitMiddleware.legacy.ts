/**
 * RateLimitMiddleware Tests
 * Phase 3: Presentation Layer
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitMiddleware } from '../../../../src/presentation/middleware/RateLimitMiddleware';

describe('RateLimitMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/staff',
      method: 'GET',
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };

    nextFunction = jest.fn();

    // Clear rate limit store between tests
    jest.clearAllMocks();
  });

  describe('createRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5
      });

      // First request should pass
      await rateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      });

      await rateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        expect.any(Number)
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(Number)
      );
    });

    it('should block requests when rate limit exceeded', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      // Make requests up to the limit
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      // This should be blocked
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'TOO_MANY_REQUESTS'
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should track rate limits per IP address', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      // First IP - 2 requests
      mockRequest.ip = '127.0.0.1';
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      // Second IP - should still be allowed
      mockRequest.ip = '127.0.0.2';
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reset rate limit after time window', async () => {
      jest.useFakeTimers();

      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 1
      });

      // First request
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      // Second request - should be blocked
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(429);

      // Advance time past window
      jest.advanceTimersByTime(1001);

      // Third request - should be allowed
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('standardRateLimit', () => {
    it('should create standard rate limiter with default config', async () => {
      const rateLimiter = RateLimitMiddleware.standardRateLimit();

      await rateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('strictRateLimit', () => {
    it('should create strict rate limiter with lower limits', async () => {
      const rateLimiter = RateLimitMiddleware.strictRateLimit();

      await rateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authRateLimit', () => {
    it('should create auth-specific rate limiter', async () => {
      const rateLimiter = RateLimitMiddleware.authRateLimit();

      await rateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('skip function', () => {
    it('should skip rate limiting for whitelisted IPs', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skip: (req) => req.ip === '127.0.0.1' // Whitelist local IP
      });

      mockRequest.ip = '127.0.0.1';

      // Make multiple requests - should all pass
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('keyGenerator', () => {
    it('should use custom key generator', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => req.headers['x-api-key'] as string || req.ip!
      });

      // Use API key for rate limiting
      mockRequest.headers = { 'x-api-key': 'test-key' };

      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      // Should be rate limited
      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });
  });

  describe('handler function', () => {
    it('should use custom handler for rate limit exceeded', async () => {
      const customHandler = jest.fn();
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        handler: customHandler
      });

      // Exceed rate limit
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(customHandler).toHaveBeenCalled();
    });
  });

  describe('Vietnamese error messages', () => {
    it('should return Vietnamese error message when rate limit exceeded', async () => {
      const rateLimiter = RateLimitMiddleware.createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      });

      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      jest.clearAllMocks();
      await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('quá nhiều')
        })
      );
    });
  });
});
