/**
 * PersonalInfo Value Object Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';

describe('PersonalInfo Value Object', () => {
  const validProps = {
    fullName: 'Nguyễn Văn Test',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male' as const,
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    ethnicity: 'Kinh',
    religion: 'Buddhism',
    occupation: 'Software Engineer',
    maritalStatus: 'single' as const
  };

  describe('create', () => {
    it('should create PersonalInfo with valid data', () => {
      const personalInfo = PersonalInfo.create(validProps);
      
      expect(personalInfo).toBeInstanceOf(PersonalInfo);
      expect(personalInfo.fullName).toBe('Nguyễn Văn Test');
      expect(personalInfo.gender).toBe('male');
      expect(personalInfo.nationalId).toBe('001234567890');
    });

    it('should throw error for empty full name', () => {
      const invalidProps = { ...validProps, fullName: '' };
      
      expect(() => PersonalInfo.create(invalidProps)).toThrow('Họ tên không được để trống');
    });

    it('should throw error for whitespace-only full name', () => {
      const invalidProps = { ...validProps, fullName: '   ' };
      
      expect(() => PersonalInfo.create(invalidProps)).toThrow('Họ tên không được để trống');
    });

    it('should throw error for future date of birth', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const invalidProps = { ...validProps, dateOfBirth: futureDate };

      expect(() => PersonalInfo.create(invalidProps)).toThrow('Ngày sinh phải trước ngày hiện tại');
    });

    it('should throw error for age over 150 years', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 151);
      const invalidProps = { ...validProps, dateOfBirth: oldDate };
      
      expect(() => PersonalInfo.create(invalidProps)).toThrow('Tuổi không hợp lệ');
    });

    it('should throw error for invalid gender', () => {
      const invalidProps = { ...validProps, gender: 'invalid' as any };
      
      expect(() => PersonalInfo.create(invalidProps)).toThrow('Giới tính không hợp lệ');
    });

    it('should throw error for invalid national ID format', () => {
      const invalidIds = [
        '123',
        'ABCDEFGHIJKL',
        '12345678901234567890',
        ''
      ];

      invalidIds.forEach(invalidId => {
        const invalidProps = { ...validProps, nationalId: invalidId };
        expect(() => PersonalInfo.create(invalidProps)).toThrow();
      });
    });

    it('should accept valid Vietnamese national ID (12 digits)', () => {
      const validId = '001234567890';
      const props = { ...validProps, nationalId: validId };
      const personalInfo = PersonalInfo.create(props);
      
      expect(personalInfo.nationalId).toBe(validId);
    });

    it('should accept valid Vietnamese CCCD (12 digits)', () => {
      const validCCCD = '079123456789';
      const props = { ...validProps, nationalId: validCCCD };
      const personalInfo = PersonalInfo.create(props);
      
      expect(personalInfo.nationalId).toBe(validCCCD);
    });
  });

  describe('getAge', () => {
    it('should calculate correct age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);
      
      expect(personalInfo.getAge()).toBe(30);
    });

    it('should return 0 for newborn', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const props = { ...validProps, dateOfBirth: yesterday };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.getAge()).toBe(0);
    });

    it('should handle birthday not yet occurred this year', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      birthDate.setMonth(birthDate.getMonth() + 1); // Next month
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);
      
      expect(personalInfo.getAge()).toBe(24);
    });
  });

  describe('age validation', () => {
    it('should calculate age correctly for adults', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.getAge()).toBeGreaterThanOrEqual(18);
    });

    it('should calculate age correctly for minors', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.getAge()).toBeLessThan(18);
    });

    it('should calculate age correctly for seniors', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 65);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.getAge()).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should support Vietnamese full names with diacritics', () => {
      const vietnameseNames = [
        'Nguyễn Văn Anh',
        'Trần Thị Bình',
        'Lê Hoàng Đức',
        'Phạm Minh Châu'
      ];

      vietnameseNames.forEach(name => {
        const props = { ...validProps, fullName: name };
        const personalInfo = PersonalInfo.create(props);
        expect(personalInfo.fullName).toBe(name);
      });
    });

    it('should support Vietnamese ethnicities', () => {
      const ethnicities = ['Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa'];

      ethnicities.forEach(ethnicity => {
        const props = { ...validProps, ethnicity };
        const personalInfo = PersonalInfo.create(props);
        expect(personalInfo.ethnicity).toBe(ethnicity);
      });
    });

    it('should support Vietnamese marital statuses', () => {
      const statuses: Array<'single' | 'married' | 'divorced' | 'widowed'> = [
        'single',
        'married',
        'divorced',
        'widowed'
      ];

      statuses.forEach(status => {
        const props = { ...validProps, maritalStatus: status };
        const personalInfo = PersonalInfo.create(props);
        expect(personalInfo.maritalStatus).toBe(status);
      });
    });
  });

  describe('equals', () => {
    it('should return true for same personal info', () => {
      const info1 = PersonalInfo.create(validProps);
      const info2 = PersonalInfo.create(validProps);
      
      expect(info1.equals(info2)).toBe(true);
    });

    it('should return false for different personal info', () => {
      const info1 = PersonalInfo.create(validProps);
      const info2 = PersonalInfo.create({
        ...validProps,
        fullName: 'Different Name'
      });
      
      expect(info1.equals(info2)).toBe(false);
    });
  });
});

