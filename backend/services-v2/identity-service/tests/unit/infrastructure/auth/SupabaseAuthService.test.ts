import { SupabaseAuthService } from '@infrastructure/auth/SupabaseAuthService';
import { TestUtils } from '@tests/setup';

// Mock @supabase/supabase-js
const mockAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  setSession: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  updateUser: jest.fn(),
  verifyOtp: jest.fn(),
  refreshSession: jest.fn(),
  getUser: jest.fn(),
  resend: jest.fn(),
};

// Create chainable mock for from()
const mockFromChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
  insert: jest.fn().mockResolvedValue({ error: null }),
};

const mockSupabaseClient = {
  auth: mockAuth,
  from: jest.fn(() => mockFromChain),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

const makeService = () => {
  const logger = TestUtils.createMockLogger();
  const svc = new SupabaseAuthService('http://localhost', 'service_key', logger) as any;
  // Patch in case ESM mocking has edge cases
  svc.supabaseClient = mockSupabaseClient as any;
  return { svc: svc as SupabaseAuthService, logger };
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mock chain
  mockFromChain.single.mockResolvedValue({ data: { email: 'test@example.com' }, error: null });
});

describe('SupabaseAuthService.signUp', () => {
  it('should throw error - method is disabled', async () => {
    const { svc } = makeService();

    // signUp() is now disabled and should throw immediately
    await expect(svc.signUp({
      email: 'a@example.com',
      password: 'Passw0rd!',
      fullName: 'User A',
      roleType: 'doctor',
      phoneNumber: '0901234567',
      citizenId: '0123456789',
      dateOfBirth: '1990-01-01' as any,
      gender: 'male' as any,
      address: 'Hanoi',
    } as any)).rejects.toThrow(/SupabaseAuthService.signUp\(\) is DISABLED/);

    // Should NOT call Supabase Auth API
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it('should throw error with correct message', async () => {
    const { svc } = makeService();

    await expect(svc.signUp({ email: 'a@example.com', password: 'x' } as any))
      .rejects.toThrow(/database triggers which have been removed/);
  });

  it('should throw error directing to RegisterUserUseCase', async () => {
    const { svc } = makeService();

    await expect(svc.signUp({ email: 'a@example.com', password: 'x' } as any))
      .rejects.toThrow(/Please use RegisterUserUseCase instead/);
  });
});

describe('SupabaseAuthService.signIn', () => {
  it('thành công, lấy role từ user_metadata, có token', async () => {
    const { svc } = makeService();
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'a@example.com', user_metadata: { role_type: 'admin' } },
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    });

    const res = await svc.signIn({ email: 'a@example.com', password: 'Passw0rd!' });

    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('admin');
    expect(res.accessToken).toBe('at');
  });

  it('fallback role khi không có user_metadata', async () => {
    const { svc } = makeService();
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'a@example.com', user_metadata: null },
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    });

    const res = await svc.signIn({ email: 'a@example.com', password: 'Passw0rd!' });
    expect(res.user?.role).toBe('PATIENT');
  });

  it('lỗi: trả về message tiếng Việt', async () => {
    const { svc } = makeService();
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'invalid' } });

    const res = await svc.signIn({ email: 'a@example.com', password: 'x' });

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/^Đăng nhập thất bại/);
  });

  it('không có user/session: trả về lỗi phù hợp', async () => {
    const { svc } = makeService();
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null });

    const res = await svc.signIn({ email: 'a@example.com', password: 'x' });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Không nhận được thông tin người dùng/);
  });
});

describe('SupabaseAuthService.signOut', () => {
  it('thành công: setSession + signOut', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.signOut.mockResolvedValue({ error: null });

    await expect(svc.signOut('at')).resolves.toBeUndefined();
    expect(mockAuth.setSession).toHaveBeenCalled();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('ném lỗi khi Supabase trả lỗi', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: { message: 'bad' } });
    mockAuth.signOut.mockResolvedValue({ error: { message: 'bad' } });

    await expect(svc.signOut('at')).rejects.toBeTruthy();
  });

  it('thành công khi không có accessToken', async () => {
    const { svc } = makeService();
    mockAuth.signOut.mockResolvedValue({ error: null });

    await expect(svc.signOut('')).resolves.toBeUndefined();
    expect(mockAuth.setSession).not.toHaveBeenCalled();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('ném lỗi khi signOut thất bại', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

    await expect(svc.signOut('at')).rejects.toThrow(/Đăng xuất thất bại/);
  });
});

describe('SupabaseAuthService.resetPasswordForEmail', () => {
  it('thành công: gửi email reset password', async () => {
    const { svc } = makeService();
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

    await expect(svc.resetPasswordForEmail('test@example.com')).resolves.toBeUndefined();
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', expect.any(Object));
  });

  it('ném lỗi khi Supabase trả lỗi', async () => {
    const { svc } = makeService();
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'Email not found' } });

    await expect(svc.resetPasswordForEmail('test@example.com')).rejects.toThrow(/Gửi email đặt lại mật khẩu thất bại/);
  });

  it('ném lỗi khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.resetPasswordForEmail.mockRejectedValue(new Error('Network error'));

    await expect(svc.resetPasswordForEmail('test@example.com')).rejects.toThrow();
  });
});

describe('SupabaseAuthService.resetPassword', () => {
  it('thành công: reset password với token', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: null });

    await expect(svc.resetPassword('token', 'NewPass123!')).resolves.toBeUndefined();
    expect(mockAuth.setSession).toHaveBeenCalledWith({ access_token: 'token', refresh_token: 'token' });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'NewPass123!' });
  });

  it('ném lỗi khi setSession thất bại', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: { message: 'Invalid token' } });

    await expect(svc.resetPassword('token', 'NewPass123!')).rejects.toThrow(/Failed to set session/);
  });

  it('ném lỗi khi updateUser thất bại', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: { message: 'Password too weak' } });

    await expect(svc.resetPassword('token', 'NewPass123!')).rejects.toThrow(/Failed to reset password/);
  });

  it('ném lỗi khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.setSession.mockRejectedValue(new Error('Network error'));

    await expect(svc.resetPassword('token', 'NewPass123!')).rejects.toThrow(/Reset password failed/);
  });
});

describe('SupabaseAuthService.updatePassword', () => {
  it('thành công: update password với current password', async () => {
    const { svc } = makeService();

    // Ensure supabaseClient.from is properly mocked
    (svc as any).supabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
    }));

    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com' },
        session: { access_token: 'at', refresh_token: 'rt' },
      },
      error: null,
    });
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: null });

    await expect(svc.updatePassword('user-id-123', 'OldPass123!', 'NewPass123!')).resolves.toBeUndefined();
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'OldPass123!' });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'NewPass123!' });
  });

  it('ném lỗi khi current password sai', async () => {
    const { svc } = makeService();

    // Ensure supabaseClient.from is properly mocked
    (svc as any).supabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
    }));

    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    await expect(svc.updatePassword('user-id-123', 'WrongPass', 'NewPass123!')).rejects.toThrow(/Current password is incorrect/);
  });

  it('ném lỗi khi setSession thất bại', async () => {
    const { svc } = makeService();

    // Ensure supabaseClient.from is properly mocked
    (svc as any).supabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null }),
    }));

    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com' },
        session: { access_token: 'at', refresh_token: 'rt' },
      },
      error: null,
    });
    mockAuth.setSession.mockResolvedValue({ error: { message: 'Session error' } });

    await expect(svc.updatePassword('user-id-123', 'OldPass123!', 'NewPass123!')).rejects.toThrow(/Set session failed/);
  });

  it('ném lỗi khi updateUser thất bại', async () => {
    const { svc } = makeService();
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com' },
        session: { access_token: 'at', refresh_token: 'rt' },
      },
      error: null,
    });
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: { message: 'Password too weak' } });

    await expect(svc.updatePassword('test@example.com', 'OldPass123!', 'NewPass123!')).rejects.toThrow();
  });
});

describe('SupabaseAuthService.verifyEmail', () => {
  it('thành công: verify email với token', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({ error: null });

    await expect(svc.verifyEmail('test@example.com', 'token123')).resolves.toBeUndefined();
    expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: 'token123',
      type: 'signup',
    });
  });

  it('ném lỗi khi verifyOtp thất bại', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({ error: { message: 'Invalid token' } });

    await expect(svc.verifyEmail('test@example.com', 'token123')).rejects.toThrow(/Email verification failed/);
  });

  it('ném lỗi khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockRejectedValue(new Error('Network error'));

    await expect(svc.verifyEmail('test@example.com', 'token123')).rejects.toThrow(/Email verification failed/);
  });
});

describe('SupabaseAuthService.sendEmailVerification', () => {
  it('thành công: gửi email verification', async () => {
    const { svc } = makeService();
    mockAuth.resend.mockResolvedValue({ error: null });

    await expect(svc.sendEmailVerification('test@example.com')).resolves.toBeUndefined();
    expect(mockAuth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'test@example.com',
    });
  });

  it('ném lỗi khi resend thất bại', async () => {
    const { svc } = makeService();
    mockAuth.resend.mockResolvedValue({ error: { message: 'Email not found' } });

    await expect(svc.sendEmailVerification('test@example.com')).rejects.toThrow(/Failed to send verification email/);
  });

  it('ném lỗi khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.resend.mockRejectedValue(new Error('Network error'));

    await expect(svc.sendEmailVerification('test@example.com')).rejects.toThrow(/Failed to send verification email/);
  });
});

describe('SupabaseAuthService.verifyOtp', () => {
  it('thành công: verify OTP signup', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', user_metadata: { role_type: 'doctor' } },
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    });

    const res = await svc.verifyOtp('test@example.com', 'token123', 'signup');

    expect(res.success).toBe(true);
    expect(res.user?.id).toBe('u1');
    expect(res.user?.role).toBe('doctor');
    expect(res.accessToken).toBe('at');
  });

  it('thành công: verify OTP recovery', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', user_metadata: { role_type: 'patient' } },
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    });

    const res = await svc.verifyOtp('test@example.com', 'token123', 'recovery');

    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('patient');
  });

  it('trả về lỗi khi verifyOtp thất bại', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid OTP' } });

    const res = await svc.verifyOtp('test@example.com', 'token123', 'signup');

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Xác thực OTP thất bại/);
  });

  it('trả về lỗi khi không có user/session', async () => {
    const { svc } = makeService();
    mockAuth.verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });

    const res = await svc.verifyOtp('test@example.com', 'token123', 'signup');

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Xác thực OTP thất bại/);
  });
});

describe('SupabaseAuthService.refreshSession', () => {
  it('thành công: refresh session', async () => {
    const { svc } = makeService();
    mockAuth.refreshSession.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', user_metadata: { role_type: 'doctor' } },
        session: { access_token: 'new_at', refresh_token: 'new_rt', expires_in: 3600 },
      },
      error: null,
    });

    const res = await svc.refreshSession('old_rt');

    expect(res.success).toBe(true);
    expect(res.accessToken).toBe('new_at');
    expect(res.refreshToken).toBe('new_rt');
  });

  it('trả về lỗi khi refreshSession thất bại', async () => {
    const { svc } = makeService();
    mockAuth.refreshSession.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid token' } });

    const res = await svc.refreshSession('old_rt');

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Refresh session thất bại/);
  });

  it('trả về lỗi khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.refreshSession.mockRejectedValue(new Error('Network error'));

    const res = await svc.refreshSession('old_rt');

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Refresh session thất bại/);
  });
});

describe('SupabaseAuthService.verifyToken', () => {
  it('thành công: verify token', async () => {
    const { svc } = makeService();
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@example.com', user_metadata: { role_type: 'doctor' } } },
      error: null,
    });

    const res = await svc.verifyToken('token');

    expect(res.userId).toBe('u1');
    expect(res.email).toBe('test@example.com');
    expect(res.role).toBe('doctor');
  });

  it('ném lỗi khi token invalid', async () => {
    const { svc } = makeService();
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } });

    await expect(svc.verifyToken('token')).rejects.toThrow(/Invalid token/);
  });
});

describe('SupabaseAuthService.getUserFromToken', () => {
  it('thành công: get user from token', async () => {
    const { svc } = makeService();
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@example.com', user_metadata: { role_type: 'doctor' } } },
      error: null,
    });

    const res = await svc.getUserFromToken('token');

    expect(res?.id).toBe('u1');
    expect(res?.email).toBe('test@example.com');
    expect(res?.role).toBe('doctor');
  });

  it('trả về null khi token invalid', async () => {
    const { svc } = makeService();
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } });

    const res = await svc.getUserFromToken('token');

    expect(res).toBeNull();
  });

  it('trả về null khi có exception', async () => {
    const { svc } = makeService();
    mockAuth.getUser.mockRejectedValue(new Error('Network error'));

    const res = await svc.getUserFromToken('token');

    expect(res).toBeNull();
  });
});

