/**
 * ProfessionalInfo Value Object Tests
 * @version 2.0.0
 */

import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';

describe('ProfessionalInfo Value Object', () => {
  const validProps = {
    title: 'Bác sĩ',
    department: 'Tim mạch',
    position: 'Bác sĩ điều trị',
    education: ['Tiến sĩ Y khoa'],
    languages: ['Tiếng Việt', 'English'],
    bio: 'Chuyên gia tim mạch'
  };

  describe('create', () => {
    it('should create with valid data', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.title).toBe('Bác sĩ');
      expect(info.department).toBe('Tim mạch');
    });

    it('should trim all fields', () => {
      const info = ProfessionalInfo.create({
        ...validProps,
        title: '  Bác sĩ  ',
        department: '  Tim mạch  '
      });
      expect(info.title).toBe('Bác sĩ');
      expect(info.department).toBe('Tim mạch');
    });

    it('should fail with empty title', () => {
      expect(() => ProfessionalInfo.create({
        ...validProps,
        title: ''
      })).toThrow('Chức danh không được để trống');
    });

    it('should fail with empty department', () => {
      expect(() => ProfessionalInfo.create({
        ...validProps,
        department: ''
      })).toThrow('Khoa/phòng ban không được để trống');
    });

    it('should fail with empty education', () => {
      expect(() => ProfessionalInfo.create({
        ...validProps,
        education: []
      })).toThrow('Trình độ học vấn không được để trống');
    });

    it('should fail with empty languages', () => {
      expect(() => ProfessionalInfo.create({
        ...validProps,
        languages: []
      })).toThrow('Ngôn ngữ không được để trống');
    });
  });

  describe('speaksLanguage', () => {
    it('should return true for spoken language', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.speaksLanguage('Tiếng Việt')).toBe(true);
      expect(info.speaksLanguage('English')).toBe(true);
    });

    it('should return false for non-spoken language', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.speaksLanguage('French')).toBe(false);
    });
  });

  describe('hasEducation', () => {
    it('should return true for matching education', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.hasEducation('Tiến sĩ')).toBe(true);
    });
  });

  describe('isMultilingual', () => {
    it('should return true for multiple languages', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.isMultilingual()).toBe(true);
    });

    it('should return false for single language', () => {
      const info = ProfessionalInfo.create({
        ...validProps,
        languages: ['Tiếng Việt']
      });
      expect(info.isMultilingual()).toBe(false);
    });
  });

  describe('isVietnameseCompliant', () => {
    it('should return true if Vietnamese is spoken', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(info.isVietnameseCompliant()).toBe(true);
    });
  });

  describe('updateBio', () => {
    it('should update bio', () => {
      const info = ProfessionalInfo.create(validProps);
      const updated = info.updateBio('New bio');
      expect(updated.bio).toBe('New bio');
    });

    it('should fail with too long bio', () => {
      const info = ProfessionalInfo.create(validProps);
      const longBio = 'A'.repeat(2001);
      expect(() => info.updateBio(longBio)).toThrow('không được vượt quá 2000 ký tự');
    });
  });

  describe('addLanguage', () => {
    it('should add new language', () => {
      const info = ProfessionalInfo.create(validProps);
      const updated = info.addLanguage('French');
      expect(updated.speaksLanguage('French')).toBe(true);
    });

    it('should fail with duplicate language', () => {
      const info = ProfessionalInfo.create(validProps);
      expect(() => info.addLanguage('English')).toThrow('Ngôn ngữ này đã tồn tại');
    });
  });

  describe('equals', () => {
    it('should be equal for same info', () => {
      const info1 = ProfessionalInfo.create(validProps);
      const info2 = ProfessionalInfo.create(validProps);
      expect(info1.equals(info2)).toBe(true);
    });

    it('should not be equal for different info', () => {
      const info1 = ProfessionalInfo.create(validProps);
      const info2 = ProfessionalInfo.create({
        ...validProps,
        title: 'Điều dưỡng'
      });
      expect(info1.equals(info2)).toBe(false);
    });
  });
});
