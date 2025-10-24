/**
 * StaffCertification Entity Tests
 * Provider/Staff Service - Domain Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { StaffCertification } from '../../../../src/domain/entities/StaffCertification';

describe('StaffCertification Entity', () => {
  const validCertificationData = {
    certificationName: 'Advanced Cardiac Life Support (ACLS)',
    issuingOrganization: 'American Heart Association',
    issueDate: new Date('2023-01-15'),
    expiryDate: new Date('2025-01-15')
  };

  describe('create', () => {
    it('should create certification with valid data', () => {
      const cert = StaffCertification.create(validCertificationData);

      expect(cert).toBeDefined();
      expect(cert.certificationName).toBe('Advanced Cardiac Life Support (ACLS)');
      expect(cert.issuingOrganization).toBe('American Heart Association');
      expect(cert.isValid).toBe(true);
    });

    it('should create certification without expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCertificationData;
      const cert = StaffCertification.create(dataWithoutExpiry);

      expect(cert.expiryDate).toBeUndefined();
      expect(cert.isExpired()).toBe(false);
    });

    it('should set timestamps automatically', () => {
      const cert = StaffCertification.create(validCertificationData);
      const persistence = cert.toPersistence();

      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', () => {
      const cert = StaffCertification.create(validCertificationData);

      expect(() => cert.validate()).not.toThrow();
    });

    it('should fail when certification name is empty', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        certificationName: ''
      });

      expect(() => cert.validate()).toThrow('Tên chứng chỉ không được để trống');
    });

    it('should fail when certification name is whitespace only', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        certificationName: '   '
      });

      expect(() => cert.validate()).toThrow('Tên chứng chỉ không được để trống');
    });
  });

  describe('isExpired', () => {
    it('should return false for valid certification', () => {
      const cert = StaffCertification.create(validCertificationData);

      expect(cert.isExpired()).toBe(false);
    });

    it('should return true for expired certification', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        expiryDate: new Date('2020-01-01')
      });

      expect(cert.isExpired()).toBe(true);
    });

    it('should return false when no expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCertificationData;
      const cert = StaffCertification.create(dataWithoutExpiry);

      expect(cert.isExpired()).toBe(false);
    });

    it('should handle today as expiry date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const cert = StaffCertification.create({
        ...validCertificationData,
        expiryDate: yesterday
      });

      expect(cert.isExpired()).toBe(true);
    });
  });

  describe('isHIPAACompliant', () => {
    it('should be compliant when valid and not expired', () => {
      const cert = StaffCertification.create(validCertificationData);

      expect(cert.isHIPAACompliant()).toBe(true);
    });

    it('should not be compliant when expired', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        expiryDate: new Date('2020-01-01')
      });

      expect(cert.isHIPAACompliant()).toBe(false);
    });

    it('should be compliant when valid with no expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCertificationData;
      const cert = StaffCertification.create(dataWithoutExpiry);

      expect(cert.isHIPAACompliant()).toBe(true);
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstruct certification from database', () => {
      const dbData = {
        id: 'cert-123',
        certification_name: 'ACLS',
        issuing_organization: 'AHA',
        issue_date: '2023-01-15T00:00:00.000Z',
        expiry_date: '2025-01-15T00:00:00.000Z',
        is_valid: true,
        created_at: '2023-01-15T00:00:00.000Z',
        updated_at: '2023-01-15T00:00:00.000Z'
      };

      const cert = StaffCertification.fromPersistenceData(dbData);

      expect(cert.certificationName).toBe('ACLS');
      expect(cert.issuingOrganization).toBe('AHA');
      expect(cert.isValid).toBe(true);
    });

    it('should handle null expiry date', () => {
      const dbData = {
        id: 'cert-123',
        certification_name: 'ACLS',
        issuing_organization: 'AHA',
        issue_date: '2023-01-15T00:00:00.000Z',
        expiry_date: null,
        is_valid: true,
        created_at: '2023-01-15T00:00:00.000Z',
        updated_at: '2023-01-15T00:00:00.000Z'
      };

      const cert = StaffCertification.fromPersistenceData(dbData);

      expect(cert.expiryDate).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should convert to database format', () => {
      const cert = StaffCertification.create(validCertificationData);

      const persistence = cert.toPersistence();

      expect(persistence).toHaveProperty('certification_name');
      expect(persistence).toHaveProperty('issuing_organization');
      expect(persistence).toHaveProperty('issue_date');
      expect(persistence).toHaveProperty('expiry_date');
      expect(persistence).toHaveProperty('is_valid', true);
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });

    it('should handle optional expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCertificationData;
      const cert = StaffCertification.create(dataWithoutExpiry);

      const persistence = cert.toPersistence();

      expect(persistence.expiry_date).toBeUndefined();
    });

    it('should convert dates to ISO strings', () => {
      const cert = StaffCertification.create(validCertificationData);

      const persistence = cert.toPersistence();

      expect(typeof persistence.issue_date).toBe('string');
      expect(typeof persistence.expiry_date).toBe('string');
      expect(persistence.issue_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Healthcare Certifications', () => {
    it('should support common Vietnamese medical certifications', () => {
      const certifications = [
        'Chứng chỉ Hồi sức Tim phổi Cơ bản (BLS)',
        'Chứng chỉ Hồi sức Tim phổi Nâng cao (ACLS)',
        'Chứng chỉ Hồi sức Nhi khoa (PALS)',
        'Chứng chỉ Điều dưỡng Đa khoa',
        'Chứng chỉ Kỹ thuật Nội soi'
      ];

      certifications.forEach(certName => {
        const cert = StaffCertification.create({
          ...validCertificationData,
          certificationName: certName
        });

        expect(cert.certificationName).toBe(certName);
        expect(() => cert.validate()).not.toThrow();
      });
    });

    it('should support international certifications', () => {
      const certifications = [
        'Advanced Cardiac Life Support (ACLS)',
        'Pediatric Advanced Life Support (PALS)',
        'Basic Life Support (BLS)',
        'Advanced Trauma Life Support (ATLS)',
        'Neonatal Resuscitation Program (NRP)'
      ];

      certifications.forEach(certName => {
        const cert = StaffCertification.create({
          ...validCertificationData,
          certificationName: certName
        });

        expect(cert.certificationName).toBe(certName);
      });
    });

    it('should accept Vietnamese issuing organizations', () => {
      const organizations = [
        'Bộ Y tế Việt Nam',
        'Hội Hồi sức Cấp cứu Việt Nam',
        'Trường Đại học Y Hà Nội',
        'Trường Đại học Y Dược TP.HCM'
      ];

      organizations.forEach(org => {
        const cert = StaffCertification.create({
          ...validCertificationData,
          issuingOrganization: org
        });

        expect(cert.issuingOrganization).toBe(org);
      });
    });
  });

  describe('Certification Lifecycle', () => {
    it('should track certification from issue to expiry', () => {
      const issueDate = new Date('2023-01-01');
      const expiryDate = new Date('2025-01-01');

      const cert = StaffCertification.create({
        ...validCertificationData,
        issueDate,
        expiryDate
      });

      expect(cert.issueDate).toEqual(issueDate);
      expect(cert.expiryDate).toEqual(expiryDate);
      expect(cert.isExpired()).toBe(false);
    });

    it('should maintain validity status', () => {
      const cert = StaffCertification.create(validCertificationData);

      expect(cert.isValid).toBe(true);
      expect(cert.isHIPAACompliant()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle certification name with special characters', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        certificationName: 'Advanced Life Support (ALS) - Level 2'
      });

      expect(cert.certificationName).toBe('Advanced Life Support (ALS) - Level 2');
    });

    it('should handle organization name with Vietnamese characters', () => {
      const cert = StaffCertification.create({
        ...validCertificationData,
        issuingOrganization: 'Trường Đại học Y Dược TP.HCM'
      });

      expect(cert.issuingOrganization).toBe('Trường Đại học Y Dược TP.HCM');
    });

    it('should handle same issue and expiry dates', () => {
      const sameDate = new Date('2023-01-15');

      const cert = StaffCertification.create({
        ...validCertificationData,
        issueDate: sameDate,
        expiryDate: sameDate
      });

      // Already expired on the same day
      expect(cert.isExpired()).toBe(true);
    });
  });
});
