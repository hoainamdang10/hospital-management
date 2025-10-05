import { SupabaseAuthClient, SupabaseAuthConfig } from '@infrastructure/auth/SupabaseAuthClient';
import { ServiceMode } from '@application/services/IDegradationService';
import { TestUtils } from '@tests/setup';

// Mock @supabase/supabase-js createClient
const mockAuth = {
  signInWithPassword: jest.fn(),
  refreshSession: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  setSession: jest.fn(),
};

// Chainable query builder mocks
const fromMock = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
};

const rpcMock = jest.fn().mockResolvedValue({ data: null, error: null });


const mockSupabaseClient = {
  auth: mockAuth,
  from: jest.fn((_table: string) => {
    return fromMock as any;
  }),
  rpc: rpcMock,
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const makeClient = () => {
  const logger = TestUtils.createMockLogger();
  const cfg: SupabaseAuthConfig = {
    supabaseUrl: 'http://localhost',
    supabaseServiceRoleKey: 'service_key',
    jwtSecret: 'jwt_secret',
  };
  const inst = new SupabaseAuthClient(cfg, logger) as any;
  // Patch private supabaseClient to avoid ESM mocking edge cases
  inst.supabaseClient = mockSupabaseClient as any;
  return { client: inst as SupabaseAuthClient, logger };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SupabaseAuthClient.signInWithPassword', () => {
  it('trả về AuthResult thành công với role và permissions', async () => {
    const { client } = makeClient();

    // Mock auth.signInWithPassword
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'user@example.com' },
        session: { access_token: 'at', refresh_token: 'rt', expires_at: Math.floor(Date.now()/1000) + 3600 },
      },
      error: null,
    });

    // Mock getUserProfile (view: auth_user_profiles_view)
    fromMock.single.mockResolvedValueOnce({
      data: {
        id: 'u1',
        full_name: 'User A',
        role_type: 'doctor',
        is_verified: true,
        is_active: true,
      },
      error: null,
    });

    // Mock getUserPermissions: healthcare_roles -> single()
    fromMock.single.mockResolvedValueOnce({
      data: { id: 'role-1', permissions: [] },
      error: null,
    });

    // role_permissions -> select list
    (fromMock as any).select.mockReturnThis();
    (fromMock as any).eq.mockReturnThis();
    // For list call, return array
    (fromMock as any).then = undefined; // ensure it's not a Promise

    // When .from('role_permissions')... (same mock), return list
    fromMock.select.mockReturnThis();
    fromMock.eq.mockReturnThis();

    // We need to distinguish .single() vs non-single: previous two single() consumed by profile and roles
    // Now emulate non-single select for permissions
    (mockSupabaseClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'role_permissions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          // emulate returning data array
          then: undefined,
          // When awaited, jest will look for a Promise; instead we pattern-match by later call
          // So we provide a custom exec via a fake method
          // But simpler: have .eq() return object with a custom awaited value
          // However, client code does: const { data, error } = await this.supabaseClient.from(...).select(...).eq(...)
          // We'll mimic by returning an object with data/error when awaited via a custom symbol
          // Easiest is to return an object with a Promise-like .then
        } as any;
      }
      return fromMock as any;
    });

    // To avoid complexity, intercept permissions call by stubbing getUserPermissions directly
    // @ts-ignore accessing private method via cast
    jest.spyOn<any, any>(client as any, 'getUserPermissions').mockResolvedValue(['patients:read', 'patients:write']);

    // Execute
    const res = await client.signInWithPassword({ email: 'user@example.com', password: 'Passw0rd!' });

    expect(res.success).toBe(true);
    expect(res.mode).toBe(ServiceMode.FULL_SERVICE);
    expect(res.userId).toBe('u1');
    expect(res.roles).toEqual(['doctor']);
    expect(res.permissions).toContain('patients:read');
    expect(mockAuth.signInWithPassword).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith('auth_update_user_last_login', { user_id: 'u1' });
  });

  it('trả về degraded khi Supabase trả lỗi', async () => {
    const { client } = makeClient();

    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login' } });

    const res = await client.signInWithPassword({ email: 'user@example.com', password: 'wrong' });

    expect(res.success).toBe(false);
    expect(res.mode).toBe(ServiceMode.DEGRADED_SERVICE);
    expect(res.degradationReason).toMatch(/Authentication failed/i);
  });

  it('trả về degraded khi thiếu email/password', async () => {
    const { client } = makeClient();
    const res = await client.signInWithPassword({ email: '', password: '' } as any);
    expect(res.success).toBe(false);
    expect(res.degradationReason).toMatch(/Missing email or password/);
  });
});

describe('SupabaseAuthClient.verifyToken', () => {
  it('trả về user khi token hợp lệ', async () => {
    const { client } = makeClient();
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'u1@example.com' } }, error: null });
    const user = await client.verifyToken('token');
    expect(user).toEqual({ id: 'u1', email: 'u1@example.com' });
  });

  it('trả về null khi lỗi', async () => {
    const { client } = makeClient();
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });
    const user = await client.verifyToken('bad');
    expect(user).toBeNull();
  });
});

describe('SupabaseAuthClient.refreshSession', () => {
  it('trả về degraded khi refresh session lỗi', async () => {
    const { client } = makeClient();
    mockAuth.refreshSession.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'invalid' } });
    const res = await client.refreshSession('rt');
    expect(res.success).toBe(false);
    expect(res.mode).toBe(ServiceMode.DEGRADED_SERVICE);
    expect(res.degradationReason).toMatch(/Session refresh failed/i);
  });
});

describe('SupabaseAuthClient.signOut', () => {
  it('ném lỗi khi Supabase signOut lỗi', async () => {
    const { client } = makeClient();
    mockAuth.signOut.mockResolvedValue({ error: { message: 'network' } });
    await expect(client.signOut()).rejects.toBeTruthy();
  });

  it('không lỗi khi signOut thành công', async () => {
    const { client } = makeClient();
    mockAuth.signOut.mockResolvedValue({ error: null });
    await expect(client.signOut()).resolves.toBeUndefined();
  });
});

