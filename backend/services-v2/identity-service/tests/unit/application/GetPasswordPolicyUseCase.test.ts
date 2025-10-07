/**
 * Unit Tests for GetPasswordPolicyUseCase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetPasswordPolicyUseCase } from '../../../src/application/use-cases/GetPasswordPolicyUseCase';
import { IPasswordPolicyRepository } from '../../../src/domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy } from '../../../src/domain/value-objects/PasswordPolicy';

describe('GetPasswordPolicyUseCase', () => {
  let useCase: GetPasswordPolicyUseCase;
  let mockRepository: jest.Mocked<IPasswordPolicyRepository>;
  let mockLogger: any;

  beforeEach(() => {
    mockRepository = {
      getCurrent: jest.fn(),
      update: jest.fn(),
      getHistory: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    useCase = new GetPasswordPolicyUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should return current password policy successfully', async () => {
      const mockPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      mockRepository.getCurrent.mockResolvedValue(mockPolicy);

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.policy.minLength).toBe(8);
      expect(result.policy.requireUppercase).toBe(true);
      expect(result.description).toContain('8 ký tự');
      expect(mockRepository.getCurrent).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Getting current password policy');
    });

    it('should return default policy if none exists', async () => {
      const defaultPolicy = PasswordPolicy.createDefault();
      mockRepository.getCurrent.mockResolvedValue(defaultPolicy);

      const result = await useCase.execute();

      expect(result.success).toBe(true);
      expect(result.policy.minLength).toBe(8);
      expect(result.policy.requireUppercase).toBe(true);
      expect(result.policy.requireLowercase).toBe(true);
      expect(result.policy.requireNumbers).toBe(true);
      expect(result.policy.requireSpecialChars).toBe(false);
    });

    it('should include strength description in response', async () => {
      const mockPolicy = PasswordPolicy.create({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
        preventReuse: 5
      });

      mockRepository.getCurrent.mockResolvedValue(mockPolicy);

      const result = await useCase.execute();

      expect(result.description).toContain('12 ký tự');
      expect(result.description).toContain('chữ hoa');
      expect(result.description).toContain('chữ thường');
      expect(result.description).toContain('số');
      expect(result.description).toContain('ký tự đặc biệt');
    });

    it('should throw error if repository fails', async () => {
      mockRepository.getCurrent.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute()).rejects.toThrow('Failed to get password policy');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

