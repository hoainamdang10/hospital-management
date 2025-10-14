import { Response, NextFunction } from 'express';
import { AuthenticationMiddleware, AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { AuthenticateRequestUseCase } from '@application/use-cases/AuthenticateRequestUseCase';

describe('AuthenticationMiddleware Integration', () => {
  let middleware: AuthenticationMiddleware;
  let mockAuthenticateUseCase: jest.Mocked<AuthenticateRequestUseCase>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockAuthenticateUseCase = {
      execute: jest.fn()
    } as any;

    middleware = new AuthenticationMiddleware(mockAuthenticateUseCase);

    mockReq = {
      headers: {},
      path: '/api/v1/patients',
      ip: '127.0.0.1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate successfully and call next()', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: true,
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          roles: ['doctor'],
          permissions: ['patient:read']
        }
      });

      const handler = middleware.authenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockReq.requestId).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 if authentication fails', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      });

      const handler = middleware.authenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        requestId: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Missing authorization header'
      });

      const handler = middleware.authenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if unexpected error occurs', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthenticateUseCase.execute.mockRejectedValue(new Error('Database error'));

      const handler = middleware.authenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authentication error',
        requestId: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should generate unique request IDs', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: true,
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          roles: ['doctor'],
          permissions: ['patient:read']
        }
      });

      const handler = middleware.authenticate();
      
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      const requestId1 = mockReq.requestId;

      mockReq = { headers: { authorization: 'Bearer valid-token' }, path: '/api/v1/patients', ip: '127.0.0.1' };
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      const requestId2 = mockReq.requestId;

      expect(requestId1).not.toBe(requestId2);
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate if authorization header is present', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: true,
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          roles: ['doctor'],
          permissions: ['patient:read']
        }
      });

      const handler = middleware.optionalAuthenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() without user if no authorization header', async () => {
      const handler = middleware.optionalAuthenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() even if authentication fails', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockAuthenticateUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      });

      const handler = middleware.optionalAuthenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() even if unexpected error occurs', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      mockAuthenticateUseCase.execute.mockRejectedValue(new Error('Database error'));

      const handler = middleware.optionalAuthenticate();
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

