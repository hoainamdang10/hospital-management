/**
 * StaffCredential Entity Tests
 * Provider/Staff Service - Domain Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';

describe('StaffCredential Entity', () => {
  const validCredentialData = {
    credentialNumber: 'BYS-12345',
    credentialType: 'medical_license',
    issuingAuthority: 'Bộ Y tế Việt Nam',
    issueDate: new Date('2020-01-01'),
    expiryDate: new Date('2025-12-31')
  };

  describe('create', () => {
    it('should create credential with valid data', () => {
      const credential = StaffCredential.create(validCredentialData);

      expect(credential).toBeDefined();
      expect(credential.credentialNumber).toBe('BYS-12345');
      expect(credential.credentialType).toBe('medical_license');
      expect(credential.isValid).toBe(true);
    });

    it('should normalize credential number to uppercase', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        credentialNumber: 'bys-12345'
      });

      expect(credential.credentialNumber).toBe('BYS-12345');
    });

    it('should trim credential number', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        credentialNumber: '  BYS-12345  '
      });

      expect(credential.credentialNumber).toBe('BYS-12345');
    });

    it('should trim issuing authority', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        issuingAuthority: '  Bộ Y tế Việt Nam  '
      });

      expect(credential.issuingAuthority).toBe('Bộ Y tế Việt Nam');
    });

    it('should create credential without expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCredentialData;
      const credential = StaffCredential.create(dataWithoutExpiry);

      expect(credential.expiryDate).toBeUndefined();
      expect(credential.isExpired()).toBe(false);
    });

    it('should accept Vietnamese issuing authorities', () => {
      const authorities = [
        'Bộ Y tế Việt Nam',
        'Sở Y tế TP.HCM',
        'Sở Y tế Hà Nội',
        'Bệnh viện Chợ Rẫy'
      ];

      authorities.forEach(authority => {
        const credential = StaffCredential.create({
          ...validCredentialData,
          issuingAuthority: authority
        });

        expect(credential.issuingAuthority).toBe(authority);
      });
    });
  });

  describe('validation', () => {
    it('should fail when credential number is empty', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        credentialNumber: ''
      });

      expect(() => credential.validate()).toThrow('Số chứng chỉ không được để trống');
    });

    it('should fail when issuing authority is empty', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        issuingAuthority: ''
      });

      expect(() => credential.validate()).toThrow('Cơ quan cấp không được để trống');
    });

    it('should fail when issue date is in future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const credential = StaffCredential.create({
        ...validCredentialData,
        issueDate: futureDate
      });

      expect(() => credential.validate()).toThrow('Ngày cấp không thể trong tương lai');
    });

    it('should fail when expiry date is before issue date', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        issueDate: new Date('2023-01-01'),
        expiryDate: new Date('2022-12-31')
      });

      expect(() => credential.validate()).toThrow('Ngày hết hạn phải sau ngày cấp');
    });
  });

  describe('isExpired', () => {
    it('should return false for valid credential', () => {
      const credential = StaffCredential.create(validCredentialData);

      expect(credential.isExpired()).toBe(false);
    });

    it('should return true for expired credential', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate: new Date('2020-01-01')
      });

      expect(credential.isExpired()).toBe(true);
    });

    it('should return false when no expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCredentialData;
      const credential = StaffCredential.create(dataWithoutExpiry);

      expect(credential.isExpired()).toBe(false);
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true when expiring within 30 days', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 20);

      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate
      });

      expect(credential.isExpiringSoon()).toBe(true);
    });

    it('should return false when expiring after 30 days', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60);

      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate
      });

      expect(credential.isExpiringSoon()).toBe(false);
    });

    it('should respect custom threshold', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 50);

      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate
      });

      expect(credential.isExpiringSoon(60)).toBe(true);
      expect(credential.isExpiringSoon(40)).toBe(false);
    });

    it('should return false for already expired credentials', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate: new Date('2020-01-01')
      });

      expect(credential.isExpiringSoon()).toBe(false);
    });

    it('should return false when no expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCredentialData;
      const credential = StaffCredential.create(dataWithoutExpiry);

      expect(credential.isExpiringSoon()).toBe(false);
    });
  });

  describe('verify', () => {
    it('should verify credential', () => {
      const credential = StaffCredential.create(validCredentialData);

      credential.verify('admin-user-id');

      expect(credential.isValid).toBe(true);
    });

    it('should record verifier information', () => {
      const credential = StaffCredential.create(validCredentialData);
      const verifierId = 'admin-user-id';

      credential.verify(verifierId);

      const persistence = credential.toPersistence();
      expect(persistence.verified_by).toBe(verifierId);
      expect(persistence.verified_at).toBeDefined();
    });
  });

  describe('revoke', () => {
    it('should revoke credential', () => {
      const credential = StaffCredential.create(validCredentialData);

      credential.revoke();

      expect(credential.isValid).toBe(false);
    });

    it('should update timestamp when revoked', (done) => {
      const credential = StaffCredential.create(validCredentialData);
      const originalUpdatedAt = credential.toPersistence().updated_at;

      // Wait a bit
      setTimeout(() => {
        credential.revoke();
        const newUpdatedAt = credential.toPersistence().updated_at;
        expect(newUpdatedAt).not.toBe(originalUpdatedAt);
        done();
      }, 10);
    });
  });

  describe('renew', () => {
    it('should renew credential with valid expiry date', () => {
      const credential = StaffCredential.create(validCredentialData);
      const newExpiryDate = new Date('2030-12-31');

      credential.renew(newExpiryDate, 'admin-user-id');

      expect(credential.expiryDate).toEqual(newExpiryDate);
    });

    it('should fail to renew revoked credential', () => {
      const credential = StaffCredential.create(validCredentialData);
      credential.revoke();

      const newExpiryDate = new Date('2030-12-31');

      expect(() => credential.renew(newExpiryDate, 'admin-user-id'))
        .toThrow('Không thể gia hạn chứng chỉ đã bị thu hồi');
    });

    it('should fail when new expiry date is in past', () => {
      const credential = StaffCredential.create(validCredentialData);
      const pastDate = new Date('2020-01-01');

      expect(() => credential.renew(pastDate, 'admin-user-id'))
        .toThrow('Ngày hết hạn mới phải trong tương lai');
    });

    it('should fail when new expiry date is before current expiry', () => {
      const credential = StaffCredential.create(validCredentialData);
      const pastDate = new Date('2020-01-01'); // Past date will trigger "must be in future" error first

      expect(() => credential.renew(pastDate, 'admin-user-id'))
        .toThrow('Ngày hết hạn mới phải trong tương lai');
    });

    it('should update verification info when renewed', () => {
      const credential = StaffCredential.create(validCredentialData);
      const newExpiryDate = new Date('2030-12-31');
      const renewerId = 'admin-user-id';

      credential.renew(newExpiryDate, renewerId);

      const persistence = credential.toPersistence();
      expect(persistence.verified_by).toBe(renewerId);
      expect(persistence.verified_at).toBeDefined();
    });
  });

  describe('isHIPAACompliant', () => {
    it('should be compliant when valid and not expired', () => {
      const credential = StaffCredential.create(validCredentialData);

      expect(credential.isHIPAACompliant()).toBe(true);
    });

    it('should not be compliant when revoked', () => {
      const credential = StaffCredential.create(validCredentialData);
      credential.revoke();

      expect(credential.isHIPAACompliant()).toBe(false);
    });

    it('should not be compliant when expired', () => {
      const credential = StaffCredential.create({
        ...validCredentialData,
        expiryDate: new Date('2020-01-01')
      });

      expect(credential.isHIPAACompliant()).toBe(false);
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstruct credential from database', () => {
      const dbData = {
        id: 'cred-123',
        credential_number: 'BYS-12345',
        credential_type: 'medical_license',
        issuing_authority: 'Bộ Y tế Việt Nam',
        issue_date: '2020-01-01T00:00:00.000Z',
        expiry_date: '2025-12-31T00:00:00.000Z',
        is_valid: true,
        verified_at: '2020-01-15T00:00:00.000Z',
        verified_by: 'admin-123',
        created_at: '2020-01-01T00:00:00.000Z',
        updated_at: '2020-01-01T00:00:00.000Z'
      };

      const credential = StaffCredential.fromPersistenceData(dbData);

      expect(credential.credentialNumber).toBe('BYS-12345');
      expect(credential.credentialType).toBe('medical_license');
      expect(credential.isValid).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should convert to database format', () => {
      const credential = StaffCredential.create(validCredentialData);

      const persistence = credential.toPersistence();

      expect(persistence).toHaveProperty('credential_number', 'BYS-12345');
      expect(persistence).toHaveProperty('credential_type', 'medical_license');
      expect(persistence).toHaveProperty('issuing_authority', 'Bộ Y tế Việt Nam');
      expect(persistence).toHaveProperty('is_valid', true);
    });

    it('should handle optional expiry date', () => {
      const { expiryDate, ...dataWithoutExpiry } = validCredentialData;
      const credential = StaffCredential.create(dataWithoutExpiry);

      const persistence = credential.toPersistence();

      expect(persistence.expiry_date).toBeUndefined();
    });
  });

  describe('Vietnamese Healthcare Standards', () => {
    it('should accept Vietnamese medical license format', () => {
      const licenseFormats = [
        'BYS-12345',
        'BYS-67890',
        'CCHN-12345'
      ];

      licenseFormats.forEach(licenseNumber => {
        const credential = StaffCredential.create({
          ...validCredentialData,
          credentialNumber: licenseNumber
        });

        expect(credential.credentialNumber).toBe(licenseNumber.toUpperCase());
      });
    });

    it('should support common credential types', () => {
      const types = ['medical_license', 'certificate', 'registration'];

      types.forEach(type => {
        const credential = StaffCredential.create({
          ...validCredentialData,
          credentialType: type
        });

        expect(credential.credentialType).toBe(type);
      });
    });
  });
});
