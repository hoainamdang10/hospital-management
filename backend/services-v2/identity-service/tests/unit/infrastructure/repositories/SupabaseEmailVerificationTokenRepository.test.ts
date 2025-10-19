/**
 * Unit Tests for SupabaseEmailVerificationTokenRepository
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseEmailVerificationTokenRepository } from '../../../../src/infrastructure/repositories/SupabaseEmailVerificationTokenRepository';
import { ILogger } from '../../../../src/application/services/ILogger';

describe('SupabaseEmailVerificationTokenRepository', () => {
  let repository: SupabaseEmailVerificationTokenRepository;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      single: jest.fn()
    } as any;

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    repository = new SupabaseEmailVerificationTokenRepository({
      supabase: mockSupabase,
      logger: mockLogger,
      schema: 'auth_schema',
      tableName: 'email_verification_tokens'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('store', () => {
    it('should store email verification token successfully', async () => {
      const tokenData = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        expiresAt: new Date('2025-01-08T10:00:00Z')
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await repository.store(tokenData);

      expect(mockSupabase.from).toHaveBeenCalledWith('email_verification_tokens');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email verification token stored successfully',
        { userId: tokenData.userId }
      );
    });

    it('should throw error when storage fails', async () => {
      const tokenData = {
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        expiresAt: new Date()
      };

      const dbError = { message: 'Database error' };
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: dbError })
      });

      await expect(repository.store(tokenData)).rejects.toThrow(
        'Lưu token xác thực email thất bại'
      );
    });
  });

  describe('findByToken', () => {
    it('should find token successfully', async () => {
      const mockTokenData = {
        id: 'token-id-123',
        user_id: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        expires_at: '2025-01-08T10:00:00Z',
        is_used: false,
        used_at: null,
        created_at: '2025-01-07T10:00:00Z'
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTokenData, error: null })
          })
        })
      });

      const result = await repository.findByToken('jwt-token-123');

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        token: 'jwt-token-123',
        expiresAt: new Date('2025-01-08T10:00:00Z'),
        isUsed: false,
        usedAt: undefined
      });
    });

    it('should return null when token not found', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          })
        })
      });

      const result = await repository.findByToken('non-existent-token');

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      const dbError = { message: 'Database error', code: 'DB_ERROR' };
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: dbError })
          })
        })
      });

      await expect(repository.findByToken('jwt-token-123')).rejects.toThrow(
        'Tìm token xác thực email thất bại'
      );
    });
  });

  describe('markAsUsed', () => {
    it('should mark token as used successfully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await repository.markAsUsed('jwt-token-123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email verification token marked as used successfully'
      );
    });

    it('should throw error when marking fails', async () => {
      const dbError = { message: 'Database error' };
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: dbError })
        })
      });

      await expect(repository.markAsUsed('jwt-token-123')).rejects.toThrow(
        'Đánh dấu token đã sử dụng thất bại'
      );
    });
  });

  describe('invalidateAllForUser', () => {
    it('should invalidate all tokens for user successfully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      await repository.invalidateAllForUser('user-123');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'All email verification tokens invalidated successfully',
        { userId: 'user-123' }
      );
    });

    it('should throw error when invalidation fails', async () => {
      const dbError = { message: 'Database error' };
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: dbError })
          })
        })
      });

      await expect(repository.invalidateAllForUser('user-123')).rejects.toThrow(
        'Vô hiệu hóa tokens thất bại'
      );
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired tokens successfully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ count: 5, error: null })
        }),
        delete: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(5);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Expired email verification tokens deleted successfully',
        { deletedCount: 5 }
      );
    });

    it('should return 0 when no expired tokens', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ count: 0, error: null })
        })
      });

      const deletedCount = await repository.deleteExpired();

      expect(deletedCount).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith('No expired tokens to delete');
    });

    it('should throw error when deletion fails', async () => {
      const dbError = { message: 'Database error' };
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ count: 5, error: null })
        }),
        delete: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ error: dbError })
        })
      });

      await expect(repository.deleteExpired()).rejects.toThrow(
        'Xóa tokens hết hạn thất bại'
      );
    });
  });
});

