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

  describe('isMinor', () => {
    it('should return true for patient under 18', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isMinor()).toBe(true);
    });

    it('should return false for patient 18 or older', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isMinor()).toBe(false);
    });

    it('should return false for patient exactly 18 years old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isMinor()).toBe(false);
    });
  });

  describe('isElderly', () => {
    it('should return true for patient 65 or older', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 70);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isElderly()).toBe(true);
    });

    it('should return false for patient under 65', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 50);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isElderly()).toBe(false);
    });

    it('should return true for patient exactly 65 years old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 65);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.isElderly()).toBe(true);
    });
  });

  describe('isVietnameseCompliant', () => {
    it('should return true for valid Vietnamese data', () => {
      const personalInfo = PersonalInfo.create(validProps);

      expect(personalInfo.isVietnameseCompliant()).toBe(true);
    });

    it('should return false for invalid national ID', () => {
      const props = { ...validProps, nationalId: '123' };

      expect(() => PersonalInfo.create(props)).toThrow('Số CMND/CCCD không hợp lệ');
    });

    it('should return false for short full name', () => {
      const props = { ...validProps, fullName: 'A' };

      expect(() => PersonalInfo.create(props)).toThrow('Họ tên phải có ít nhất 2 ký tự');
    });
  });

  describe('isHIPAACompliant', () => {
    it('should return true for valid HIPAA data', () => {
      const personalInfo = PersonalInfo.create(validProps);

      expect(personalInfo.isHIPAACompliant()).toBe(true);
    });

    it('should return true with minimal required fields', () => {
      const minimalProps = {
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      };
      const personalInfo = PersonalInfo.create(minimalProps);

      expect(personalInfo.isHIPAACompliant()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true for valid personal info', () => {
      const personalInfo = PersonalInfo.create(validProps);

      expect(personalInfo.isValid()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const personalInfo = PersonalInfo.create(validProps);
      const persistence = personalInfo.toPersistence();

      expect(persistence.fullName).toBe('Nguyễn Văn Test');
      expect(persistence.dateOfBirth).toBe(validProps.dateOfBirth.toISOString());
      expect(persistence.gender).toBe('male');
      expect(persistence.nationalId).toBe('001234567890');
      expect(persistence.nationality).toBe('Vietnamese');
      expect(persistence.ethnicity).toBe('Kinh');
      expect(persistence.occupation).toBe('Software Engineer');
      expect(persistence.maritalStatus).toBe('single');
    });

    it('should handle optional fields in persistence', () => {
      const minimalProps = {
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      };
      const personalInfo = PersonalInfo.create(minimalProps);
      const persistence = personalInfo.toPersistence();

      expect(persistence.ethnicity).toBeUndefined();
      expect(persistence.occupation).toBeUndefined();
      expect(persistence.maritalStatus).toBeUndefined();
    });
  });

  describe('fromPersistence', () => {
    it('should create from persistence data', () => {
      const persistenceData = {
        fullName: 'Nguyễn Văn Test',
        dateOfBirth: '1990-01-15T00:00:00.000Z',
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        ethnicity: 'Kinh',
        occupation: 'Software Engineer',
        maritalStatus: 'single'
      };
      const personalInfo = PersonalInfo.fromPersistence(persistenceData);

      expect(personalInfo.fullName).toBe('Nguyễn Văn Test');
      expect(personalInfo.dateOfBirth).toEqual(new Date('1990-01-15T00:00:00.000Z'));
      expect(personalInfo.gender).toBe('male');
      expect(personalInfo.nationalId).toBe('001234567890');
      expect(personalInfo.nationality).toBe('Vietnamese');
      expect(personalInfo.ethnicity).toBe('Kinh');
      expect(personalInfo.occupation).toBe('Software Engineer');
      expect(personalInfo.maritalStatus).toBe('single');
    });

    it('should handle optional fields from persistence', () => {
      const persistenceData = {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      };
      const personalInfo = PersonalInfo.fromPersistence(persistenceData);

      expect(personalInfo.ethnicity).toBeUndefined();
      expect(personalInfo.occupation).toBeUndefined();
      expect(personalInfo.maritalStatus).toBeUndefined();
    });
  });

  describe('getDisplayName', () => {
    it('should return full name', () => {
      const personalInfo = PersonalInfo.create(validProps);

      expect(personalInfo.getDisplayName()).toBe('Nguyễn Văn Test');
    });
  });

  describe('getMaskedNationalId', () => {
    it('should mask national ID showing only last 4 digits', () => {
      const personalInfo = PersonalInfo.create(validProps);

      expect(personalInfo.getMaskedNationalId()).toBe('***7890');
    });

    it('should return *** for short national ID', () => {
      const props = { ...validProps, nationalId: '123456789' };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.getMaskedNationalId()).toBe('***6789');
    });
  });

  describe('getSummaryForLogging', () => {
    it('should return summary without sensitive data', () => {
      const personalInfo = PersonalInfo.create(validProps);
      const summary = personalInfo.getSummaryForLogging();

      expect(summary).toHaveProperty('fullName', 'Nguyễn Văn Test');
      expect(summary).toHaveProperty('age');
      expect(summary).toHaveProperty('gender', 'male');
      expect(summary).toHaveProperty('nationality', 'Vietnamese');
      expect(summary).toHaveProperty('isMinor');
      expect(summary).toHaveProperty('isElderly');
      expect(summary).not.toHaveProperty('nationalId');
    });

    it('should include correct age flags for minor', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);
      const summary = personalInfo.getSummaryForLogging();

      expect(summary).toMatchObject({
        isMinor: true,
        isElderly: false
      });
    });

    it('should include correct age flags for elderly', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 70);
      const props = { ...validProps, dateOfBirth: birthDate };
      const personalInfo = PersonalInfo.create(props);
      const summary = personalInfo.getSummaryForLogging();

      expect(summary).toMatchObject({
        isMinor: false,
        isElderly: true
      });
    });
  });

  describe('data trimming', () => {
    it('should trim full name', () => {
      const props = { ...validProps, fullName: '  Nguyễn Văn Test  ' };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.fullName).toBe('Nguyễn Văn Test');
    });

    it('should trim national ID', () => {
      const props = { ...validProps, nationalId: '  001234567890  ' };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.nationalId).toBe('001234567890');
    });

    it('should trim nationality', () => {
      const props = { ...validProps, nationality: '  Vietnamese  ' };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.nationality).toBe('Vietnamese');
    });

    it('should trim optional fields', () => {
      const props = {
        ...validProps,
        ethnicity: '  Kinh  ',
        occupation: '  Software Engineer  ',
        maritalStatus: '  single  '
      };
      const personalInfo = PersonalInfo.create(props);

      expect(personalInfo.ethnicity).toBe('Kinh');
      expect(personalInfo.occupation).toBe('Software Engineer');
      expect(personalInfo.maritalStatus).toBe('single');
    });
  });

  describe('validation errors', () => {
    it('should throw error for empty nationality', () => {
      const props = { ...validProps, nationality: '' };

      expect(() => PersonalInfo.create(props)).toThrow('Quốc tịch không được để trống');
    });

    it('should throw error for whitespace-only nationality', () => {
      const props = { ...validProps, nationality: '   ' };

      expect(() => PersonalInfo.create(props)).toThrow('Quốc tịch không được để trống');
    });

    it('should throw error for empty national ID', () => {
      const props = { ...validProps, nationalId: '' };

      expect(() => PersonalInfo.create(props)).toThrow('CMND/CCCD không được để trống');
    });

    it('should throw error for whitespace-only national ID', () => {
      const props = { ...validProps, nationalId: '   ' };

      expect(() => PersonalInfo.create(props)).toThrow('CMND/CCCD không được để trống');
    });

    it('should throw error for missing gender', () => {
      const props = { ...validProps, gender: undefined as any };

      expect(() => PersonalInfo.create(props)).toThrow('Giới tính không được để trống');
    });

    it('should throw error for missing date of birth', () => {
      const props = { ...validProps, dateOfBirth: undefined as any };

      expect(() => PersonalInfo.create(props)).toThrow('Ngày sinh không được để trống');
    });
  });
});

