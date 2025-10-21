import { CronExpression } from '../../../../src/domain/value-objects/CronExpression';

describe('CronExpression Value Object', () => {
  describe('create', () => {
    it('should create valid cron expression', () => {
      const cron = CronExpression.create('0 9 * * *'); // Every day at 9 AM
      expect(cron).toBeDefined();
      expect(cron.getValue()).toBe('0 9 * * *');
    });

    it('should create valid cron expression with seconds', () => {
      const cron = CronExpression.create('0 0 9 * * *'); // Every day at 9 AM with seconds
      expect(cron).toBeDefined();
    });

    it('should trim whitespace', () => {
      const cron = CronExpression.create('  0 9 * * *  ');
      expect(cron.getValue()).toBe('0 9 * * *');
    });

    it('should throw error for empty expression', () => {
      expect(() => CronExpression.create('')).toThrow('CRON expression cannot be empty');
    });

    it('should throw error for whitespace-only expression', () => {
      expect(() => CronExpression.create('   ')).toThrow('CRON expression cannot be empty');
    });

    it('should throw error for invalid cron expression', () => {
      expect(() => CronExpression.create('invalid cron')).toThrow('Invalid CRON expression');
    });

    it('should throw error for invalid field count', () => {
      expect(() => CronExpression.create('0 9')).toThrow('Invalid CRON expression');
    });

    it('should throw error for invalid field values', () => {
      expect(() => CronExpression.create('0 99 * * *')).toThrow('Invalid CRON expression');
    });
  });

  describe('getNextOccurrence', () => {
    it('should get next occurrence from current time', () => {
      const cron = CronExpression.create('0 9 * * *'); // Every day at 9 AM
      const from = new Date('2025-01-15T08:00:00Z');
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCHours()).toBe(9);
      expect(next.getUTCMinutes()).toBe(0);
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });

    it('should get next occurrence for hourly cron', () => {
      const cron = CronExpression.create('0 * * * *'); // Every hour
      const from = new Date('2025-01-15T08:30:00Z');
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCHours()).toBe(9);
      expect(next.getUTCMinutes()).toBe(0);
    });

    it('should get next occurrence for weekly cron', () => {
      const cron = CronExpression.create('0 9 * * 1'); // Every Monday at 9 AM
      const from = new Date('2025-01-15T08:00:00Z'); // Wednesday
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCDay()).toBe(1); // Monday
      expect(next.getUTCHours()).toBe(9);
    });

    it('should get next occurrence for monthly cron', () => {
      const cron = CronExpression.create('0 9 1 * *'); // First day of month at 9 AM
      const from = new Date('2025-01-15T08:00:00Z');
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCDate()).toBe(1);
      expect(next.getUTCHours()).toBe(9);
    });

    it('should use default current time if not provided', () => {
      const cron = CronExpression.create('0 9 * * *');
      const next = cron.getNextOccurrence();

      expect(next).toBeDefined();
      expect(next.getTime()).toBeGreaterThan(new Date().getTime());
    });
  });

  describe('getNextOccurrences', () => {
    it('should get multiple next occurrences', () => {
      const cron = CronExpression.create('0 * * * *'); // Every hour
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(5, from);

      expect(occurrences).toHaveLength(5);
      expect(occurrences[0].getUTCHours()).toBe(9);
      expect(occurrences[1].getUTCHours()).toBe(10);
      expect(occurrences[2].getUTCHours()).toBe(11);
      expect(occurrences[3].getUTCHours()).toBe(12);
      expect(occurrences[4].getUTCHours()).toBe(13);
    });

    it('should get occurrences in ascending order', () => {
      const cron = CronExpression.create('0 9 * * *'); // Every day at 9 AM
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(3, from);

      expect(occurrences).toHaveLength(3);
      for (let i = 1; i < occurrences.length; i++) {
        expect(occurrences[i].getTime()).toBeGreaterThan(occurrences[i - 1].getTime());
      }
    });

    it('should handle count of 1', () => {
      const cron = CronExpression.create('0 9 * * *');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(1, from);

      expect(occurrences).toHaveLength(1);
    });

    it('should handle count of 0', () => {
      const cron = CronExpression.create('0 9 * * *');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(0, from);

      expect(occurrences).toHaveLength(0);
    });
  });

  describe('getOccurrencesBetween', () => {
    it('should get occurrences within date range', () => {
      const cron = CronExpression.create('0 * * * *'); // Every hour
      const startDate = new Date('2025-01-15T08:00:00Z');
      const endDate = new Date('2025-01-15T12:00:00Z');
      const occurrences = cron.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect(occ.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(occ.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should return empty array if no occurrences in range', () => {
      const cron = CronExpression.create('0 9 1 1 *'); // January 1st at 9 AM
      const startDate = new Date('2025-02-01T00:00:00Z');
      const endDate = new Date('2025-02-28T23:59:59Z');
      const occurrences = cron.getOccurrencesBetween(startDate, endDate);

      expect(occurrences).toHaveLength(0);
    });

    it('should handle daily cron within range', () => {
      const cron = CronExpression.create('0 9 * * *'); // Every day at 9 AM
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-20T23:59:59Z');
      const occurrences = cron.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBe(6); // 6 days (15-20 inclusive)
      occurrences.forEach(occ => {
        expect(occ.getUTCHours()).toBe(9);
        expect(occ.getUTCMinutes()).toBe(0);
      });
    });

    it('should handle hourly cron within range', () => {
      const cron = CronExpression.create('0 * * * *'); // Every hour
      const startDate = new Date('2025-01-15T08:00:00Z');
      const endDate = new Date('2025-01-15T12:00:00Z');
      const occurrences = cron.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBeGreaterThan(0);
      expect(occurrences.length).toBeLessThanOrEqual(5); // Max 5 hours
    });
  });

  describe('getValue', () => {
    it('should return the cron expression string', () => {
      const expression = '0 9 * * *';
      const cron = CronExpression.create(expression);
      expect(cron.getValue()).toBe(expression);
    });
  });

  describe('equals', () => {
    it('should return true for equal expressions', () => {
      const cron1 = CronExpression.create('0 9 * * *');
      const cron2 = CronExpression.create('0 9 * * *');
      expect(cron1.equals(cron2)).toBe(true);
    });

    it('should return false for different expressions', () => {
      const cron1 = CronExpression.create('0 9 * * *');
      const cron2 = CronExpression.create('0 10 * * *');
      expect(cron1.equals(cron2)).toBe(false);
    });

    it('should handle whitespace differences', () => {
      const cron1 = CronExpression.create('0 9 * * *');
      const cron2 = CronExpression.create('  0 9 * * *  ');
      expect(cron1.equals(cron2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the cron expression string', () => {
      const expression = '0 9 * * *';
      const cron = CronExpression.create(expression);
      expect(cron.toString()).toBe(expression);
    });
  });

  describe('edge cases', () => {
    it('should handle every minute cron', () => {
      const cron = CronExpression.create('* * * * *');
      const from = new Date('2025-01-15T08:00:00Z');
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });

    it('should handle specific day of week', () => {
      const cron = CronExpression.create('0 9 * * 5'); // Every Friday at 9 AM
      const from = new Date('2025-01-15T08:00:00Z'); // Wednesday
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCDay()).toBe(5); // Friday
    });

    it('should handle last day of month', () => {
      const cron = CronExpression.create('0 9 L * *'); // Last day of month at 9 AM
      const from = new Date('2025-01-15T08:00:00Z');
      const next = cron.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next.getUTCDate()).toBeGreaterThan(27); // Last day is at least 28
    });

    it('should handle step values', () => {
      const cron = CronExpression.create('0 */2 * * *'); // Every 2 hours
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(3, from);

      expect(occurrences).toHaveLength(3);
      expect(occurrences[0].getUTCHours()).toBe(10);
      expect(occurrences[1].getUTCHours()).toBe(12);
      expect(occurrences[2].getUTCHours()).toBe(14);
    });

    it('should handle range values', () => {
      const cron = CronExpression.create('0 9-17 * * *'); // 9 AM to 5 PM
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = cron.getNextOccurrences(5, from);

      expect(occurrences).toHaveLength(5);
      occurrences.forEach(occ => {
        expect(occ.getUTCHours()).toBeGreaterThanOrEqual(9);
        expect(occ.getUTCHours()).toBeLessThanOrEqual(17);
      });
    });
  });
});

