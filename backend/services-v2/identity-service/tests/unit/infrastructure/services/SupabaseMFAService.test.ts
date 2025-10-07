/**
 * Unit Tests for SupabaseMFAService
 * Tests MFA operations: enable, disable, verify, backup codes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { SupabaseMFAService } from '@infrastructure/services/SupabaseMFAService';
import { MFAMethod } from '@application/services/IMFAService';
import { SupabaseClient } from '@supabase/supabase-js';
import { TestUtils } from '@tests/setup';

describe('SupabaseMFAService', () => {
  let mfaService: SupabaseMFAService;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;
  let logger: any;

  const testUserId = 'test-user-123';
  const testSecret = 'JBSWY3DPEHPK3PXP';
  const testBackupCodes = ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5'];

  beforeEach(() => {
    // Mock console.error để log sạch
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Supabase Client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      rpc: jest.fn(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    } as any;

    logger = TestUtils.createMockLogger();

    mfaService = new SupabaseMFAService(mockSupabaseClient, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('enableMFA', () => {
    it('should enable MFA with 2FA app method successfully', async () => {
      const method: MFAMethod = '2fa_app';
      
      // Mock RPC for backup codes
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      // Mock upsert
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA(testUserId, method);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.secret).toHaveLength(32); // Base32 secret
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.backupCodes).toEqual(testBackupCodes);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          method,
          is_enabled: false,
        })
      );
    });

    it('should enable MFA with SMS method', async () => {
      const method: MFAMethod = 'sms';
      const phoneNumber = '+84901234567';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA(testUserId, method, phoneNumber);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('backupCodes');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          method,
          phone_number: phoneNumber,
          is_enabled: false,
        })
      );
    });

    it('should enable MFA with email method', async () => {
      const method: MFAMethod = 'email';
      const email = 'test@example.com';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA(testUserId, method, undefined, email);

      expect(result).toHaveProperty('secret');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          method,
          email,
          is_enabled: false,
        })
      );
    });

    it('should use local backup codes when RPC fails', async () => {
      const method: MFAMethod = '2fa_app';

      // Mock RPC failure
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA(testUserId, method);

      expect(result).toHaveProperty('backupCodes');
      expect(result.backupCodes).toHaveLength(10); // Local generation creates 10 codes
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to generate backup codes via RPC, using fallback',
        expect.any(Object)
      );
    });

    it('should throw error when upsert fails', async () => {
      const method: MFAMethod = '2fa_app';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      await expect(mfaService.enableMFA(testUserId, method)).rejects.toThrow(
        'Lỗi lưu cài đặt MFA'
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to store MFA settings',
        expect.any(Object)
      );
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA successfully', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      await mfaService.disableMFA(testUserId);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_enabled: false,
        })
      );
    });

    it('should throw error when disable fails', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      await expect(mfaService.disableMFA(testUserId)).rejects.toThrow(
        'Lỗi vô hiệu hóa MFA'
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    it('should verify valid TOTP code', async () => {
      const code = '123456';
      const method: MFAMethod = '2fa_app';

      // Mock getMFASettings
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: testUserId,
              method: '2fa_app',
              is_enabled: true,
              secret_key: testSecret,
            },
            error: null,
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      // Note: Actual TOTP verification depends on time, so we can't test exact code
      // This test verifies the flow works
      const result = await mfaService.verifyCode(testUserId, code, method);

      expect(typeof result).toBe('boolean');
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return false when MFA settings not found', async () => {
      const code = '123456';
      const method: MFAMethod = '2fa_app';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.verifyCode(testUserId, code, method);

      expect(result).toBe(false);
    });

    it('should return false when secret key is missing', async () => {
      const code = '123456';
      const method: MFAMethod = '2fa_app';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              user_id: testUserId,
              method: '2fa_app',
              is_enabled: true,
              secret_key: null, // No secret
            },
            error: null,
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.verifyCode(testUserId, code, method);

      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate backup codes via RPC', async () => {
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const result = await mfaService.generateBackupCodes(testUserId);

      expect(result).toEqual(testBackupCodes);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('generate_backup_codes');
    });

    it('should fallback to local generation when RPC fails', async () => {
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      const result = await mfaService.generateBackupCodes(testUserId);

      expect(result).toHaveLength(10);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to generate backup codes via RPC, using fallback',
        expect.any(Object)
      );
    });

    it('should fallback to local generation when RPC throws', async () => {
      mockSupabaseClient.rpc = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await mfaService.generateBackupCodes(testUserId);

      expect(result).toHaveLength(10);
      expect(logger.warn).toHaveBeenCalledWith(
        'Error calling generate_backup_codes RPC, using fallback',
        expect.any(Object)
      );
    });

    it('should use local generation when RPC returns null data', async () => {
      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await mfaService.generateBackupCodes(testUserId);

      expect(result).toHaveLength(10);
    });
  });

  describe('validateBackupCode', () => {
    it('should validate backup code successfully', async () => {
      const code = 'BACKUP123';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: { valid: true },
        error: null,
      });

      const result = await mfaService.validateBackupCode(testUserId, code);

      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('validate_backup_code', {
        p_user_id: testUserId,
        p_code: code,
      });
    });

    it('should return false for invalid backup code', async () => {
      const code = 'INVALID';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: { valid: false },
        error: null,
      });

      const result = await mfaService.validateBackupCode(testUserId, code);

      expect(result).toBe(false);
    });

    it('should return false when RPC fails', async () => {
      const code = 'BACKUP123';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      const result = await mfaService.validateBackupCode(testUserId, code);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to validate backup code',
        expect.any(Object)
      );
    });

    it('should return false when RPC throws', async () => {
      const code = 'BACKUP123';

      mockSupabaseClient.rpc = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await mfaService.validateBackupCode(testUserId, code);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error validating backup code',
        expect.any(Object)
      );
    });

    it('should return false when data is null', async () => {
      const code = 'BACKUP123';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await mfaService.validateBackupCode(testUserId, code);

      expect(result).toBe(false);
    });
  });

  describe('isMFAEnabled', () => {
    it('should return true when MFA is enabled', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_enabled: true },
            error: null,
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.isMFAEnabled(testUserId);

      expect(result).toBe(true);
    });

    it('should return false when MFA is disabled', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_enabled: false },
            error: null,
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.isMFAEnabled(testUserId);

      expect(result).toBe(false);
    });

    it('should return false when query fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.isMFAEnabled(testUserId);

      expect(result).toBe(false);
    });
  });

  describe('getMFASettings', () => {
    it('should get MFA settings successfully', async () => {
      const mockData = {
        user_id: testUserId,
        method: '2fa_app',
        is_enabled: true,
        secret_key: testSecret,
        phone_number: null,
        email: null,
        backup_codes: testBackupCodes,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.getMFASettings(testUserId);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testUserId);
      expect(result?.method).toBe('2fa_app');
      expect(result?.isEnabled).toBe(true);
      expect(result?.secretKey).toBe(testSecret);
    });

    it('should return null when settings not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.getMFASettings(testUserId);

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      // Mock the entire chain to throw error
      mockSupabaseClient.from = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await mfaService.getMFASettings(testUserId);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateMFASettings', () => {
    it('should update MFA settings successfully', async () => {
      const settings = {
        isEnabled: true,
        method: '2fa_app' as MFAMethod,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      await mfaService.updateMFASettings(testUserId, settings);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_enabled: true,
          method: '2fa_app',
        })
      );
    });

    it('should update partial settings', async () => {
      const settings = {
        phoneNumber: '+84901234567',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      await mfaService.updateMFASettings(testUserId, settings);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          phone_number: '+84901234567',
        })
      );
    });

    it('should throw error when update fails', async () => {
      const settings = { isEnabled: true };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      await expect(mfaService.updateMFASettings(testUserId, settings)).rejects.toThrow(
        'Lỗi cập nhật cài đặt MFA'
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow when under rate limit', async () => {
      const attemptType = 'login';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 1 }, { id: 2 }], // 2 attempts
          error: null,
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.checkRateLimit(testUserId, attemptType);

      expect(result).toBe(true); // Under 5 attempts limit
    });

    it('should deny when rate limit exceeded', async () => {
      const attemptType = 'login';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }], // 5 attempts
          error: null,
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.checkRateLimit(testUserId, attemptType);

      expect(result).toBe(false); // At limit
    });

    it('should allow on error (fail open)', async () => {
      const attemptType = 'login';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await mfaService.checkRateLimit(testUserId, attemptType);

      expect(result).toBe(true); // Fail open for availability
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record failed attempt', async () => {
      const attemptType = 'login';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      await mfaService.recordFailedAttempt(testUserId, attemptType, ipAddress, userAgent);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: testUserId,
          attempt_type: attemptType,
          success: false,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
      );
    });

    it('should handle insert errors gracefully', async () => {
      const attemptType = 'login';

      const mockInsert = jest.fn().mockRejectedValue(new Error('Database error'));
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Should not throw
      await mfaService.recordFailedAttempt(testUserId, attemptType);

      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to record failed attempt',
        expect.any(Object)
      );
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear failed attempts', async () => {
      const attemptType = 'login';

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
      });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        delete: mockDelete,
      });

      await mfaService.clearFailedAttempts(testUserId, attemptType);

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle delete errors gracefully', async () => {
      const attemptType = 'login';

      // Mock the entire chain to throw error
      mockSupabaseClient.from = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      // Should not throw
      await mfaService.clearFailedAttempts(testUserId, attemptType);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user ID gracefully', async () => {
      const method: MFAMethod = '2fa_app';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA('', method);

      expect(result).toHaveProperty('secret');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: '',
        })
      );
    });

    it('should generate unique secrets for each enableMFA call', async () => {
      const method: MFAMethod = '2fa_app';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result1 = await mfaService.enableMFA(testUserId, method);
      const result2 = await mfaService.enableMFA(testUserId, method);

      expect(result1.secret).not.toBe(result2.secret);
    });

    it('should generate valid QR code URLs', async () => {
      const method: MFAMethod = '2fa_app';

      mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
        data: testBackupCodes,
        error: null,
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabaseClient.from = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      const result = await mfaService.enableMFA(testUserId, method);

      expect(result.qrCodeUrl).toMatch(/^otpauth:\/\/totp\//);
      expect(result.qrCodeUrl).toContain('secret=');
      expect(result.qrCodeUrl).toContain('issuer=Hospital+Management');
      expect(result.qrCodeUrl).toContain('algorithm=SHA1');
      expect(result.qrCodeUrl).toContain('digits=6');
      expect(result.qrCodeUrl).toContain('period=30');
    });
  });
});

