import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { AuthorizationMiddleware } from '@presentation/middleware/AuthorizationMiddleware';
import { AuthorizeRequestUseCase } from '@application/use-cases/AuthorizeRequestUseCase';

describe('AuthorizationMiddleware Integration', () => {
  let middleware: AuthorizationMiddleware;
  let mockAuthorizeUseCase: jest.Mocked<AuthorizeRequestUseCase>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockAuthorizeUseCase = {
      execute: jest.fn()
    } as any;

    middleware = new AuthorizationMiddleware(mockAuthorizeUseCase);

    mockReq = {
      user: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: ['patient:read', 'patient:write']
      },
      requestId: 'test-request-id',
      path: '/api/v1/patients'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('should allow request if user has permission', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requirePermission('patient:read');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny request if user lacks permission', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: false,
        reason: 'Missing permission: patient:delete'
      });

      const handler = middleware.requirePermission('patient:delete');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing permission: patient:delete',
        requestId: 'test-request-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      const handler = middleware.requirePermission('patient:read');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        requestId: 'test-request-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow request if user has any of the permissions', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requireAnyPermission(['patient:read', 'patient:delete']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAuthorizeUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermissions: ['patient:read', 'patient:delete'],
          requireAll: false
        })
      );
    });

    it('should deny request if user has none of the permissions', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: false,
        reason: 'Missing any of permissions: patient:delete, billing:read'
      });

      const handler = middleware.requireAnyPermission(['patient:delete', 'billing:read']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    it('should allow request if user has all permissions', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requireAllPermissions(['patient:read', 'patient:write']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAuthorizeUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermissions: ['patient:read', 'patient:write'],
          requireAll: true
        })
      );
    });

    it('should deny request if user is missing any permission', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: false,
        reason: 'Missing permissions: patient:delete'
      });

      const handler = middleware.requireAllPermissions(['patient:read', 'patient:delete']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow request if user has role', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requireRole('doctor');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAuthorizeUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredRoles: ['doctor'],
          requireAll: true
        })
      );
    });

    it('should deny request if user lacks role', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: false,
        reason: 'Missing role: admin'
      });

      const handler = middleware.requireRole('admin');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('should allow request if user has any of the roles', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requireAnyRole(['doctor', 'nurse']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAllRoles', () => {
    it('should allow request if user has all roles', async () => {
      mockAuthorizeUseCase.execute.mockResolvedValue({
        allowed: true
      });

      const handler = middleware.requireAllRoles(['doctor', 'admin']);
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 if unexpected error occurs', async () => {
      mockAuthorizeUseCase.execute.mockRejectedValue(new Error('Database error'));

      const handler = middleware.requirePermission('patient:read');
      await handler(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authorization error',
        requestId: 'test-request-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

