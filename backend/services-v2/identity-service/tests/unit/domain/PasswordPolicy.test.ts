/**
 * Unit Tests for PasswordPolicy Value Object
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PasswordPolicy } from '../../../src/domain/value-objects/PasswordPolicy';

describe('PasswordPolicy Value Object', () => {
  describe('create', () => {
    it('should create a valid password policy', () => {
      const policy = PasswordPolicy.create({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
        preventReuse: 5
      });

      expect(policy.minLength).toBe(10);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSpecialChars).toBe(true);
      expect(policy.expirationDays).toBe(90);
      expect(policy.preventReuse).toBe(5);
    });

    it('should throw error if minLength is less than 6', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 5,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: null,
          preventReuse: 3
        });
      }).toThrow('Minimum password length must be at least 6 characters');
    });

    it('should throw error if minLength exceeds 128', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 129,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: null,
          preventReuse: 3
        });
      }).toThrow('Minimum password length cannot exceed 128 characters');
    });

    it('should throw error if expirationDays is less than 1', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: 0,
          preventReuse: 3
        });
      }).toThrow('Password expiration days must be at least 1');
    });

    it('should throw error if expirationDays exceeds 365', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: 366,
          preventReuse: 3
        });
      }).toThrow('Password expiration days cannot exceed 365');
    });

    it('should allow null expirationDays', () => {
      const policy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      expect(policy.expirationDays).toBeNull();
    });

    it('should throw error if preventReuse is negative', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: null,
          preventReuse: -1
        });
      }).toThrow('Prevent reuse count cannot be negative');
    });

    it('should throw error if preventReuse exceeds 24', () => {
      expect(() => {
        PasswordPolicy.create({
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: null,
          preventReuse: 25
        });
      }).toThrow('Prevent reuse count cannot exceed 24');
    });
  });

  describe('createDefault', () => {
    it('should create default password policy', () => {
      const policy = PasswordPolicy.createDefault();

      expect(policy.minLength).toBe(8);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSpecialChars).toBe(false);
      expect(policy.expirationDays).toBeNull();
      expect(policy.preventReuse).toBe(3);
    });
  });

  describe('validate', () => {
    let policy: PasswordPolicy;

    beforeEach(() => {
      policy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: null,
        preventReuse: 3
      });
    });

    it('should validate a strong password', () => {
      const result = policy.validate('MyP@ssw0rd');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than minLength', () => {
      const result = policy.validate('Abc1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất 8 ký tự');
    });

    it('should reject password without uppercase', () => {
      const result = policy.validate('myp@ssw0rd');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
    });

    it('should reject password without lowercase', () => {
      const result = policy.validate('MYP@SSW0RD');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
    });

    it('should reject password without numbers', () => {
      const result = policy.validate('MyP@ssword');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một chữ số');
    });

    it('should reject password without special characters', () => {
      const result = policy.validate('MyPassw0rd');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
    });

    it('should return multiple errors for invalid password', () => {
      const result = policy.validate('abc');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should validate password when special chars not required', () => {
      const simplePolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      const result = simplePolicy.validate('MyPassw0rd');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getStrengthDescription', () => {
    it('should return correct description for all requirements', () => {
      const policy = PasswordPolicy.create({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: null,
        preventReuse: 3
      });

      const description = policy.getStrengthDescription();

      expect(description).toContain('10 ký tự');
      expect(description).toContain('chữ hoa');
      expect(description).toContain('chữ thường');
      expect(description).toContain('số');
      expect(description).toContain('ký tự đặc biệt');
    });

    it('should return correct description for minimal requirements', () => {
      const policy = PasswordPolicy.create({
        minLength: 6,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 0
      });

      const description = policy.getStrengthDescription();

      expect(description).toContain('6 ký tự');
      expect(description).not.toContain('chữ hoa');
      expect(description).not.toContain('chữ thường');
      expect(description).not.toContain('số');
      expect(description).not.toContain('ký tự đặc biệt');
    });
  });

  describe('equals', () => {
    it('should return true for identical policies', () => {
      const policy1 = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      const policy2 = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      expect(policy1.equals(policy2)).toBe(true);
    });

    it('should return false for different policies', () => {
      const policy1 = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      const policy2 = PasswordPolicy.create({
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: null,
        preventReuse: 3
      });

      expect(policy1.equals(policy2)).toBe(false);
    });
  });
});

