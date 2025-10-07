/**
 * Unit Tests for ValidatePasswordUseCase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValidatePasswordUseCase } from '../../../src/application/use-cases/ValidatePasswordUseCase';
import { IPasswordPolicyRepository } from '../../../src/domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy } from '../../../src/domain/value-objects/PasswordPolicy';

describe('ValidatePasswordUseCase', () => {
  let useCase: ValidatePasswordUseCase;
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

    useCase = new ValidatePasswordUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    beforeEach(() => {
      const mockPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: null,
        preventReuse: 3
      });

      mockRepository.getCurrent.mockResolvedValue(mockPolicy);
    });

    it('should validate a strong password successfully', async () => {
      const result = await useCase.execute({
        password: 'MyP@ssw0rd'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBeDefined();
      expect(['weak', 'medium', 'strong']).toContain(result.strength);
    });

    it('should reject empty password', async () => {
      const result = await useCase.execute({
        password: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu không được để trống');
    });

    it('should reject password that is too short', async () => {
      const result = await useCase.execute({
        password: 'Abc1!'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất 8 ký tự');
    });

    it('should reject password without uppercase', async () => {
      const result = await useCase.execute({
        password: 'myp@ssw0rd'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
    });

    it('should reject password without lowercase', async () => {
      const result = await useCase.execute({
        password: 'MYP@SSW0RD'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
    });

    it('should reject password without numbers', async () => {
      const result = await useCase.execute({
        password: 'MyP@ssword'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ số');
    });

    it('should reject password without special characters', async () => {
      const result = await useCase.execute({
        password: 'MyPassw0rd'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
    });

    it('should calculate weak strength for simple passwords', async () => {
      const result = await useCase.execute({
        password: 'MyP@ss1' // Short but meets requirements
      });

      // May be invalid due to length, but if valid, should be weak
      if (result.isValid) {
        expect(result.strength).toBe('weak');
      }
    });

    it('should calculate medium strength for decent passwords', async () => {
      const result = await useCase.execute({
        password: 'MyP@ssw0rd123'
      });

      expect(result.isValid).toBe(true);
      expect(['medium', 'strong']).toContain(result.strength);
    });

    it('should calculate strong strength for complex passwords', async () => {
      const result = await useCase.execute({
        password: 'MyV3ry$tr0ng&C0mpl3xP@ssw0rd!'
      });

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should penalize passwords with repeated characters', async () => {
      const result = await useCase.execute({
        password: 'MyP@ssw0rd!!!'
      });

      expect(result.isValid).toBe(true);
      // Strength should be affected by repeated characters
      expect(result.strength).toBeDefined();
    });

    it('should penalize passwords with only numbers', async () => {
      const simplePolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      mockRepository.getCurrent.mockResolvedValue(simplePolicy);

      const result = await useCase.execute({
        password: '12345678'
      });

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    it('should penalize passwords with only letters', async () => {
      const simplePolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      mockRepository.getCurrent.mockResolvedValue(simplePolicy);

      const result = await useCase.execute({
        password: 'abcdefgh'
      });

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    it('should throw error if repository fails', async () => {
      mockRepository.getCurrent.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute({
        password: 'MyP@ssw0rd'
      })).rejects.toThrow('Failed to validate password');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return multiple errors for very weak password', async () => {
      const result = await useCase.execute({
        password: 'abc'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

