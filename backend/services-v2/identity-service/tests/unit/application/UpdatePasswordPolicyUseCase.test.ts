/**
 * Unit Tests for UpdatePasswordPolicyUseCase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdatePasswordPolicyUseCase } from '../../../src/application/use-cases/UpdatePasswordPolicyUseCase';
import { IPasswordPolicyRepository } from '../../../src/domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy } from '../../../src/domain/value-objects/PasswordPolicy';

describe('UpdatePasswordPolicyUseCase', () => {
  let useCase: UpdatePasswordPolicyUseCase;
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

    useCase = new UpdatePasswordPolicyUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should update password policy successfully', async () => {
      const updatedPolicy = PasswordPolicy.create({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
        preventReuse: 5
      });

      mockRepository.update.mockResolvedValue(updatedPolicy);

      const result = await useCase.execute({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
        preventReuse: 5,
        updatedBy: 'admin-user-id'
      });

      expect(result.success).toBe(true);
      expect(result.policy.minLength).toBe(10);
      expect(result.policy.requireSpecialChars).toBe(true);
      expect(result.policy.expirationDays).toBe(90);
      expect(result.message).toContain('thành công');
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Updating password policy by user admin-user-id');
    });

    it('should throw error if updatedBy is missing', async () => {
      await expect(useCase.execute({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3,
        updatedBy: ''
      })).rejects.toThrow('Updated by user ID is required');
    });

    it('should throw error if minLength is invalid', async () => {
      await expect(useCase.execute({
        minLength: 5, // Too short
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3,
        updatedBy: 'admin-user-id'
      })).rejects.toThrow();
    });

    it('should throw error if expirationDays is invalid', async () => {
      await expect(useCase.execute({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 400, // Too long
        preventReuse: 3,
        updatedBy: 'admin-user-id'
      })).rejects.toThrow();
    });

    it('should throw error if preventReuse is invalid', async () => {
      await expect(useCase.execute({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: -1, // Negative
        updatedBy: 'admin-user-id'
      })).rejects.toThrow();
    });

    it('should allow null expirationDays', async () => {
      const updatedPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      mockRepository.update.mockResolvedValue(updatedPolicy);

      const result = await useCase.execute({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3,
        updatedBy: 'admin-user-id'
      });

      expect(result.success).toBe(true);
      expect(result.policy.expirationDays).toBeNull();
    });

    it('should throw error if repository fails', async () => {
      expect.assertions(2);
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3,
        updatedBy: 'admin-user-id'
      })).rejects.toThrow('Failed to update password policy');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should create policy with all requirements enabled', async () => {
      const strictPolicy = PasswordPolicy.create({
        minLength: 16,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 30,
        preventReuse: 10
      });

      mockRepository.update.mockResolvedValue(strictPolicy);

      const result = await useCase.execute({
        minLength: 16,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 30,
        preventReuse: 10,
        updatedBy: 'admin-user-id'
      });

      expect(result.success).toBe(true);
      expect(result.policy.minLength).toBe(16);
      expect(result.policy.expirationDays).toBe(30);
      expect(result.policy.preventReuse).toBe(10);
    });
  });
});

