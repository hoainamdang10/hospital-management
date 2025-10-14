/**
 * RecoveryMethod Value Object - Unit Tests
 * 
 * Tests for RecoveryMethod value object following DDD patterns
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RecoveryMethod } from '../../../../src/domain/value-objects/RecoveryMethod';

describe('RecoveryMethod Value Object', () => {
  const testUserId = 'user-123';
  const testEmail = 'recovery@example.com';
  const testUpdatedBy = 'admin-456';

  describe('Factory Methods', () => {
    describe('create', () => {
      it('should create recovery method with valid data', () => {
        const recovery = RecoveryMethod.create({
          userId: testUserId,
          recoveryEmail: testEmail,
          recoveryEmailVerified: false,
          recoveryEmailVerifiedAt: null,
          lastUpdatedAt: new Date(),
          updatedBy: testUpdatedBy,
          createdAt: new Date()
        });

        expect(recovery.userId).toBe(testUserId);
        expect(recovery.recoveryEmail?.value).toBe(testEmail);
        expect(recovery.recoveryEmailVerified).toBe(false);
        expect(recovery.hasRecoveryEmail()).toBe(true);
      });

      it('should create recovery method without recovery email', () => {
        const recovery = RecoveryMethod.create({
          userId: testUserId,
          recoveryEmail: null,
          recoveryEmailVerified: false,
          recoveryEmailVerifiedAt: null,
          lastUpdatedAt: new Date(),
          updatedBy: null,
          createdAt: new Date()
        });

        expect(recovery.userId).toBe(testUserId);
        expect(recovery.recoveryEmail).toBeNull();
        expect(recovery.hasRecoveryEmail()).toBe(false);
      });

      it('should throw error for empty userId', () => {
        expect(() => {
          RecoveryMethod.create({
            userId: '',
            recoveryEmail: testEmail,
            recoveryEmailVerified: false,
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date(),
            updatedBy: testUpdatedBy,
            createdAt: new Date()
          });
        }).toThrow('User ID is required');
      });

      it('should throw error for verified email without timestamp', () => {
        expect(() => {
          RecoveryMethod.create({
            userId: testUserId,
            recoveryEmail: testEmail,
            recoveryEmailVerified: true,
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date(),
            updatedBy: testUpdatedBy,
            createdAt: new Date()
          });
        }).toThrow('Verified recovery email must have verification timestamp');
      });
    });

    describe('createDefault', () => {
      it('should create default recovery method', () => {
        const recovery = RecoveryMethod.createDefault(testUserId);

        expect(recovery.userId).toBe(testUserId);
        expect(recovery.recoveryEmail).toBeNull();
        expect(recovery.recoveryEmailVerified).toBe(false);
        expect(recovery.hasRecoveryEmail()).toBe(false);
      });
    });
  });

  describe('Update Methods', () => {
    describe('updateRecoveryEmail', () => {
      it('should update recovery email', () => {
        const recovery = RecoveryMethod.createDefault(testUserId);
        const newEmail = 'new-recovery@example.com';

        const updated = recovery.updateRecoveryEmail(newEmail, testUpdatedBy);

        expect(updated.recoveryEmail?.value).toBe(newEmail);
        expect(updated.recoveryEmailVerified).toBe(false);
        expect(updated.updatedBy).toBe(testUpdatedBy);
      });

      it('should reset verification status when updating email', () => {
        const recovery = RecoveryMethod.create({
          userId: testUserId,
          recoveryEmail: testEmail,
          recoveryEmailVerified: true,
          recoveryEmailVerifiedAt: new Date(),
          lastUpdatedAt: new Date(),
          updatedBy: testUpdatedBy,
          createdAt: new Date()
        });

        const updated = recovery.updateRecoveryEmail('new@example.com', testUpdatedBy);

        expect(updated.recoveryEmailVerified).toBe(false);
        expect(updated.recoveryEmailVerifiedAt).toBeNull();
      });
    });

    describe('markAsVerified', () => {
      it('should mark recovery email as verified', () => {
        const recovery = RecoveryMethod.create({
          userId: testUserId,
          recoveryEmail: testEmail,
          recoveryEmailVerified: false,
          recoveryEmailVerifiedAt: null,
          lastUpdatedAt: new Date(),
          updatedBy: testUpdatedBy,
          createdAt: new Date()
        });

        const verified = recovery.markAsVerified();

        expect(verified.recoveryEmailVerified).toBe(true);
        expect(verified.recoveryEmailVerifiedAt).toBeInstanceOf(Date);
      });
    });

    describe('removeRecoveryEmail', () => {
      it('should remove recovery email', () => {
        const recovery = RecoveryMethod.create({
          userId: testUserId,
          recoveryEmail: testEmail,
          recoveryEmailVerified: true,
          recoveryEmailVerifiedAt: new Date(),
          lastUpdatedAt: new Date(),
          updatedBy: testUpdatedBy,
          createdAt: new Date()
        });

        const removed = recovery.removeRecoveryEmail(testUpdatedBy);

        expect(removed.recoveryEmail).toBeNull();
        expect(removed.recoveryEmailVerified).toBe(false);
        expect(removed.hasRecoveryEmail()).toBe(false);
      });
    });
  });

  describe('Query Methods', () => {
    it('should check if recovery email is configured', () => {
      const withEmail = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: false,
        recoveryEmailVerifiedAt: null,
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const withoutEmail = RecoveryMethod.createDefault(testUserId);

      expect(withEmail.hasRecoveryEmail()).toBe(true);
      expect(withoutEmail.hasRecoveryEmail()).toBe(false);
    });

    it('should check if recovery email is verified', () => {
      const verified = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const unverified = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: false,
        recoveryEmailVerifiedAt: null,
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      expect(verified.isRecoveryEmailVerified()).toBe(true);
      expect(unverified.isRecoveryEmailVerified()).toBe(false);
    });

    it('should check if can be used for recovery', () => {
      const verified = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const unverified = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: false,
        recoveryEmailVerifiedAt: null,
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const noEmail = RecoveryMethod.createDefault(testUserId);

      expect(verified.canUseForRecovery()).toBe(true);
      expect(unverified.canUseForRecovery()).toBe(false);
      expect(noEmail.canUseForRecovery()).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should return true for equal recovery methods', () => {
      const recovery1 = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const recovery2 = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: recovery1.recoveryEmailVerifiedAt,
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      expect(recovery1.equals(recovery2)).toBe(true);
    });

    it('should return false for different recovery emails', () => {
      const recovery1 = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: testEmail,
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      const recovery2 = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: 'different@example.com',
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        lastUpdatedAt: new Date(),
        updatedBy: testUpdatedBy,
        createdAt: new Date()
      });

      expect(recovery1.equals(recovery2)).toBe(false);
    });
  });
});
