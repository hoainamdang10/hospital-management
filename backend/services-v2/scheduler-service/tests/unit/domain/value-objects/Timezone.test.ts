import { Timezone } from '../../../../src/domain/value-objects/Timezone';

describe('Timezone Value Object', () => {
  describe('create', () => {
    it('should create valid timezone', () => {
      const timezone = Timezone.create('UTC');
      expect(timezone).toBeDefined();
      expect(timezone.getValue()).toBe('UTC');
    });

    it('should create Asia/Ho_Chi_Minh timezone', () => {
      const timezone = Timezone.create('Asia/Ho_Chi_Minh');
      expect(timezone.getValue()).toBe('Asia/Ho_Chi_Minh');
    });

    it('should create Asia/Bangkok timezone', () => {
      const timezone = Timezone.create('Asia/Bangkok');
      expect(timezone.getValue()).toBe('Asia/Bangkok');
    });

    it('should create Asia/Singapore timezone', () => {
      const timezone = Timezone.create('Asia/Singapore');
      expect(timezone.getValue()).toBe('Asia/Singapore');
    });

    it('should create Asia/Tokyo timezone', () => {
      const timezone = Timezone.create('Asia/Tokyo');
      expect(timezone.getValue()).toBe('Asia/Tokyo');
    });

    it('should create America/New_York timezone', () => {
      const timezone = Timezone.create('America/New_York');
      expect(timezone.getValue()).toBe('America/New_York');
    });

    it('should create America/Los_Angeles timezone', () => {
      const timezone = Timezone.create('America/Los_Angeles');
      expect(timezone.getValue()).toBe('America/Los_Angeles');
    });

    it('should create Europe/London timezone', () => {
      const timezone = Timezone.create('Europe/London');
      expect(timezone.getValue()).toBe('Europe/London');
    });

    it('should create Europe/Paris timezone', () => {
      const timezone = Timezone.create('Europe/Paris');
      expect(timezone.getValue()).toBe('Europe/Paris');
    });

    it('should default to UTC for empty string', () => {
      const timezone = Timezone.create('');
      expect(timezone.getValue()).toBe('UTC');
    });

    it('should default to UTC for whitespace-only string', () => {
      const timezone = Timezone.create('   ');
      expect(timezone.getValue()).toBe('UTC');
    });

    it('should trim whitespace', () => {
      const timezone = Timezone.create('  UTC  ');
      expect(timezone.getValue()).toBe('UTC');
    });

    it('should throw error for invalid timezone', () => {
      expect(() => Timezone.create('Invalid/Timezone')).toThrow('Invalid timezone');
    });

    it('should throw error for unsupported timezone', () => {
      expect(() => Timezone.create('Asia/Shanghai')).toThrow('Invalid timezone');
    });
  });

  describe('utc', () => {
    it('should create UTC timezone', () => {
      const timezone = Timezone.utc();
      expect(timezone.getValue()).toBe('UTC');
    });
  });

  describe('hoChiMinh', () => {
    it('should create Asia/Ho_Chi_Minh timezone', () => {
      const timezone = Timezone.hoChiMinh();
      expect(timezone.getValue()).toBe('Asia/Ho_Chi_Minh');
    });
  });

  describe('getValue', () => {
    it('should return the timezone value', () => {
      const timezone = Timezone.create('UTC');
      expect(timezone.getValue()).toBe('UTC');
    });
  });

  describe('isUTC', () => {
    it('should return true for UTC timezone', () => {
      const timezone = Timezone.create('UTC');
      expect(timezone.isUTC()).toBe(true);
    });

    it('should return false for non-UTC timezone', () => {
      const timezone = Timezone.create('Asia/Ho_Chi_Minh');
      expect(timezone.isUTC()).toBe(false);
    });

    it('should return true for UTC created via utc()', () => {
      const timezone = Timezone.utc();
      expect(timezone.isUTC()).toBe(true);
    });

    it('should return false for Ho Chi Minh created via hoChiMinh()', () => {
      const timezone = Timezone.hoChiMinh();
      expect(timezone.isUTC()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal timezones', () => {
      const timezone1 = Timezone.create('UTC');
      const timezone2 = Timezone.create('UTC');
      expect(timezone1.equals(timezone2)).toBe(true);
    });

    it('should return false for different timezones', () => {
      const timezone1 = Timezone.create('UTC');
      const timezone2 = Timezone.create('Asia/Ho_Chi_Minh');
      expect(timezone1.equals(timezone2)).toBe(false);
    });

    it('should handle whitespace differences', () => {
      const timezone1 = Timezone.create('UTC');
      const timezone2 = Timezone.create('  UTC  ');
      expect(timezone1.equals(timezone2)).toBe(true);
    });

    it('should be case-sensitive', () => {
      const timezone1 = Timezone.create('UTC');
      // This will throw because 'utc' is not in the valid list
      expect(() => Timezone.create('utc')).toThrow('Invalid timezone');
    });
  });

  describe('toString', () => {
    it('should return the timezone value as string', () => {
      const timezone = Timezone.create('UTC');
      expect(timezone.toString()).toBe('UTC');
    });

    it('should return Asia/Ho_Chi_Minh as string', () => {
      const timezone = Timezone.create('Asia/Ho_Chi_Minh');
      expect(timezone.toString()).toBe('Asia/Ho_Chi_Minh');
    });
  });

  describe('edge cases', () => {
    it('should handle all valid timezones', () => {
      const validTimezones = [
        'UTC',
        'Asia/Ho_Chi_Minh',
        'Asia/Bangkok',
        'Asia/Singapore',
        'Asia/Tokyo',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris'
      ];

      validTimezones.forEach(tz => {
        const timezone = Timezone.create(tz);
        expect(timezone.getValue()).toBe(tz);
      });
    });

    it('should reject timezone with wrong case', () => {
      expect(() => Timezone.create('asia/ho_chi_minh')).toThrow('Invalid timezone');
    });

    it('should reject timezone with typo', () => {
      expect(() => Timezone.create('Asia/HoChiMinh')).toThrow('Invalid timezone');
    });

    it('should reject partial timezone', () => {
      expect(() => Timezone.create('Asia')).toThrow('Invalid timezone');
    });
  });

  describe('factory methods', () => {
    it('should create UTC via factory method', () => {
      const timezone = Timezone.utc();
      expect(timezone.getValue()).toBe('UTC');
      expect(timezone.isUTC()).toBe(true);
    });

    it('should create Ho Chi Minh via factory method', () => {
      const timezone = Timezone.hoChiMinh();
      expect(timezone.getValue()).toBe('Asia/Ho_Chi_Minh');
      expect(timezone.isUTC()).toBe(false);
    });

    it('should create equal timezones via different methods', () => {
      const timezone1 = Timezone.utc();
      const timezone2 = Timezone.create('UTC');
      expect(timezone1.equals(timezone2)).toBe(true);
    });
  });
});

