/**
 * MedicalCredentials Value Object Tests
 * @version 2.0.0
 */

import { MedicalCredentials } from '../../../../src/domain/value-objects/MedicalCredentials';

describe('MedicalCredentials Value Object', () => {
  const validCredentials = {
    licenseNumber: 'VN-GP-123456',
    licenseType: 'general' as const,
    issuingAuthority: 'Bộ Y tế',
    issueDate: new Date('2020-01-01'),
    expirationDate: new Date('2025-12-31'),
    specialtyLicenses: [],
    medicalDegree: 'MD',
    medicalSchool: 'Đại học Y Hà Nội',
    graduationYear: 2019,
    boardCertifications: []
  };

  describe('create', () => {
    it('should create with valid data', () => {
      const credentials = MedicalCredentials.create(validCredentials);
      expect(credentials.licenseNumber).toBe('VN-GP-123456');
    });

    it('should fail with invalid license format', () => {
      expect(() => MedicalCredentials.create({
        ...validCredentials,
        licenseNumber: 'INVALID'
      })).toThrow('Số giấy phép hành nghề không đúng định dạng');
    });

    it('should fail when issue date in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      expect(() => MedicalCredentials.create({
        ...validCredentials,
        issueDate: futureDate
      })).toThrow('Ngày cấp phép không được là ngày trong tương lai');
    });
  });

  describe('isExpired', () => {
    it('should return false for valid credentials', () => {
      const credentials = MedicalCredentials.create(validCredentials);
      expect(credentials.isExpired()).toBe(false);
    });

    it('should return true for expired credentials', () => {
      const credentials = MedicalCredentials.create({
        ...validCredentials,
        expirationDate: new Date('2020-01-01')
      });
      expect(credentials.isExpired()).toBe(true);
    });
  });

  describe('canPracticeInVietnam', () => {
    it('should return true for valid Vietnamese license', () => {
      const credentials = MedicalCredentials.create(validCredentials);
      expect(credentials.canPracticeInVietnam()).toBe(true);
    });
  });

  describe('getYearsOfPractice', () => {
    it('should calculate years of practice', () => {
      const credentials = MedicalCredentials.create(validCredentials);
      const years = credentials.getYearsOfPractice();
      expect(years).toBeGreaterThan(0);
    });
  });

  describe('equals', () => {
    it('should be equal for same credentials', () => {
      const cred1 = MedicalCredentials.create(validCredentials);
      const cred2 = MedicalCredentials.create(validCredentials);
      expect(cred1.equals(cred2)).toBe(true);
    });
  });
});
