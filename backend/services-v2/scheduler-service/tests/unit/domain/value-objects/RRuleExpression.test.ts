import { RRuleExpression } from '../../../../src/domain/value-objects/RRuleExpression';

describe('RRuleExpression Value Object', () => {
  describe('create', () => {
    it('should create valid RRULE expression', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      expect(rrule).toBeDefined();
      expect(rrule.getValue()).toBe('FREQ=DAILY;COUNT=5');
    });

    it('should create RRULE with WEEKLY frequency', () => {
      const rrule = RRuleExpression.create('FREQ=WEEKLY;BYDAY=MO,WE,FR');
      expect(rrule).toBeDefined();
    });

    it('should create RRULE with MONTHLY frequency', () => {
      const rrule = RRuleExpression.create('FREQ=MONTHLY;BYMONTHDAY=1,15');
      expect(rrule).toBeDefined();
    });

    it('should create RRULE with YEARLY frequency', () => {
      const rrule = RRuleExpression.create('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1');
      expect(rrule).toBeDefined();
    });

    it('should create RRULE with UNTIL date', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;UNTIL=20251231T235959Z');
      expect(rrule).toBeDefined();
    });

    it('should create RRULE with INTERVAL', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;INTERVAL=2');
      expect(rrule).toBeDefined();
    });

    it('should trim whitespace', () => {
      const rrule = RRuleExpression.create('  FREQ=DAILY;COUNT=5  ');
      expect(rrule.getValue()).toBe('FREQ=DAILY;COUNT=5');
    });

    it('should throw error for empty expression', () => {
      expect(() => RRuleExpression.create('')).toThrow('RRULE expression cannot be empty');
    });

    it('should throw error for whitespace-only expression', () => {
      expect(() => RRuleExpression.create('   ')).toThrow('RRULE expression cannot be empty');
    });

    it('should throw error for invalid RRULE expression', () => {
      expect(() => RRuleExpression.create('invalid rrule')).toThrow('Invalid RRULE expression');
    });

    it('should throw error for missing FREQ', () => {
      expect(() => RRuleExpression.create('COUNT=5')).toThrow('Invalid RRULE expression');
    });

    it('should throw error for invalid FREQ value', () => {
      expect(() => RRuleExpression.create('FREQ=INVALID')).toThrow('Invalid RRULE expression');
    });
  });

  describe('getNextOccurrence', () => {
    it('should get next occurrence from current time', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      const from = new Date('2025-01-15T08:00:00Z');
      const next = rrule.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next!.getTime()).toBeGreaterThanOrEqual(from.getTime());
    });

    it('should get next occurrence for weekly RRULE', () => {
      const rrule = RRuleExpression.create('FREQ=WEEKLY;BYDAY=MO');
      const from = new Date('2025-01-15T08:00:00Z'); // Wednesday
      const next = rrule.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next!.getDay()).toBe(1); // Monday
    });

    it('should get next occurrence for monthly RRULE', () => {
      const rrule = RRuleExpression.create('FREQ=MONTHLY;BYMONTHDAY=1');
      const from = new Date('2025-01-15T08:00:00Z');
      const next = rrule.getNextOccurrence(from);

      expect(next).toBeDefined();
      expect(next!.getDate()).toBe(1);
    });

    it('should return null if no more occurrences (COUNT reached)', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=1');
      const from = new Date('2025-01-15T08:00:00Z');
      
      // First occurrence
      const first = rrule.getNextOccurrence(from);
      expect(first).toBeDefined();
      
      // No more occurrences after COUNT is reached
      const second = rrule.getNextOccurrence(new Date(first!.getTime() + 86400000));
      expect(second).toBeNull();
    });

    it('should return null if past UNTIL date', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;UNTIL=20250115T000000Z');
      const from = new Date('2025-01-16T00:00:00Z');
      const next = rrule.getNextOccurrence(from);

      expect(next).toBeNull();
    });

    it('should use default current time if not provided', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      const next = rrule.getNextOccurrence();

      expect(next).toBeDefined();
      expect(next!.getTime()).toBeGreaterThanOrEqual(new Date().getTime());
    });
  });

  describe('getNextOccurrences', () => {
    it('should get multiple next occurrences', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=10');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(5, from);

      expect(occurrences).toHaveLength(5);
    });

    it('should get occurrences in ascending order', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=10');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(5, from);

      for (let i = 1; i < occurrences.length; i++) {
        expect(occurrences[i].getTime()).toBeGreaterThan(occurrences[i - 1].getTime());
      }
    });

    it('should respect COUNT limit', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=3');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(10, from);

      expect(occurrences.length).toBeLessThanOrEqual(3);
    });

    it('should handle count of 1', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=10');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(1, from);

      expect(occurrences).toHaveLength(1);
    });

    it('should handle count of 0', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=10');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(0, from);

      expect(occurrences).toHaveLength(0);
    });

    it('should handle weekly occurrences', () => {
      const rrule = RRuleExpression.create('FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10');
      const from = new Date('2025-01-15T08:00:00Z');
      const occurrences = rrule.getNextOccurrences(6, from);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        const day = occ.getDay();
        expect([1, 3, 5]).toContain(day); // Monday, Wednesday, Friday
      });
    });
  });

  describe('getOccurrencesBetween', () => {
    it('should get occurrences within date range', () => {
      const rrule = RRuleExpression.create('DTSTART:20250115T000000Z\nRRULE:FREQ=DAILY;COUNT=30');
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-20T23:59:59Z');
      const occurrences = rrule.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect(occ.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(occ.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should return empty array if no occurrences in range', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;UNTIL=20250110T000000Z');
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-20T23:59:59Z');
      const occurrences = rrule.getOccurrencesBetween(startDate, endDate);

      expect(occurrences).toHaveLength(0);
    });

    it('should handle daily RRULE within range', () => {
      const rrule = RRuleExpression.create('DTSTART:20250115T000000Z\nRRULE:FREQ=DAILY;COUNT=30');
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-20T23:59:59Z');
      const occurrences = rrule.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBe(6); // 6 days (15-20 inclusive)
    });

    it('should handle weekly RRULE within range', () => {
      const rrule = RRuleExpression.create('DTSTART:20250113T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=20');
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-31T23:59:59Z');
      const occurrences = rrule.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        const day = occ.getDay();
        expect([1, 3, 5]).toContain(day);
      });
    });

    it('should respect COUNT limit in range', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;COUNT=3');
      const startDate = new Date('2025-01-15T00:00:00Z');
      const endDate = new Date('2025-01-31T23:59:59Z');
      const occurrences = rrule.getOccurrencesBetween(startDate, endDate);

      expect(occurrences.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getValue', () => {
    it('should return the RRULE expression string', () => {
      const expression = 'FREQ=DAILY;COUNT=5';
      const rrule = RRuleExpression.create(expression);
      expect(rrule.getValue()).toBe(expression);
    });
  });

  describe('equals', () => {
    it('should return true for equal expressions', () => {
      const rrule1 = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      const rrule2 = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      expect(rrule1.equals(rrule2)).toBe(true);
    });

    it('should return false for different expressions', () => {
      const rrule1 = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      const rrule2 = RRuleExpression.create('FREQ=WEEKLY;COUNT=5');
      expect(rrule1.equals(rrule2)).toBe(false);
    });

    it('should handle whitespace differences', () => {
      const rrule1 = RRuleExpression.create('FREQ=DAILY;COUNT=5');
      const rrule2 = RRuleExpression.create('  FREQ=DAILY;COUNT=5  ');
      expect(rrule1.equals(rrule2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the RRULE expression string', () => {
      const expression = 'FREQ=DAILY;COUNT=5';
      const rrule = RRuleExpression.create(expression);
      expect(rrule.toString()).toBe(expression);
    });
  });

  describe('edge cases', () => {
    it('should handle RRULE with INTERVAL', () => {
      const rrule = RRuleExpression.create('FREQ=DAILY;INTERVAL=2;COUNT=5');
      const from = new Date('2025-01-15T00:00:00Z');
      const occurrences = rrule.getNextOccurrences(3, from);

      expect(occurrences).toHaveLength(3);
      // Every 2 days
      expect(occurrences[1].getTime() - occurrences[0].getTime()).toBeGreaterThanOrEqual(86400000 * 2);
    });

    it('should handle RRULE with BYMONTHDAY', () => {
      const rrule = RRuleExpression.create('FREQ=MONTHLY;BYMONTHDAY=1,15;COUNT=6');
      const from = new Date('2025-01-01T00:00:00Z');
      const occurrences = rrule.getNextOccurrences(4, from);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect([1, 15]).toContain(occ.getDate());
      });
    });

    it('should handle RRULE with BYHOUR', () => {
      const rrule = RRuleExpression.create('DTSTART:20250115T000000Z\nRRULE:FREQ=DAILY;BYHOUR=9,12,15;COUNT=10');
      const from = new Date('2025-01-15T00:00:00Z');
      const occurrences = rrule.getNextOccurrences(6, from);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect([9, 12, 15]).toContain(occ.getUTCHours());
      });
    });

    it('should handle complex RRULE', () => {
      const rrule = RRuleExpression.create('DTSTART:20250113T090000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=9;BYMINUTE=0;COUNT=10');
      const from = new Date('2025-01-13T00:00:00Z'); // Start from Monday
      const occurrences = rrule.getNextOccurrences(5, from);

      expect(occurrences.length).toBeGreaterThan(0);
      occurrences.forEach(occ => {
        expect([1, 3, 5]).toContain(occ.getUTCDay());
        expect(occ.getUTCHours()).toBe(9);
        expect(occ.getUTCMinutes()).toBe(0);
      });
    });
  });
});

