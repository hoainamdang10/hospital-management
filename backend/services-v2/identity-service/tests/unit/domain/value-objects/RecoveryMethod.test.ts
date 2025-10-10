import { RecoveryMethod } from '../../../../src/domain/value-objects/RecoveryMethod';

describe('RecoveryMethod Value Object', () => {
  describe('constructor', () => {
    it('should create a valid email recovery method', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      expect(recovery.getType()).toBe('email');
      expect(recovery.getValue()).toBe('user@example.com');
      expect(recovery.isVerified()).toBe(true);
      expect(recovery.isPrimary()).toBe(true);
    });

    it('should create a valid SMS recovery method', () => {
      const recovery = new RecoveryMethod({
        type: 'sms',
        value: '+84901234567',
        verified: false,
        primary: false
      });

      expect(recovery.getType()).toBe('sms');
      expect(recovery.getValue()).toBe('+84901234567');
      expect(recovery.isVerified()).toBe(false);
      expect(recovery.isPrimary()).toBe(false);
    });

    it('should create a valid authenticator app recovery method', () => {
      const recovery = new RecoveryMethod({
        type: 'authenticator',
        value: 'JBSWY3DPEHPK3PXP',
        verified: true,
        primary: false
      });

      expect(recovery.getType()).toBe('authenticator');
      expect(recovery.getValue()).toBe('JBSWY3DPEHPK3PXP');
    });
  });

  describe('validation', () => {
    it('should throw error for invalid email format', () => {
      expect(() => {
        new RecoveryMethod({
          type: 'email',
          value: 'invalid-email',
          verified: false,
          primary: false
        });
      }).toThrow('Invalid email format');
    });

    it('should throw error for invalid phone number format', () => {
      expect(() => {
        new RecoveryMethod({
          type: 'sms',
          value: '123', // Too short
          verified: false,
          primary: false
        });
      }).toThrow('Invalid phone number format');
    });

    it('should throw error for invalid recovery type', () => {
      expect(() => {
        new RecoveryMethod({
          type: 'invalid' as any,
          value: 'test',
          verified: false,
          primary: false
        });
      }).toThrow('Invalid recovery method type');
    });

    it('should throw error for empty value', () => {
      expect(() => {
        new RecoveryMethod({
          type: 'email',
          value: '',
          verified: false,
          primary: false
        });
      }).toThrow('Recovery method value cannot be empty');
    });
  });

  describe('verification', () => {
    it('should verify recovery method', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: false,
        primary: false
      });

      recovery.verify();
      expect(recovery.isVerified()).toBe(true);
    });

    it('should not re-verify already verified method', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: false
      });

      expect(() => recovery.verify()).toThrow('Recovery method already verified');
    });

    it('should unverify recovery method', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: false
      });

      recovery.unverify();
      expect(recovery.isVerified()).toBe(false);
    });
  });

  describe('primary status', () => {
    it('should set as primary', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: false
      });

      recovery.setPrimary(true);
      expect(recovery.isPrimary()).toBe(true);
    });

    it('should only allow verified methods to be primary', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: false,
        primary: false
      });

      expect(() => recovery.setPrimary(true))
        .toThrow('Only verified recovery methods can be set as primary');
    });

    it('should remove primary status', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      recovery.setPrimary(false);
      expect(recovery.isPrimary()).toBe(false);
    });
  });

  describe('update value', () => {
    it('should update email value', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'old@example.com',
        verified: true,
        primary: false
      });

      recovery.updateValue('new@example.com');
      expect(recovery.getValue()).toBe('new@example.com');
      expect(recovery.isVerified()).toBe(false); // Should unverify after update
    });

    it('should update phone number value', () => {
      const recovery = new RecoveryMethod({
        type: 'sms',
        value: '+84901234567',
        verified: true,
        primary: false
      });

      recovery.updateValue('+84907654321');
      expect(recovery.getValue()).toBe('+84907654321');
      expect(recovery.isVerified()).toBe(false);
    });

    it('should validate new value format', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: false
      });

      expect(() => recovery.updateValue('invalid-email'))
        .toThrow('Invalid email format');
    });
  });

  describe('equals', () => {
    it('should return true for same type and value', () => {
      const recovery1 = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      const recovery2 = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: false, // Different verification status
        primary: false  // Different primary status
      });

      expect(recovery1.equals(recovery2)).toBe(true);
    });

    it('should return false for different types', () => {
      const recovery1 = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      const recovery2 = new RecoveryMethod({
        type: 'sms',
        value: 'user@example.com', // Same value, different type
        verified: true,
        primary: true
      });

      expect(recovery1.equals(recovery2)).toBe(false);
    });

    it('should return false for different values', () => {
      const recovery1 = new RecoveryMethod({
        type: 'email',
        value: 'user1@example.com',
        verified: true,
        primary: true
      });

      const recovery2 = new RecoveryMethod({
        type: 'email',
        value: 'user2@example.com',
        verified: true,
        primary: true
      });

      expect(recovery1.equals(recovery2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      const json = recovery.toJSON();
      expect(json).toEqual({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true,
        lastUsed: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('security', () => {
    it('should mask phone number for display', () => {
      const recovery = new RecoveryMethod({
        type: 'sms',
        value: '+84901234567',
        verified: true,
        primary: false
      });

      expect(recovery.getMaskedValue()).toBe('+849****4567');
    });

    it('should mask email for display', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'usertest@example.com',
        verified: true,
        primary: false
      });

      expect(recovery.getMaskedValue()).toBe('use****@example.com');
    });

    it('should not expose authenticator secret', () => {
      const recovery = new RecoveryMethod({
        type: 'authenticator',
        value: 'JBSWY3DPEHPK3PXP',
        verified: true,
        primary: false
      });

      expect(recovery.getMaskedValue()).toBe('****');
    });
  });

  describe('usage tracking', () => {
    it('should track last used timestamp', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      const before = new Date();
      recovery.markAsUsed();
      const after = new Date();

      const lastUsed = recovery.getLastUsed();
      expect(lastUsed).toBeDefined();
      expect(lastUsed!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastUsed!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should check if recently used', () => {
      const recovery = new RecoveryMethod({
        type: 'email',
        value: 'user@example.com',
        verified: true,
        primary: true
      });

      recovery.markAsUsed();
      expect(recovery.isRecentlyUsed(60)).toBe(true); // Within 60 seconds
      expect(recovery.isRecentlyUsed(0)).toBe(false); // 0 seconds ago
    });
  });
});
