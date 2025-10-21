import { ScheduleType, ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';

describe('ScheduleType Value Object', () => {
  describe('create', () => {
    it('should create ONCE schedule type', () => {
      const scheduleType = ScheduleTypeVO.create('ONCE');
      expect(scheduleType).toBeDefined();
      expect(scheduleType.getValue()).toBe(ScheduleType.ONCE);
    });

    it('should create CRON schedule type', () => {
      const scheduleType = ScheduleTypeVO.create('CRON');
      expect(scheduleType).toBeDefined();
      expect(scheduleType.getValue()).toBe(ScheduleType.CRON);
    });

    it('should create RRULE schedule type', () => {
      const scheduleType = ScheduleTypeVO.create('RRULE');
      expect(scheduleType).toBeDefined();
      expect(scheduleType.getValue()).toBe(ScheduleType.RRULE);
    });

    it('should handle lowercase input', () => {
      const scheduleType = ScheduleTypeVO.create('once');
      expect(scheduleType.getValue()).toBe(ScheduleType.ONCE);
    });

    it('should handle mixed case input', () => {
      const scheduleType = ScheduleTypeVO.create('CrOn');
      expect(scheduleType.getValue()).toBe(ScheduleType.CRON);
    });

    it('should throw error for invalid schedule type', () => {
      expect(() => ScheduleTypeVO.create('INVALID')).toThrow('Invalid schedule type');
    });

    it('should throw error for empty string', () => {
      expect(() => ScheduleTypeVO.create('')).toThrow('Invalid schedule type');
    });

    it('should throw error for numeric input', () => {
      expect(() => ScheduleTypeVO.create('123')).toThrow('Invalid schedule type');
    });
  });

  describe('factory methods', () => {
    it('should create ONCE via factory method', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.getValue()).toBe(ScheduleType.ONCE);
      expect(scheduleType.isOnce()).toBe(true);
    });

    it('should create CRON via factory method', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.getValue()).toBe(ScheduleType.CRON);
      expect(scheduleType.isCron()).toBe(true);
    });

    it('should create RRULE via factory method', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.getValue()).toBe(ScheduleType.RRULE);
      expect(scheduleType.isRRule()).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should return ONCE enum value', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.getValue()).toBe(ScheduleType.ONCE);
    });

    it('should return CRON enum value', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.getValue()).toBe(ScheduleType.CRON);
    });

    it('should return RRULE enum value', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.getValue()).toBe(ScheduleType.RRULE);
    });
  });

  describe('isOnce', () => {
    it('should return true for ONCE schedule type', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.isOnce()).toBe(true);
    });

    it('should return false for CRON schedule type', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.isOnce()).toBe(false);
    });

    it('should return false for RRULE schedule type', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.isOnce()).toBe(false);
    });
  });

  describe('isCron', () => {
    it('should return true for CRON schedule type', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.isCron()).toBe(true);
    });

    it('should return false for ONCE schedule type', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.isCron()).toBe(false);
    });

    it('should return false for RRULE schedule type', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.isCron()).toBe(false);
    });
  });

  describe('isRRule', () => {
    it('should return true for RRULE schedule type', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.isRRule()).toBe(true);
    });

    it('should return false for ONCE schedule type', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.isRRule()).toBe(false);
    });

    it('should return false for CRON schedule type', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.isRRule()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal ONCE types', () => {
      const type1 = ScheduleTypeVO.once();
      const type2 = ScheduleTypeVO.once();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return true for equal CRON types', () => {
      const type1 = ScheduleTypeVO.cron();
      const type2 = ScheduleTypeVO.cron();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return true for equal RRULE types', () => {
      const type1 = ScheduleTypeVO.rrule();
      const type2 = ScheduleTypeVO.rrule();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = ScheduleTypeVO.once();
      const type2 = ScheduleTypeVO.cron();
      expect(type1.equals(type2)).toBe(false);
    });

    it('should handle case-insensitive creation but equal comparison', () => {
      const type1 = ScheduleTypeVO.create('ONCE');
      const type2 = ScheduleTypeVO.create('once');
      expect(type1.equals(type2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return ONCE as string', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.toString()).toBe('ONCE');
    });

    it('should return CRON as string', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.toString()).toBe('CRON');
    });

    it('should return RRULE as string', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.toString()).toBe('RRULE');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in input', () => {
      expect(() => ScheduleTypeVO.create('  ONCE  ')).toThrow('Invalid schedule type');
    });

    it('should create equal types via different methods', () => {
      const type1 = ScheduleTypeVO.once();
      const type2 = ScheduleTypeVO.create('ONCE');
      expect(type1.equals(type2)).toBe(true);
    });

    it('should handle all valid enum values', () => {
      const validTypes = ['ONCE', 'CRON', 'RRULE'];
      
      validTypes.forEach(type => {
        const scheduleType = ScheduleTypeVO.create(type);
        expect(scheduleType.getValue()).toBe(type);
      });
    });
  });

  describe('type checking combinations', () => {
    it('should have mutually exclusive type checks for ONCE', () => {
      const scheduleType = ScheduleTypeVO.once();
      expect(scheduleType.isOnce()).toBe(true);
      expect(scheduleType.isCron()).toBe(false);
      expect(scheduleType.isRRule()).toBe(false);
    });

    it('should have mutually exclusive type checks for CRON', () => {
      const scheduleType = ScheduleTypeVO.cron();
      expect(scheduleType.isOnce()).toBe(false);
      expect(scheduleType.isCron()).toBe(true);
      expect(scheduleType.isRRule()).toBe(false);
    });

    it('should have mutually exclusive type checks for RRULE', () => {
      const scheduleType = ScheduleTypeVO.rrule();
      expect(scheduleType.isOnce()).toBe(false);
      expect(scheduleType.isCron()).toBe(false);
      expect(scheduleType.isRRule()).toBe(true);
    });
  });
});

