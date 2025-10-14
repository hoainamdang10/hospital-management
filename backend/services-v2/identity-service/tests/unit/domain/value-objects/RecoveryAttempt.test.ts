/**
 * RecoveryAttempt Value Object - Unit Tests
 * 
 * Tests for RecoveryAttempt value object following DDD patterns
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RecoveryAttempt, RecoveryMethodType, AttemptType } from '../../../../src/domain/value-objects/RecoveryAttempt';

describe('RecoveryAttempt Value Object', () => {
  const testUserId = 'user-123';
  const testIpAddress = '192.168.1.1';
  const testUserAgent = 'Mozilla/5.0';

  describe('Factory Methods', () => {
    describe('create', () => {
      it('should create successful recovery attempt', () => {
        const attempt = RecoveryAttempt.create({
          userId: testUserId,
          recoveryMethod: 'primary_email',
          attemptType: 'request_reset',
          success: true,
          failureReason: null,
          ipAddress: testIpAddress,
          userAgent: testUserAgent,
          attemptedAt: new Date()
        });

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.recoveryMethod).toBe('primary_email');
        expect(attempt.attemptType).toBe('request_reset');
        expect(attempt.success).toBe(true);
        expect(attempt.isSuccessful()).toBe(true);
      });

      it('should create failed recovery attempt', () => {
        const attempt = RecoveryAttempt.create({
          userId: testUserId,
          recoveryMethod: 'recovery_email',
          attemptType: 'verify_token',
          success: false,
          failureReason: 'Invalid token',
          ipAddress: testIpAddress,
          userAgent: testUserAgent,
          attemptedAt: new Date()
        });

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.success).toBe(false);
        expect(attempt.failureReason).toBe('Invalid token');
        expect(attempt.isSuccessful()).toBe(false);
      });

      it('should throw error for empty userId', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: '',
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: true,
            failureReason: null,
            attemptedAt: new Date()
          });
        }).toThrow('User ID is required');
      });

      it('should throw error for invalid recovery method', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'invalid_method' as RecoveryMethodType,
            attemptType: 'request_reset',
            success: true,
            failureReason: null,
            attemptedAt: new Date()
          });
        }).toThrow('Invalid recovery method');
      });

      it('should throw error for invalid attempt type', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'invalid_type' as AttemptType,
            success: true,
            failureReason: null,
            attemptedAt: new Date()
          });
        }).toThrow('Invalid attempt type');
      });

      it('should throw error for failed attempt without failure reason', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: false,
            failureReason: null,
            attemptedAt: new Date()
          });
        }).toThrow('Failed attempts must have a failure reason');
      });

      it('should throw error for successful attempt with failure reason', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: true,
            failureReason: 'Some reason',
            attemptedAt: new Date()
          });
        }).toThrow('Successful attempts cannot have a failure reason');
      });

      it('should throw error for future timestamp', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: true,
            failureReason: null,
            attemptedAt: futureDate
          });
        }).toThrow('Attempted timestamp cannot be in the future');
      });

      it('should throw error for whitespace-only IP address', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: true,
            failureReason: null,
            ipAddress: '   ',
            attemptedAt: new Date()
          });
        }).toThrow('IP address cannot be empty string');
      });

      it('should throw error for whitespace-only user agent', () => {
        expect(() => {
          RecoveryAttempt.create({
            userId: testUserId,
            recoveryMethod: 'primary_email',
            attemptType: 'request_reset',
            success: true,
            failureReason: null,
            userAgent: '   ',
            attemptedAt: new Date()
          });
        }).toThrow('User agent cannot be empty string');
      });
    });

    describe('createSuccess', () => {
      it('should create successful attempt with all parameters', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'primary_email',
          'request_reset',
          testIpAddress,
          testUserAgent
        );

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.success).toBe(true);
        expect(attempt.failureReason).toBeNull();
        expect(attempt.ipAddress).toBe(testIpAddress);
        expect(attempt.userAgent).toBe(testUserAgent);
      });

      it('should create successful attempt without optional parameters', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'recovery_email',
          'verify_token'
        );

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.success).toBe(true);
        expect(attempt.ipAddress).toBeNull();
        expect(attempt.userAgent).toBeNull();
      });
    });

    describe('createFailure', () => {
      it('should create failed attempt with all parameters', () => {
        const failureReason = 'Invalid token';
        const attempt = RecoveryAttempt.createFailure(
          testUserId,
          'primary_email',
          'verify_token',
          failureReason,
          testIpAddress,
          testUserAgent
        );

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.success).toBe(false);
        expect(attempt.failureReason).toBe(failureReason);
        expect(attempt.ipAddress).toBe(testIpAddress);
        expect(attempt.userAgent).toBe(testUserAgent);
      });

      it('should create failed attempt without optional parameters', () => {
        const failureReason = 'Token expired';
        const attempt = RecoveryAttempt.createFailure(
          testUserId,
          'recovery_email',
          'reset_password',
          failureReason
        );

        expect(attempt.userId).toBe(testUserId);
        expect(attempt.success).toBe(false);
        expect(attempt.failureReason).toBe(failureReason);
        expect(attempt.ipAddress).toBeNull();
        expect(attempt.userAgent).toBeNull();
      });
    });
  });

  describe('Query Methods', () => {
    describe('Attempt Type Checks', () => {
      it('should identify reset request', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'primary_email',
          'request_reset'
        );

        expect(attempt.isResetRequest()).toBe(true);
        expect(attempt.isTokenVerification()).toBe(false);
        expect(attempt.isPasswordReset()).toBe(false);
      });

      it('should identify token verification', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'primary_email',
          'verify_token'
        );

        expect(attempt.isResetRequest()).toBe(false);
        expect(attempt.isTokenVerification()).toBe(true);
        expect(attempt.isPasswordReset()).toBe(false);
      });

      it('should identify password reset', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'primary_email',
          'reset_password'
        );

        expect(attempt.isResetRequest()).toBe(false);
        expect(attempt.isTokenVerification()).toBe(false);
        expect(attempt.isPasswordReset()).toBe(true);
      });
    });

    describe('Recovery Method Checks', () => {
      it('should identify primary email usage', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'primary_email',
          'request_reset'
        );

        expect(attempt.usedPrimaryEmail()).toBe(true);
        expect(attempt.usedRecoveryEmail()).toBe(false);
      });

      it('should identify recovery email usage', () => {
        const attempt = RecoveryAttempt.createSuccess(
          testUserId,
          'recovery_email',
          'request_reset'
        );

        expect(attempt.usedPrimaryEmail()).toBe(false);
        expect(attempt.usedRecoveryEmail()).toBe(true);
      });
    });
  });

  describe('Serialization', () => {
    it('should convert to plain object', () => {
      const attemptedAt = new Date();
      const attempt = RecoveryAttempt.create({
        id: 'attempt-123',
        userId: testUserId,
        recoveryMethod: 'primary_email',
        attemptType: 'request_reset',
        success: true,
        failureReason: null,
        ipAddress: testIpAddress,
        userAgent: testUserAgent,
        attemptedAt
      });

      const obj = attempt.toObject();

      expect(obj.id).toBe('attempt-123');
      expect(obj.userId).toBe(testUserId);
      expect(obj.recoveryMethod).toBe('primary_email');
      expect(obj.attemptType).toBe('request_reset');
      expect(obj.success).toBe(true);
      expect(obj.failureReason).toBeNull();
      expect(obj.ipAddress).toBe(testIpAddress);
      expect(obj.userAgent).toBe(testUserAgent);
      expect(obj.attemptedAt).toBe(attemptedAt.toISOString());
    });
  });

  describe('Description Methods', () => {
    it('should generate description for successful request', () => {
      const attempt = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'request_reset'
      );

      const description = attempt.getDescription();
      expect(description).toContain('yêu cầu đặt lại mật khẩu');
      expect(description).toContain('email chính');
      expect(description).toContain('thành công');
    });

    it('should generate description for failed verification', () => {
      const attempt = RecoveryAttempt.createFailure(
        testUserId,
        'recovery_email',
        'verify_token',
        'Token không hợp lệ'
      );

      const description = attempt.getDescription();
      expect(description).toContain('xác thực token');
      expect(description).toContain('email khôi phục');
      expect(description).toContain('thất bại');
      expect(description).toContain('Token không hợp lệ');
    });

    it('should get attempt type in Vietnamese', () => {
      const requestReset = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'request_reset'
      );
      const verifyToken = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'verify_token'
      );
      const resetPassword = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'reset_password'
      );

      expect(requestReset.getAttemptTypeVietnamese()).toBe('Yêu cầu đặt lại mật khẩu');
      expect(verifyToken.getAttemptTypeVietnamese()).toBe('Xác thực token');
      expect(resetPassword.getAttemptTypeVietnamese()).toBe('Đặt lại mật khẩu');
    });

    it('should get recovery method in Vietnamese', () => {
      const primaryEmail = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'request_reset'
      );
      const recoveryEmail = RecoveryAttempt.createSuccess(
        testUserId,
        'recovery_email',
        'request_reset'
      );

      expect(primaryEmail.getRecoveryMethodVietnamese()).toBe('Email chính');
      expect(recoveryEmail.getRecoveryMethodVietnamese()).toBe('Email khôi phục');
    });
  });
});
