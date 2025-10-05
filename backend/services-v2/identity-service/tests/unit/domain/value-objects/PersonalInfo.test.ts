/**
 * PersonalInfo Value Object Unit Tests
 * Tests for personal information validation and business logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';

describe('PersonalInfo Value Object', () => {
  describe('create', () => {
    it('should create PersonalInfo with valid data', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        citizenId: '001234567890'
      });

      expect(personalInfo.fullName).toBe('Nguyễn Văn A');
      expect(personalInfo.phoneNumber).toBe('0901234567');
      expect(personalInfo.address).toBe('123 Đường ABC, Quận 1, TP.HCM');
      expect(personalInfo.gender).toBe('male');
      expect(personalInfo.citizenId).toBe('001234567890');
    });

    it('should trim whitespace from string fields', () => {
      const personalInfo = PersonalInfo.create({
        fullName: '  Nguyễn Văn A  ',
        phoneNumber: '  0901234567  ',
        address: '  123 Đường ABC  ',
        citizenId: '  001234567890  '
      });

      expect(personalInfo.fullName).toBe('Nguyễn Văn A');
      expect(personalInfo.phoneNumber).toBe('0901234567');
      expect(personalInfo.address).toBe('123 Đường ABC');
      expect(personalInfo.citizenId).toBe('001234567890');
    });

    it('should create with minimal required data', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A'
      });

      expect(personalInfo.fullName).toBe('Nguyễn Văn A');
      expect(personalInfo.phoneNumber).toBeUndefined();
      expect(personalInfo.address).toBeUndefined();
      expect(personalInfo.dateOfBirth).toBeUndefined();
      expect(personalInfo.gender).toBeUndefined();
      expect(personalInfo.citizenId).toBeUndefined();
    });

    it('should throw error for empty full name', () => {
      expect(() => PersonalInfo.create({ fullName: '' }))
        .toThrow('Họ tên không được để trống');
    });

    it('should throw error for whitespace-only full name', () => {
      expect(() => PersonalInfo.create({ fullName: '   ' }))
        .toThrow('Họ tên không được để trống');
    });

    it('should throw error for full name less than 2 characters', () => {
      expect(() => PersonalInfo.create({ fullName: 'A' }))
        .toThrow('Họ tên phải có ít nhất 2 ký tự');
    });

    it('should throw error for invalid Vietnamese phone number', () => {
      expect(() => PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '123456789' // Not starting with 0
      })).toThrow('Số điện thoại không hợp lệ');
    });

    it('should throw error for phone number with wrong length', () => {
      expect(() => PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '090123456' // Only 9 digits
      })).toThrow('Số điện thoại không hợp lệ');
    });

    it('should accept valid Vietnamese phone numbers', () => {
      const validPhones = ['0901234567', '0912345678', '0987654321'];
      
      validPhones.forEach(phone => {
        const personalInfo = PersonalInfo.create({
          fullName: 'Nguyễn Văn A',
          phoneNumber: phone
        });
        expect(personalInfo.phoneNumber).toBe(phone);
      });
    });

    it('should throw error for invalid citizen ID', () => {
      expect(() => PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        citizenId: '12345' // Too short
      })).toThrow('Số CMND/CCCD không hợp lệ');
    });

    it('should accept 9-digit citizen ID (CMND)', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        citizenId: '123456789'
      });
      expect(personalInfo.citizenId).toBe('123456789');
    });

    it('should accept 12-digit citizen ID (CCCD)', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        citizenId: '001234567890'
      });
      expect(personalInfo.citizenId).toBe('001234567890');
    });
  });

  describe('isComplete', () => {
    it('should return true when all required fields are present', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        citizenId: '001234567890'
      });

      expect(personalInfo.isComplete()).toBe(true);
    });

    it('should return false when phone number is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        citizenId: '001234567890'
      });

      expect(personalInfo.isComplete()).toBe(false);
    });

    it('should return false when address is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        citizenId: '001234567890'
      });

      expect(personalInfo.isComplete()).toBe(false);
    });

    it('should return false when date of birth is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        gender: 'male',
        citizenId: '001234567890'
      });

      expect(personalInfo.isComplete()).toBe(false);
    });

    it('should return false when gender is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        citizenId: '001234567890'
      });

      expect(personalInfo.isComplete()).toBe(false);
    });

    it('should return false when citizen ID is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      });

      expect(personalInfo.isComplete()).toBe(false);
    });
  });

  describe('hasVietnameseId', () => {
    it('should return true for valid 9-digit citizen ID', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        citizenId: '123456789'
      });

      expect(personalInfo.hasVietnameseId()).toBe(true);
    });

    it('should return true for valid 12-digit citizen ID', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        citizenId: '001234567890'
      });

      expect(personalInfo.hasVietnameseId()).toBe(true);
    });

    it('should return false when citizen ID is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A'
      });

      expect(personalInfo.hasVietnameseId()).toBe(false);
    });
  });

  describe('hasValidPhoneNumber', () => {
    it('should return true for valid Vietnamese phone number', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567'
      });

      expect(personalInfo.hasValidPhoneNumber()).toBe(true);
    });

    it('should return false when phone number is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A'
      });

      expect(personalInfo.hasValidPhoneNumber()).toBe(false);
    });
  });

  describe('getAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: birthDate
      });

      expect(personalInfo.getAge()).toBe(30);
    });

    it('should return null when date of birth is missing', () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A'
      });

      expect(personalInfo.getAge()).toBeNull();
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const birthDate = new Date(today);
      birthDate.setFullYear(today.getFullYear() - 25);
      birthDate.setMonth(today.getMonth() + 1); // Next month
      
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: birthDate
      });

      expect(personalInfo.getAge()).toBe(24); // Still 24, not 25 yet
    });
  });

  describe('value equality', () => {
    it('should be equal when all values are the same', () => {
      const props = {
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as const,
        citizenId: '001234567890'
      };

      const personalInfo1 = PersonalInfo.create(props);
      const personalInfo2 = PersonalInfo.create(props);

      expect(personalInfo1.equals(personalInfo2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      const personalInfo1 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567'
      });

      const personalInfo2 = PersonalInfo.create({
        fullName: 'Nguyễn Văn B',
        phoneNumber: '0901234567'
      });

      expect(personalInfo1.equals(personalInfo2)).toBe(false);
    });
  });
});

