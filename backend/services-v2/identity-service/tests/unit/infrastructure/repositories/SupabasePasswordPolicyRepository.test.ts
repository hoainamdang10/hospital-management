import { SupabasePasswordPolicyRepository } from '@infrastructure/repositories/SupabasePasswordPolicyRepository';
import { PasswordPolicy } from '@domain/value-objects/PasswordPolicy';

// Mock Supabase Client
const mockSupabaseClient = {
  from: jest.fn(),
};

// Mock Logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
};

// Helper to create chainable query mock
const createQueryMock = (data: any, error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  insert: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockResolvedValue({ data, error }),
  then: jest.fn((resolve) => resolve({ data, error })),
});

describe('SupabasePasswordPolicyRepository', () => {
  let repository: SupabasePasswordPolicyRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupabasePasswordPolicyRepository(
      mockSupabaseClient as any,
      mockLogger
    );
  });

  describe('getCurrent', () => {
    it('should return current password policy', async () => {
      // Arrange
      const mockData = {
        id: 'policy-123',
        min_length: 12,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        expiration_days: 90,
        prevent_reuse: 5,
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: 'admin-123',
      };

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getCurrent();

      // Assert
      expect(result).toBeInstanceOf(PasswordPolicy);
      expect(result.minLength).toBe(12);
      expect(result.requireUppercase).toBe(true);
      expect(result.requireLowercase).toBe(true);
      expect(result.requireNumbers).toBe(true);
      expect(result.requireSpecialChars).toBe(true);
      expect(result.expirationDays).toBe(90);
      expect(result.preventReuse).toBe(5);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.password_policies');
      expect(queryMock.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return default policy when no active policy exists', async () => {
      // Arrange
      const queryMock = createQueryMock(null, { message: 'Not found' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getCurrent();

      // Assert
      expect(result).toBeInstanceOf(PasswordPolicy);
      // Should return default policy
      expect(result.minLength).toBe(8);
      expect(result.requireUppercase).toBe(true);
      expect(result.requireLowercase).toBe(true);
      expect(result.requireNumbers).toBe(true);
      expect(result.requireSpecialChars).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const queryMock = createQueryMock(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getCurrent();

      // Assert
      // Should return default policy on error
      expect(result).toBeInstanceOf(PasswordPolicy);
    });
  });

  describe('update', () => {
    it('should update password policy successfully', async () => {
      // Arrange
      const policy = PasswordPolicy.create({
        minLength: 14,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 60,
        preventReuse: 10,
      });

      // Mock update operation with proper chaining
      const updateMock = {
        ...createQueryMock(null),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock insert operation
      const insertMock = {
        ...createQueryMock({ id: 'policy-new' }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'policy-new',
            min_length: 14,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: true,
            expiration_days: 60,
            prevent_reuse: 10,
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: 'admin-456',
            created_at: new Date().toISOString(),
          },
          error: null
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return updateMock; // deactivate
        return insertMock; // insert new
      });

      // Act
      await repository.update(policy, 'admin-456');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.password_policies');
      expect(updateMock.update).toHaveBeenCalled();
      expect(insertMock.insert).toHaveBeenCalled();
    });

    it('should deactivate old policies before creating new one', async () => {
      // Arrange
      const policy = PasswordPolicy.create({
        minLength: 16,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 30,
        preventReuse: 15,
      });

      // Mock update operation
      const updateMock = {
        ...createQueryMock(null),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock insert operation
      const insertMock = {
        ...createQueryMock({ id: 'policy-new' }),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'policy-new',
            min_length: 16,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: true,
            expiration_days: 30,
            prevent_reuse: 15,
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: 'admin-789',
            created_at: new Date().toISOString(),
          },
          error: null
        }),
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return updateMock; // deactivate
        return insertMock; // insert new
      });

      // Act
      await repository.update(policy, 'admin-789');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
      expect(updateMock.update).toHaveBeenCalledWith({ is_active: false });
      expect(updateMock.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const policy = PasswordPolicy.create({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90,
        preventReuse: 5,
      });

      const errorMock = createQueryMock(null, { message: 'Update failed' });
      mockSupabaseClient.from.mockReturnValue(errorMock);

      // Act & Assert
      await expect(repository.update(policy, 'admin-123')).rejects.toThrow();
    });
  });

  describe('getHistory', () => {
    it('should return policy history', async () => {
      // Arrange
      const mockData = [
        {
          id: 'policy-1',
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: false,
          expiration_days: 90,
          prevent_reuse: 3,
          is_active: false,
          updated_at: new Date('2024-01-01').toISOString(),
          updated_by: 'admin-1',
        },
        {
          id: 'policy-2',
          min_length: 12,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: true,
          expiration_days: 60,
          prevent_reuse: 5,
          is_active: true,
          updated_at: new Date('2024-02-01').toISOString(),
          updated_by: 'admin-2',
        },
      ];

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getHistory();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PasswordPolicy);
      expect(result[1]).toBeInstanceOf(PasswordPolicy);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('auth_schema.password_policies');
      expect(queryMock.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('should return empty array when no history exists', async () => {
      // Arrange
      const queryMock = createQueryMock([]);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getHistory();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const queryMock = createQueryMock(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act & Assert
      await expect(repository.getHistory()).rejects.toThrow();
    });
  });

  describe('validate', () => {
    it('should validate password against current policy', async () => {
      // Arrange
      const mockData = {
        id: 'policy-123',
        min_length: 12,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        expiration_days: 90,
        prevent_reuse: 5,
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: 'admin-123',
      };

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const policy = await repository.getCurrent();
      const result = policy.validate('ValidPass123!');

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for weak password', async () => {
      // Arrange
      const mockData = {
        id: 'policy-123',
        min_length: 12,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        expiration_days: 90,
        prevent_reuse: 5,
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: 'admin-123',
      };

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const policy = await repository.getCurrent();
      const result = policy.validate('weak');

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

