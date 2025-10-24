import { createClient } from '@supabase/supabase-js';
import { AuthenticationMiddleware, AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { Response } from 'express';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('AuthenticationMiddleware', () => {
  const createClientMock = createClient as jest.Mock;
  let getUserMock: jest.Mock;

  const createResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockImplementation(function (this: Response) {
      return this;
    });
    res.json = jest.fn().mockReturnValue(undefined);
    return res as Response & {
      status: jest.Mock;
      json: jest.Mock;
    };
  };

  const buildRequest = (headers: Record<string, string | undefined> = {}): AuthenticatedRequest => {
    return {
      headers: headers as any,
      requestId: 'req-123'
    } as AuthenticatedRequest;
  };

  beforeEach(() => {
    getUserMock = jest.fn();
    createClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('trả về 401 khi thiếu Authorization header và requireAuth mặc định', async () => {
    const middleware = new AuthenticationMiddleware({
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'anon-key'
    });

    const req = buildRequest();
    const res = createResponse();
    const next = jest.fn();

    await middleware.authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'UNAUTHORIZED'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('cho phép tiếp tục khi optional auth và không có token', async () => {
    const middleware = AuthenticationMiddleware.optional('https://example.supabase.co', 'anon-key');
    const req = buildRequest();
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('trả về 401 khi Supabase trả về lỗi token', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    const middleware = new AuthenticationMiddleware({
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'anon-key'
    });

    const req = buildRequest({ authorization: 'Bearer invalid-token' });
    const res = createResponse();
    const next = jest.fn();

    await middleware.authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INVALID_TOKEN',
        details: 'Invalid token'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('trả về 403 khi user không có vai trò phù hợp', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'nurse@example.com',
          user_metadata: { role: 'NURSE', roles: ['NURSE'] },
          app_metadata: {}
        }
      },
      error: null
    });

    const middleware = AuthenticationMiddleware.requireRoles(
      'https://example.supabase.co',
      'anon-key',
      ['ADMIN']
    );

    const req = buildRequest({ authorization: 'Bearer token-123' });
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FORBIDDEN',
        requiredRoles: ['ADMIN']
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('gắn thông tin user và gọi next khi token hợp lệ', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'admin@example.com',
          user_metadata: { role: 'ADMIN', roles: ['ADMIN', 'SUPER_ADMIN'] },
          app_metadata: {}
        }
      },
      error: null
    });

    const middleware = AuthenticationMiddleware.adminOnly(
      'https://example.supabase.co',
      'anon-key'
    );

    const req = buildRequest({ authorization: 'Bearer valid-token' });
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(req.user).toEqual(
      expect.objectContaining({
        id: 'user-2',
        email: 'admin@example.com',
        role: 'ADMIN',
        roles: ['ADMIN', 'SUPER_ADMIN']
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
