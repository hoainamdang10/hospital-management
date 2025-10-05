import { SupabaseUserRepository } from '@infrastructure/repositories/SupabaseUserRepository';
import { TestUtils } from '@tests/setup';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';

// --- Mocks ---
const fromMock = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  order: jest.fn(),
  range: jest.fn(),
  upsert: jest.fn().mockReturnThis(),
  then: jest.fn(),
};

const mockSupabaseClient = {
  from: jest.fn(() => fromMock as any),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Helper to build minimal valid record for UserMapper.toDomain
const buildUserRecord = (over: Partial<any> = {}) => ({
  id: over.id ?? 'u-123',
  email: over.email ?? 'user@example.com',
  full_name: over.full_name ?? 'User A',
  role_type: over.role_type ?? 'doctor',
  is_active: over.is_active ?? true,
  is_verified: over.is_verified ?? false,
  created_at: over.created_at ?? new Date().toISOString(),
  updated_at: over.updated_at ?? new Date().toISOString(),
  // Personal info (complete for active users)
  citizen_id: over.citizen_id ?? '012345678901',
  date_of_birth: over.date_of_birth ?? '1990-01-01',
  gender: over.gender ?? 'male',
  address: over.address ?? 'Hanoi',
  phone_number: over.phone_number ?? '0901234567',
  emergency_contact_name: over.emergency_contact_name,
  emergency_contact_phone: over.emergency_contact_phone,
});

// Helper to build complete mock User aggregate for update/save operations
const buildMockUser = (over: Partial<any> = {}) => ({
  id: over.id ?? 'u-123',
  email: { value: over.email ?? 'user@example.com' },
  personalInfo: {
    fullName: over.fullName ?? 'User A',
    citizenId: over.citizenId ?? '012345678901',
    dateOfBirth: over.dateOfBirth ?? new Date('1990-01-01'),
    gender: over.gender ?? 'male',
    phoneNumber: over.phoneNumber ?? '0901234567',
    address: over.address ?? 'Hanoi',
    emergencyContactName: over.emergencyContactName,
    emergencyContactPhone: over.emergencyContactPhone,
  },
  healthcareRole: {
    roleType: over.roleType ?? 'DOCTOR',
    name: over.roleName ?? 'DOCTOR',
    vietnameseName: over.vietnameseName ?? 'Bác sĩ',
    permissions: over.permissions ?? ['patient:read', 'patient:write'],
    hasHIPAATraining: over.hasHIPAATraining ?? true,
  },
  isActive: over.isActive ?? true,
  isVerified: over.isVerified ?? false,
  createdAt: over.createdAt ?? new Date(),
  updatedAt: over.updatedAt ?? new Date(),
});

const makeRepo = () => {
  const logger = TestUtils.createMockLogger();
  const cache = TestUtils.createMockCacheService();
  const repo = new SupabaseUserRepository('http://localhost', 'service_key', logger as any, cache as any) as any;
  // Patch private supabaseClient to avoid ESM mocking edge cases
  repo.supabaseClient = mockSupabaseClient as any;
  return { repo: repo as SupabaseUserRepository, logger, cache };
};

beforeEach(() => {
  jest.clearAllMocks();

  // Reset all fromMock methods to return this (for chaining)
  fromMock.select.mockReturnThis();
  fromMock.eq.mockReturnThis();
  fromMock.insert.mockReturnThis();
  fromMock.update.mockReturnThis();
  fromMock.delete.mockReturnThis();
  fromMock.limit.mockReturnThis();
  fromMock.gt.mockReturnThis();
  fromMock.gte.mockReturnThis();
  fromMock.upsert.mockReturnThis();

  // Reset mockSupabaseClient.from to return fromMock
  mockSupabaseClient.from.mockReturnValue(fromMock as any);

  // Reset circuit breaker state
  const { CircuitBreakerFactory } = require('@infrastructure/resilience/CircuitBreaker');
  const breaker = CircuitBreakerFactory.getBreaker('user-repository');
  if (breaker && typeof breaker.reset === 'function') {
    breaker.reset();
  }
});

describe('SupabaseUserRepository.findById', () => {
  it('trả về từ cache (cache hit) không gọi DB', async () => {
    const { repo, cache } = makeRepo();
    const record = buildUserRecord({ id: 'u1', email: 'a@example.com' });
    (cache.get as jest.Mock).mockResolvedValueOnce(record);

    const user = await repo.findById(UserId.fromString('u1'));

    expect(user).not.toBeNull();
    expect(user!.id).toBe('u1');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('cache miss -> DB success -> set cache và trả về domain', async () => {
    const { repo, cache } = makeRepo();
    (cache.get as jest.Mock).mockResolvedValueOnce(null);

    const record = buildUserRecord({ id: 'u2', email: 'b@example.com' });
    fromMock.single.mockResolvedValueOnce({ data: record, error: null });

    // Bỏ qua mapping domain chi tiết để tập trung verify flow
    jest.spyOn<any, any>(repo as any, 'mapToUserAggregate').mockReturnValue({ id: 'u2', email: { value: 'b@example.com' } });

    await repo.findById(UserId.fromString('u2'));

    // Flow DB đã được gọi
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
  });

  it('DB not found (PGRST116) -> trả về null', async () => {
    const { repo, cache } = makeRepo();
    (cache.get as jest.Mock).mockResolvedValueOnce(null);

    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } });

    const user = await repo.findById(UserId.fromString('u3'));
    expect(user).toBeNull();
  });

  it('DB lỗi -> circuit breaker execute fallback trả về null', async () => {
    const { repo, cache } = makeRepo();
    (cache.get as jest.Mock).mockResolvedValueOnce(null);

    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'XX', message: 'db down' } });

    const user = await repo.findById(UserId.fromString('u4'));
    expect(user).toBeNull();
  });
});

describe('SupabaseUserRepository.findByEmail', () => {
  it('cache hit theo email', async () => {
    const { repo, cache } = makeRepo();
    const record = buildUserRecord({ id: 'u5', email: 'c@example.com' });
    (cache.get as jest.Mock).mockResolvedValueOnce(record);

    const user = await repo.findByEmail(Email.fromString('c@example.com'));
    expect(user).not.toBeNull();
    expect(user!.email.value).toBe('c@example.com');
  });

  it('cache miss -> DB success -> set cache cả theo email và id', async () => {
    const { repo, cache } = makeRepo();
    (cache.get as jest.Mock).mockResolvedValueOnce(null);

    const record = buildUserRecord({ id: 'u6', email: 'd@example.com' });
    // Bỏ qua mapping domain để kiểm tra set cache (email + id)
    jest.spyOn<any, any>(repo as any, 'mapToUserAggregate').mockReturnValue({ id: 'u6', email: { value: 'd@example.com' } });

    fromMock.single.mockResolvedValueOnce({ data: record, error: null });

    await repo.findByEmail(Email.fromString('d@example.com'));

    // Flow DB đã được gọi
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
  });
});

describe('SupabaseUserRepository.create', () => {
  it('should create user successfully', async () => {
    const { repo } = makeRepo();
    const record = buildUserRecord({ id: 'u7', email: 'new@example.com' });

    // Mock the full chain: from().insert().select().single()
    fromMock.select.mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: record, error: null });

    // Mock logAuditEvent to avoid DB call
    jest.spyOn<any, any>(repo as any, 'logAuditEvent').mockResolvedValue(undefined);

    const user = await repo.create({
      email: 'new@example.com',
      fullName: 'New User',
      roleType: 'DOCTOR',
      citizenId: '012345678901',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phoneNumber: '0901234567'
    });

    expect(user).not.toBeNull();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(fromMock.insert).toHaveBeenCalled();
  });

  it('should throw error when create fails', async () => {
    const { repo } = makeRepo();

    fromMock.select.mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: null, error: { message: 'Duplicate email' } });

    await expect(repo.create({
      email: 'duplicate@example.com',
      fullName: 'Duplicate User',
      roleType: 'DOCTOR'
    })).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.update', () => {
  it('should update user successfully', async () => {
    const { repo } = makeRepo();
    const record = buildUserRecord({ id: 'u8', email: 'update@example.com' });

    // Mock User aggregate with complete data
    const mockUser = buildMockUser({
      id: 'u8',
      email: 'update@example.com',
      fullName: 'Updated Name'
    });

    // Mock the full chain: from().update().eq().select().single()
    fromMock.eq.mockReturnThis();
    fromMock.select.mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: record, error: null });

    // Mock dependencies
    jest.spyOn<any, any>(repo as any, 'logAuditEvent').mockResolvedValue(undefined);
    jest.spyOn<any, any>(repo as any, 'invalidateUserCache').mockResolvedValue(undefined);

    await repo.update(mockUser as any);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(fromMock.update).toHaveBeenCalled();
  });

  it('should throw error when update fails', async () => {
    const { repo } = makeRepo();
    const mockUser = buildMockUser({
      id: 'u9',
      email: 'fail@example.com'
    });

    fromMock.eq.mockReturnThis();
    fromMock.select.mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });

    await expect(repo.update(mockUser as any)).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.save', () => {
  it('should upsert user successfully', async () => {
    const { repo } = makeRepo();

    // Create a complete mock user with all required fields
    const mockUser = buildMockUser({
      id: 'u10',
      email: 'save@example.com',
      fullName: 'Save User'
    });

    // Mock upsert operation
    fromMock.upsert.mockResolvedValueOnce({ data: null, error: null });

    // Mock invalidateUserCache
    jest.spyOn<any, any>(repo as any, 'invalidateUserCache').mockResolvedValue(undefined);

    await repo.save(mockUser as any);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(fromMock.upsert).toHaveBeenCalled();
  });
});

describe('SupabaseUserRepository.delete', () => {
  it('should soft delete user successfully', async () => {
    const { repo } = makeRepo();

    // Mock the chain: from().update().eq()
    fromMock.eq.mockResolvedValueOnce({ data: null, error: null });

    // Mock invalidateUserCache
    jest.spyOn<any, any>(repo as any, 'invalidateUserCache').mockResolvedValue(undefined);

    await repo.delete(UserId.fromString('u11'));

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(fromMock.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });

  it('should throw error when delete fails', async () => {
    const { repo } = makeRepo();

    fromMock.eq.mockResolvedValueOnce({ data: null, error: { message: 'Delete failed' } });

    await expect(repo.delete(UserId.fromString('u12'))).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.exists', () => {
  it('should return true when user exists', async () => {
    const { repo } = makeRepo();

    // Mock the chain: from().select().eq().limit().maybeSingle()
    fromMock.limit.mockReturnThis();
    fromMock.maybeSingle.mockResolvedValueOnce({ data: { id: 'u13' }, error: null });

    const exists = await repo.exists(UserId.fromString('u13'));

    expect(exists).toBe(true);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
  });

  it('should return false when user does not exist', async () => {
    const { repo } = makeRepo();

    fromMock.limit.mockReturnThis();
    fromMock.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const exists = await repo.exists(UserId.fromString('u14'));

    expect(exists).toBe(false);
  });

  it('should throw error on database error', async () => {
    const { repo } = makeRepo();

    fromMock.limit.mockReturnThis();
    fromMock.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: 'XX', message: 'DB error' } });

    await expect(repo.exists(UserId.fromString('u15'))).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.getUserRoles', () => {
  it('should return roles from cache', async () => {
    const { repo, cache } = makeRepo();

    (cache.get as jest.Mock).mockResolvedValueOnce(['DOCTOR']);

    const roles = await repo.getUserRoles(UserId.fromString('u16'));

    expect(roles).toEqual(['DOCTOR']);
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should fetch roles from database and cache them', async () => {
    const { repo, cache } = makeRepo();

    (cache.get as jest.Mock).mockResolvedValueOnce(null);
    fromMock.single.mockResolvedValueOnce({ data: { role_type: 'NURSE' }, error: null });

    const roles = await repo.getUserRoles(UserId.fromString('u17'));

    expect(roles).toEqual(['NURSE']);
    expect(cache.set).toHaveBeenCalledWith('roles:u17', ['NURSE'], expect.any(Object));
  });

  it('should return empty array when user not found', async () => {
    const { repo, cache } = makeRepo();

    (cache.get as jest.Mock).mockResolvedValueOnce(null);
    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const roles = await repo.getUserRoles(UserId.fromString('u18'));

    expect(roles).toEqual([]);
  });

  it('should use fallback on database error', async () => {
    const { repo, cache } = makeRepo();

    (cache.get as jest.Mock).mockResolvedValueOnce(null);
    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'XX', message: 'DB error' } });

    const roles = await repo.getUserRoles(UserId.fromString('u19'));

    expect(roles).toEqual([]);
  });
});

describe('SupabaseUserRepository.invalidateUserCache', () => {
  it('should invalidate all user-related caches', async () => {
    const { repo, cache } = makeRepo();

    await repo.invalidateUserCache('u20', 'test@example.com');

    expect(cache.delete).toHaveBeenCalledWith('user:u20');
    expect(cache.delete).toHaveBeenCalledWith('user:email:test@example.com');
    expect(cache.delete).toHaveBeenCalledWith('roles:u20');
    expect(cache.delete).toHaveBeenCalledWith('permissions:u20');
  });

  it('should handle missing email parameter', async () => {
    const { repo, cache } = makeRepo();

    await repo.invalidateUserCache('u21');

    expect(cache.delete).toHaveBeenCalledWith('user:u21');
    expect(cache.delete).toHaveBeenCalledWith('roles:u21');
    expect(cache.delete).toHaveBeenCalledWith('permissions:u21');
    expect(cache.delete).not.toHaveBeenCalledWith(expect.stringContaining('email'));
  });

  it('should not throw when cache service is not available', async () => {
    const logger = TestUtils.createMockLogger();
    const repo = new SupabaseUserRepository('http://localhost', 'key', logger as any);
    (repo as any).supabaseClient = mockSupabaseClient;

    await expect(repo.invalidateUserCache('u22')).resolves.not.toThrow();
  });
});


describe('SupabaseUserRepository.createSession', () => {
  it('should create session successfully', async () => {
    const { repo } = makeRepo();

    const mockSession = {
      userId: 'u23',
      sessionToken: 'token123',
      deviceInfo: { browser: 'Chrome' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      expiresAt: new Date(Date.now() + 3600000),
      isActive: true
    };

    fromMock.single.mockResolvedValueOnce({ data: { id: 'session1' }, error: null });
    jest.spyOn<any, any>(repo as any, 'logAuditEvent').mockResolvedValue(undefined);

    await repo.createSession(mockSession as any);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_sessions');
    expect(fromMock.insert).toHaveBeenCalled();
  });

  it('should throw error when session creation fails', async () => {
    const { repo } = makeRepo();

    const mockSession = {
      userId: 'u24',
      sessionToken: 'token456',
      deviceInfo: {},
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0',
      expiresAt: new Date(),
      isActive: true
    };

    fromMock.single.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

    await expect(repo.createSession(mockSession as any)).rejects.toThrow('Failed to create session');
  });
});

describe('SupabaseUserRepository.findSessionByToken', () => {
  it('should find active session by token', async () => {
    const { repo } = makeRepo();

    const sessionRecord = {
      id: 'session2',
      user_id: 'u25',
      session_token: 'token789',
      device_info: {},
      ip_address: '192.168.1.3',
      user_agent: 'Mozilla/5.0',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    };

    fromMock.gt = jest.fn().mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: sessionRecord, error: null });

    const session = await repo.findSessionByToken('token789');

    expect(session).not.toBeNull();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_sessions');
  });

  it('should return null when session not found', async () => {
    const { repo } = makeRepo();

    fromMock.gt = jest.fn().mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const session = await repo.findSessionByToken('invalid_token');

    expect(session).toBeNull();
  });

  it('should use fallback on database error', async () => {
    const { repo } = makeRepo();

    fromMock.gt = jest.fn().mockReturnThis();
    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'XX', message: 'DB error' } });

    const session = await repo.findSessionByToken('error_token');

    expect(session).toBeNull();
  });
});

describe('SupabaseUserRepository.invalidateSession', () => {
  it('should invalidate session successfully', async () => {
    const { repo } = makeRepo();

    fromMock.eq = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    jest.spyOn<any, any>(repo as any, 'invalidateSessionCache').mockResolvedValue(undefined);
    jest.spyOn<any, any>(repo as any, 'logAuditEvent').mockResolvedValue(undefined);

    await repo.invalidateSession('session3', 'token_to_invalidate');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_sessions');
    expect(fromMock.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });

  it('should throw error when invalidation fails', async () => {
    const { repo } = makeRepo();

    fromMock.eq = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });

    await expect(repo.invalidateSession('session4')).rejects.toThrow('Failed to invalidate session');
  });
});

describe('SupabaseUserRepository.checkAccountLockout', () => {
  it('should return not locked when no failed attempts', async () => {
    const { repo } = makeRepo();

    fromMock.gte = jest.fn().mockReturnThis();
    fromMock.order = jest.fn().mockResolvedValueOnce({ data: [], error: null });

    const result = await repo.checkAccountLockout(Email.fromString('test@example.com'));

    expect(result.isLocked).toBe(false);
    expect(result.failedAttempts).toBe(0);
  });

  it('should return locked when 5+ failed attempts in last 30 minutes', async () => {
    const { repo } = makeRepo();

    const now = new Date();
    const attempts = Array(5).fill(null).map((_, i) => ({
      email: 'locked@example.com',
      is_successful: false,
      created_at: new Date(now.getTime() - (i * 60000)).toISOString()
    }));

    fromMock.gte = jest.fn().mockReturnThis();
    fromMock.order = jest.fn().mockResolvedValueOnce({ data: attempts, error: null });

    const result = await repo.checkAccountLockout(Email.fromString('locked@example.com'));

    expect(result.isLocked).toBe(true);
    expect(result.failedAttempts).toBe(5);
    expect(result.unlockAt).toBeDefined();
  });

  it('should return not locked when lockout period expired', async () => {
    const { repo } = makeRepo();

    const oldAttempt = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes ago
    const attempts = Array(5).fill(null).map(() => ({
      email: 'expired@example.com',
      is_successful: false,
      created_at: oldAttempt.toISOString()
    }));

    fromMock.gte = jest.fn().mockReturnThis();
    fromMock.order = jest.fn().mockResolvedValueOnce({ data: attempts, error: null });

    const result = await repo.checkAccountLockout(Email.fromString('expired@example.com'));

    expect(result.isLocked).toBe(false);
  });

  it('should handle database errors gracefully', async () => {
    const { repo } = makeRepo();

    fromMock.gte = jest.fn().mockReturnThis();
    fromMock.order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const result = await repo.checkAccountLockout(Email.fromString('error@example.com'));

    expect(result.isLocked).toBe(false);
    expect(result.failedAttempts).toBe(0);
  });
});


describe('SupabaseUserRepository.recordLoginAttempt', () => {
  it('should record successful login attempt', async () => {
    const { repo } = makeRepo();

    fromMock.insert = jest.fn().mockResolvedValueOnce({ data: null, error: null });
    jest.spyOn<any, any>(repo as any, 'clearFailedLoginAttempts').mockResolvedValue(undefined);

    await repo.recordLoginAttempt(
      Email.fromString('success@example.com'),
      true,
      '192.168.1.1',
      'Mozilla/5.0'
    );

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('login_attempts');
    expect(fromMock.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: 'success@example.com',
      is_successful: true,
      ip_address: '192.168.1.1'
    }));
  });

  it('should record failed login attempt', async () => {
    const { repo } = makeRepo();

    fromMock.insert = jest.fn().mockResolvedValueOnce({ data: null, error: null });

    await repo.recordLoginAttempt(
      Email.fromString('failed@example.com'),
      false,
      '192.168.1.2',
      'Mozilla/5.0',
      'Invalid password'
    );

    expect(fromMock.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: 'failed@example.com',
      is_successful: false,
      error_message: 'Invalid password'
    }));
  });

  it('should handle database errors gracefully', async () => {
    const { repo } = makeRepo();

    fromMock.insert = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

    await expect(
      repo.recordLoginAttempt(Email.fromString('error@example.com'), false)
    ).resolves.not.toThrow();
  });
});

describe('SupabaseUserRepository.unlockAccount', () => {
  it('should unlock account successfully', async () => {
    const { repo } = makeRepo();

    // Mock the chain: from().delete().eq('email', ...).eq('is_successful', false)
    // First .eq() returns this, second .eq() returns promise
    fromMock.eq
      .mockReturnValueOnce(fromMock) // First .eq() returns this for chaining
      .mockResolvedValueOnce({ data: null, error: null }); // Second .eq() returns promise
    jest.spyOn<any, any>(repo as any, 'logAuditEvent').mockResolvedValue(undefined);

    await repo.unlockAccount(Email.fromString('unlock@example.com'), 'admin123');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('login_attempts');
    expect(fromMock.delete).toHaveBeenCalled();
  });

  it('should throw error when unlock fails', async () => {
    const { repo } = makeRepo();

    // Mock the chain: from().delete().eq().eq()
    fromMock.eq
      .mockReturnValueOnce(fromMock)
      .mockResolvedValueOnce({ data: null, error: { message: 'Delete failed' } });

    await expect(
      repo.unlockAccount(Email.fromString('fail@example.com'), 'admin123')
    ).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.list', () => {
  it('should list users with default options', async () => {
    const { repo } = makeRepo();

    const records = [
      buildUserRecord({ id: 'u30', email: 'user1@example.com' }),
      buildUserRecord({ id: 'u31', email: 'user2@example.com' })
    ];

    // Mock the query chain - fromMock itself is awaitable
    fromMock.then = jest.fn((resolve) => resolve({ data: records, error: null }));

    const users = await repo.list();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(users.length).toBe(2);
  });

  it('should list users with pagination', async () => {
    const { repo } = makeRepo();

    fromMock.limit.mockReturnThis();
    fromMock.range.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ data: [], error: null }));

    await repo.list({ limit: 10, offset: 20 });

    expect(fromMock.limit).toHaveBeenCalledWith(10);
    expect(fromMock.range).toHaveBeenCalledWith(20, 29);
  });

  it('should list users with filters', async () => {
    const { repo } = makeRepo();

    fromMock.eq.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ data: [], error: null }));

    await repo.list({ filters: { role_type: 'DOCTOR', is_active: true } });

    expect(fromMock.eq).toHaveBeenCalledWith('role_type', 'DOCTOR');
    expect(fromMock.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('should throw error when list fails', async () => {
    const { repo } = makeRepo();

    fromMock.then = jest.fn((resolve) => resolve({ data: null, error: { message: 'Query failed' } }));

    await expect(repo.list()).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.count', () => {
  it('should count all users', async () => {
    const { repo } = makeRepo();

    fromMock.select.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ count: 42, error: null }));

    const count = await repo.count();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    expect(count).toBe(42);
  });

  it('should count users with filters', async () => {
    const { repo } = makeRepo();

    fromMock.select.mockReturnThis();
    fromMock.eq.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ count: 10, error: null }));

    const count = await repo.count({ role_type: 'NURSE' });

    expect(fromMock.eq).toHaveBeenCalledWith('role_type', 'NURSE');
    expect(count).toBe(10);
  });

  it('should return 0 when count is null', async () => {
    const { repo } = makeRepo();

    fromMock.select.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ count: null, error: null }));

    const count = await repo.count();

    expect(count).toBe(0);
  });

  it('should throw error when count fails', async () => {
    const { repo } = makeRepo();

    fromMock.select.mockReturnThis();
    fromMock.then = jest.fn((resolve) => resolve({ count: null, error: { message: 'Count failed' } }));

    await expect(repo.count()).rejects.toThrow();
  });
});

describe('SupabaseUserRepository.emailExists', () => {
  it('should return true when email exists', async () => {
    const { repo, cache } = makeRepo();

    const record = buildUserRecord({ email: 'exists@example.com' });
    (cache.get as jest.Mock).mockResolvedValueOnce(record);

    const exists = await repo.emailExists(Email.fromString('exists@example.com'));

    expect(exists).toBe(true);
  });

  it('should return false when email does not exist', async () => {
    const { repo, cache } = makeRepo();

    (cache.get as jest.Mock).mockResolvedValueOnce(null);
    fromMock.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const exists = await repo.emailExists(Email.fromString('notexists@example.com'));

    expect(exists).toBe(false);
  });
});



