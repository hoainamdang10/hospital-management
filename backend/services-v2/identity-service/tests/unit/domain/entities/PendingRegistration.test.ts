/**
 * Unit Tests for PendingRegistration Entity
 * Tests domain logic for pending user registrations
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { PendingRegistration } from '../../../../src/domain/entities/PendingRegistration';
import { Email } from '../../../../src/domain/value-objects/Email';

describe('PendingRegistration Entity', () => {
  const validEmail = Email.create('test@example.com');
  const validPasswordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
  const validUserData = {
    fullName: 'Test User',
    phoneNumber: '0901234567',
    roleType: 'patient'
  };
  const validToken = 'valid-jwt-token-here';

  describe('create', () => {
    it('should create pending registration with valid data', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      expect(pending).toBeDefined();
      expect(pending.id).toBeDefined();
      expect(pending.email).toBe(validEmail);
      expect(pending.passwordHash).toBe(validPasswordHash);
      expect(pending.userData).toEqual(validUserData);
      expect(pending.verificationToken).toBe(validToken);
      expect(pending.isUsed).toBe(false);
    });

    it('should set expiry time correctly (24 hours)', () => {
      const now = new Date();
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const actualExpiry = pending.expiresAt;

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should set custom expiry hours', () => {
      const now = new Date();
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        48 // 48 hours
      );

      const expectedExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const actualExpiry = pending.expiresAt;

      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should throw error if email is invalid', () => {
      expect(() => {
        PendingRegistration.create(
          null as any,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );
      }).toThrow();
    });

    it('should throw error if password hash is empty', () => {
      expect(() => {
        PendingRegistration.create(
          validEmail,
          '',
          validUserData,
          validToken,
          24
        );
      }).toThrow();
    });

    it('should throw error if verification token is empty', () => {
      expect(() => {
        PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          '',
          24
        );
      }).toThrow();
    });

    it('should throw error if expiry hours is invalid', () => {
      expect(() => {
        PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          0
        );
      }).toThrow();

      expect(() => {
        PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          -1
        );
      }).toThrow();
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired registration', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      expect(pending.isExpired()).toBe(false);
    });

    it('should return true for expired registration', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      // Manually set expiry to past
      (pending as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(pending.isExpired()).toBe(true);
    });
  });

  describe('markAsUsed', () => {
    it('should mark registration as used', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      expect(pending.isUsed).toBe(false);

      pending.markAsUsed();

      expect(pending.isUsed).toBe(true);
    });
  });

  describe('canBeVerified', () => {
    it('should return true for valid pending registration', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      expect(pending.canBeVerified()).toBe(true);
    });

    it('should return false if already used', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      pending.markAsUsed();

      expect(pending.canBeVerified()).toBe(false);
    });

    it('should return false if expired', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      // Manually set expiry to past
      (pending as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(pending.canBeVerified()).toBe(false);
    });

    it('should return false if both used and expired', () => {
      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        validUserData,
        validToken,
        24
      );

      pending.markAsUsed();
      (pending as any).props.expiresAt = new Date(Date.now() - 1000);

      expect(pending.canBeVerified()).toBe(false);
    });
  });

  describe('userData', () => {
    it('should store all user data fields', () => {
      const fullUserData = {
        fullName: 'Test User',
        phoneNumber: '0901234567',
        citizenId: '001234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        address: '123 Test St',
        roleType: 'patient'
      };

      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        fullUserData,
        validToken,
        24
      );

      expect(pending.userData).toEqual(fullUserData);
      expect(pending.userData.fullName).toBe('Test User');
      expect(pending.userData.phoneNumber).toBe('0901234567');
      expect(pending.userData.citizenId).toBe('001234567890');
      expect(pending.userData.dateOfBirth).toEqual(new Date('1990-01-01'));
      expect(pending.userData.gender).toBe('male');
      expect(pending.userData.address).toBe('123 Test St');
      expect(pending.userData.roleType).toBe('patient');
    });

    it('should handle optional fields', () => {
      const minimalUserData = {
        fullName: 'Test User',
        phoneNumber: '0901234567',
        roleType: 'patient'
      };

      const pending = PendingRegistration.create(
        validEmail,
        validPasswordHash,
        minimalUserData,
        validToken,
        24
      );

      expect(pending.userData.fullName).toBe('Test User');
      expect(pending.userData.phoneNumber).toBe('0901234567');
      expect(pending.userData.roleType).toBe('patient');
      expect(pending.userData.citizenId).toBeUndefined();
      expect(pending.userData.dateOfBirth).toBeUndefined();
      expect(pending.userData.gender).toBeUndefined();
      expect(pending.userData.address).toBeUndefined();
    });
  });

  describe('status management', () => {
    describe('initial status', () => {
      it('should have PENDING status when created', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        expect(pending.status).toBe('PENDING');
      });
    });

    describe('markEmailSent', () => {
      it('should mark status as EMAIL_SENT', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markEmailSent();

        expect(pending.status).toBe('EMAIL_SENT');
      });

      it('should throw error if already verified', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markAsVerified();

        expect(() => pending.markEmailSent()).toThrow(
          'Cannot mark verified registration as email sent'
        );
      });
    });

    describe('markAsFailed', () => {
      it('should mark status as FAILED', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markAsFailed();

        expect(pending.status).toBe('FAILED');
      });

      it('should throw error if already verified', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markAsVerified();

        expect(() => pending.markAsFailed()).toThrow(
          'Cannot mark verified registration as failed'
        );
      });

      it('should allow marking as failed from EMAIL_SENT status', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markEmailSent();
        pending.markAsFailed();

        expect(pending.status).toBe('FAILED');
      });
    });

    describe('markAsVerified', () => {
      it('should mark status as VERIFIED and set isUsed to true', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markAsVerified();

        expect(pending.status).toBe('VERIFIED');
        expect(pending.isUsed).toBe(true);
      });

      it('should throw error if expired', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        // Manually set expiry to past
        (pending as any).props.expiresAt = new Date(Date.now() - 1000);

        expect(() => pending.markAsVerified()).toThrow(
          'Cannot mark expired pending registration as verified'
        );
      });

      it('should allow marking as verified from EMAIL_SENT status', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markEmailSent();
        pending.markAsVerified();

        expect(pending.status).toBe('VERIFIED');
        expect(pending.isUsed).toBe(true);
      });
    });

    describe('markAsExpired', () => {
      it('should mark status as EXPIRED', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markAsExpired();

        expect(pending.status).toBe('EXPIRED');
      });

      it('should allow marking as expired from any status', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        pending.markEmailSent();
        pending.markAsExpired();

        expect(pending.status).toBe('EXPIRED');
      });
    });

    describe('status transitions', () => {
      it('should follow correct status flow: PENDING -> EMAIL_SENT -> VERIFIED', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        expect(pending.status).toBe('PENDING');

        pending.markEmailSent();
        expect(pending.status).toBe('EMAIL_SENT');

        pending.markAsVerified();
        expect(pending.status).toBe('VERIFIED');
        expect(pending.isUsed).toBe(true);
      });

      it('should follow error flow: PENDING -> EMAIL_SENT -> FAILED', () => {
        const pending = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );

        expect(pending.status).toBe('PENDING');

        pending.markEmailSent();
        expect(pending.status).toBe('EMAIL_SENT');

        pending.markAsFailed();
        expect(pending.status).toBe('FAILED');
      });

      it('should allow marking as expired from any status', () => {
        const pending1 = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );
        pending1.markAsExpired();
        expect(pending1.status).toBe('EXPIRED');

        const pending2 = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );
        pending2.markEmailSent();
        pending2.markAsExpired();
        expect(pending2.status).toBe('EXPIRED');

        const pending3 = PendingRegistration.create(
          validEmail,
          validPasswordHash,
          validUserData,
          validToken,
          24
        );
        pending3.markAsFailed();
        pending3.markAsExpired();
        expect(pending3.status).toBe('EXPIRED');
      });
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstitute with status', () => {
      const data = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: validPasswordHash,
        userData: validUserData,
        verificationToken: validToken,
        expiresAt: new Date(),
        createdAt: new Date(),
        isUsed: false,
        status: 'EMAIL_SENT' as const
      };

      const pending = PendingRegistration.fromPersistenceData(data);

      expect(pending.status).toBe('EMAIL_SENT');
      expect(pending.id).toBe('test-id');
    });

    it('should default to PENDING if status not provided', () => {
      const data = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: validPasswordHash,
        userData: validUserData,
        verificationToken: validToken,
        expiresAt: new Date(),
        createdAt: new Date(),
        isUsed: false
      };

      const pending = PendingRegistration.fromPersistenceData(data);

      expect(pending.status).toBe('PENDING');
    });
  });
});

