/**
 * WorkSchedule Value Object - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';

describe('WorkSchedule Value Object', () => {
  const validData = {
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  };

  describe('create', () => {
    it('should create WorkSchedule with valid data', () => {
      // Act
      const schedule = WorkSchedule.create(validData);

      // Assert
      expect(schedule).toBeInstanceOf(WorkSchedule);
      expect(schedule.workingDays).toEqual(validData.workingDays);
      expect(schedule.workingHours).toEqual(validData.workingHours);
      expect(schedule.timeZone).toBe(validData.timeZone);
      expect(schedule.isFlexible).toBe(false);
    });

    it('should create flexible schedule', () => {
      // Arrange
      const flexibleData = { ...validData, isFlexible: true };

      // Act
      const schedule = WorkSchedule.create(flexibleData);

      // Assert
      expect(schedule.isFlexible).toBe(true);
    });

    it('should throw error for empty working days', () => {
      // Arrange
      const invalidData = { ...validData, workingDays: [] };

      // Act & Assert
      expect(() => WorkSchedule.create(invalidData as any)).toThrow();
    });

    it('should throw error for invalid time format', () => {
      // Arrange
      const invalidTimes = [
        { start: '25:00', end: '17:00' }, // Invalid hour
        { start: '08:60', end: '17:00' }, // Invalid minute
        { start: '8:00', end: '17:00' },  // Missing leading zero
        { start: 'invalid', end: '17:00' }
      ];

      // Act & Assert
      invalidTimes.forEach(hours => {
        const invalidData = { ...validData, workingHours: hours };
        expect(() => WorkSchedule.create(invalidData)).toThrow();
      });
    });

    it('should throw error when end time is before start time', () => {
      // Arrange
      const invalidData = {
        ...validData,
        workingHours: {
          start: '17:00',
          end: '08:00'
        }
      };

      // Act & Assert
      expect(() => WorkSchedule.create(invalidData)).toThrow();
    });

    it('should throw error for invalid timezone', () => {
      // Arrange
      const invalidData = { ...validData, timeZone: 'Invalid/Timezone' };

      // Act & Assert
      expect(() => WorkSchedule.create(invalidData)).toThrow();
    });

    it('should accept valid timezones', () => {
      // Arrange
      const validTimezones = [
        'Asia/Ho_Chi_Minh',
        'Asia/Bangkok',
        'UTC',
        'America/New_York'
      ];

      // Act & Assert
      validTimezones.forEach(tz => {
        const data = { ...validData, timeZone: tz };
        const schedule = WorkSchedule.create(data);
        expect(schedule.timeZone).toBe(tz);
      });
    });
  });

  describe('isWorkingDay', () => {
    it('should return true for working days', () => {
      // Arrange
      const schedule = WorkSchedule.create(validData);

      // Act & Assert
      expect(schedule.isWorkingDay('monday')).toBe(true);
      expect(schedule.isWorkingDay('tuesday')).toBe(true);
      expect(schedule.isWorkingDay('friday')).toBe(true);
    });

    it('should return false for non-working days', () => {
      // Arrange
      const schedule = WorkSchedule.create(validData);

      // Act & Assert
      expect(schedule.isWorkingDay('saturday')).toBe(false);
      expect(schedule.isWorkingDay('sunday')).toBe(false);
    });
  });

  describe('getWorkingHoursCount', () => {
    it('should calculate correct working hours', () => {
      // Arrange
      const schedule = WorkSchedule.create(validData);

      // Act
      const hours = schedule.getWorkingHoursCount();

      // Assert
      expect(hours).toBe(9); // 08:00 to 17:00 = 9 hours
    });

    it('should calculate half-day hours', () => {
      // Arrange
      const halfDayData = {
        ...validData,
        workingHours: {
          start: '08:00',
          end: '12:00'
        }
      };
      const schedule = WorkSchedule.create(halfDayData);

      // Act
      const hours = schedule.getWorkingHoursCount();

      // Assert
      expect(hours).toBe(4);
    });
  });

  describe('getWeeklyWorkingHours', () => {
    it('should calculate total weekly hours', () => {
      // Arrange
      const schedule = WorkSchedule.create(validData);

      // Act
      const weeklyHours = schedule.getWeeklyWorkingHours();

      // Assert
      expect(weeklyHours).toBe(45); // 5 days * 9 hours
    });

    it('should calculate for part-time schedule', () => {
      // Arrange
      const partTimeData = {
        ...validData,
        workingDays: ['monday', 'wednesday', 'friday'] as const,
        workingHours: {
          start: '08:00',
          end: '12:00'
        }
      };
      const schedule = WorkSchedule.create(partTimeData);

      // Act
      const weeklyHours = schedule.getWeeklyWorkingHours();

      // Assert
      expect(weeklyHours).toBe(12); // 3 days * 4 hours
    });
  });

  describe('equals', () => {
    it('should return true for same schedule', () => {
      // Arrange
      const schedule1 = WorkSchedule.create(validData);
      const schedule2 = WorkSchedule.create(validData);

      // Act & Assert
      expect(schedule1.equals(schedule2)).toBe(true);
    });

    it('should return false for different schedules', () => {
      // Arrange
      const schedule1 = WorkSchedule.create(validData);
      const schedule2 = WorkSchedule.create({
        ...validData,
        workingDays: ['monday', 'tuesday', 'wednesday'] as const
      });

      // Act & Assert
      expect(schedule1.equals(schedule2)).toBe(false);
    });
  });

  describe('Vietnamese work schedule patterns', () => {
    it('should support standard Vietnamese office hours', () => {
      // Arrange
      const vietnameseOfficeHours = {
        ...validData,
        workingHours: {
          start: '08:00',
          end: '17:00'
        },
        timeZone: 'Asia/Ho_Chi_Minh'
      };

      // Act
      const schedule = WorkSchedule.create(vietnameseOfficeHours);

      // Assert
      expect(schedule.getWorkingHoursCount()).toBe(9);
      expect(schedule.timeZone).toBe('Asia/Ho_Chi_Minh');
    });

    it('should support hospital shift patterns', () => {
      // Arrange
      const morningShift = {
        ...validData,
        workingHours: {
          start: '07:00',
          end: '15:00'
        }
      };

      const afternoonShift = {
        ...validData,
        workingHours: {
          start: '15:00',
          end: '23:00'
        }
      };

      // Act
      const morning = WorkSchedule.create(morningShift);
      const afternoon = WorkSchedule.create(afternoonShift);

      // Assert
      expect(morning.getWorkingHoursCount()).toBe(8);
      expect(afternoon.getWorkingHoursCount()).toBe(8);
    });

    it('should support weekend work for emergency staff', () => {
      // Arrange
      const weekendSchedule = {
        ...validData,
        workingDays: ['saturday', 'sunday'] as const
      };

      // Act
      const schedule = WorkSchedule.create(weekendSchedule);

      // Assert
      expect(schedule.isWorkingDay('saturday')).toBe(true);
      expect(schedule.isWorkingDay('sunday')).toBe(true);
      expect(schedule.getWeeklyWorkingHours()).toBe(18); // 2 days * 9 hours
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const schedule = WorkSchedule.create(validData);
      const originalDays = schedule.workingDays;

      // Act - Try to modify (should not work)
      try {
        (schedule as any).workingDays = ['monday'];
      } catch (e) {
        // Expected to fail in strict mode
      }

      // Assert
      expect(schedule.workingDays).toEqual(originalDays);
    });
  });
});

