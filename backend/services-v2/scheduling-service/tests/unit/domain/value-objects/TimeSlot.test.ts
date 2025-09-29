/**
 * TimeSlot Value Object Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for TimeSlot value object and Vietnamese healthcare business rules
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { TimeSlot, TimeSlotStatus } from '../../../../src/domain/value-objects/TimeSlot';
import { TEST_CONSTANTS } from '../../../setup';

describe('TimeSlot Value Object', () => {
  describe('Creation', () => {
    it('should create valid time slot', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      
      const timeSlot = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot.startTime).toEqual(startTime);
      expect(timeSlot.endTime).toEqual(endTime);
      expect(timeSlot.status).toBe(TimeSlotStatus.AVAILABLE);
      expect(timeSlot.duration).toBe(30); // 30 minutes
    });

    it('should calculate duration correctly', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // 45 minutes
      
      const timeSlot = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot.duration).toBe(45);
    });

    it('should validate end time is after start time', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() - 30 * 60 * 1000); // Before start time
      
      expect(() => {
        TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Thời gian kết thúc phải sau thời gian bắt đầu');
    });

    it('should validate minimum duration (15 minutes)', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 10 * 60 * 1000); // 10 minutes
      
      expect(() => {
        TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Thời gian hẹn tối thiểu là 15 phút');
    });

    it('should validate maximum duration (8 hours)', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours
      
      expect(() => {
        TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Thời gian hẹn tối đa là 8 giờ');
    });
  });

  describe('Vietnamese Healthcare Business Rules', () => {
    it('should reject Sunday appointments', () => {
      const sundayDate = new Date('2024-12-29T10:00:00.000Z'); // Sunday
      const endTime = new Date(sundayDate.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(sundayDate, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Không thể đặt lịch hẹn vào Chủ nhật');
    });

    it('should accept Monday to Saturday appointments', () => {
      // Test Monday (2024-12-30)
      const mondayDate = new Date('2024-12-30T10:00:00.000Z');
      const endTime = new Date(mondayDate.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(mondayDate, endTime, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();

      // Test Saturday (2025-01-04)
      const saturdayDate = new Date('2025-01-04T10:00:00.000Z');
      const saturdayEndTime = new Date(saturdayDate.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(saturdayDate, saturdayEndTime, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();
    });

    it('should validate business hours (8:00 - 17:00)', () => {
      const validDate = new Date('2024-12-30T00:00:00.000Z'); // Monday
      
      // Test before business hours (7:00 AM)
      const earlyMorning = new Date(validDate);
      earlyMorning.setHours(7, 0, 0, 0);
      const earlyEnd = new Date(earlyMorning.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(earlyMorning, earlyEnd, TimeSlotStatus.AVAILABLE);
      }).toThrow('Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)');

      // Test after business hours (18:00 PM)
      const lateEvening = new Date(validDate);
      lateEvening.setHours(18, 0, 0, 0);
      const lateEnd = new Date(lateEvening.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(lateEvening, lateEnd, TimeSlotStatus.AVAILABLE);
      }).toThrow('Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)');

      // Test valid business hours (10:00 AM)
      const validTime = new Date(validDate);
      validTime.setHours(10, 0, 0, 0);
      const validEnd = new Date(validTime.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(validTime, validEnd, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();
    });

    it('should validate appointment must be in future', () => {
      const pastDate = TEST_CONSTANTS.DATES.YESTERDAY;
      const endTime = new Date(pastDate.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(pastDate, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Thời gian hẹn phải trong tương lai');
    });

    it('should validate appointment not too far in future (60 days)', () => {
      const farFuture = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000); // 61 days from now
      farFuture.setHours(10, 0, 0, 0); // Set to valid business hour
      const endTime = new Date(farFuture.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(farFuture, endTime, TimeSlotStatus.AVAILABLE);
      }).toThrow('Không thể đặt lịch hẹn quá 60 ngày trong tương lai');
    });
  });

  describe('Time Slot Operations', () => {
    let timeSlot: TimeSlot;

    beforeEach(() => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      timeSlot = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
    });

    it('should check if time slot overlaps with another', () => {
      // Overlapping time slot (starts 15 minutes after, ends 15 minutes after)
      const overlappingStart = new Date(timeSlot.startTime.getTime() + 15 * 60 * 1000);
      const overlappingEnd = new Date(timeSlot.endTime.getTime() + 15 * 60 * 1000);
      const overlappingSlot = TimeSlot.create(overlappingStart, overlappingEnd, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot.overlapsWith(overlappingSlot)).toBe(true);
      expect(overlappingSlot.overlapsWith(timeSlot)).toBe(true);
    });

    it('should check if time slot does not overlap with non-overlapping slot', () => {
      // Non-overlapping time slot (starts after current ends)
      const nonOverlappingStart = new Date(timeSlot.endTime.getTime() + 15 * 60 * 1000);
      const nonOverlappingEnd = new Date(nonOverlappingStart.getTime() + 30 * 60 * 1000);
      const nonOverlappingSlot = TimeSlot.create(nonOverlappingStart, nonOverlappingEnd, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot.overlapsWith(nonOverlappingSlot)).toBe(false);
      expect(nonOverlappingSlot.overlapsWith(timeSlot)).toBe(false);
    });

    it('should check if time slot contains a specific time', () => {
      const timeInSlot = new Date(timeSlot.startTime.getTime() + 10 * 60 * 1000); // 10 minutes after start
      const timeOutsideSlot = new Date(timeSlot.endTime.getTime() + 10 * 60 * 1000); // 10 minutes after end
      
      expect(timeSlot.contains(timeInSlot)).toBe(true);
      expect(timeSlot.contains(timeOutsideSlot)).toBe(false);
      expect(timeSlot.contains(timeSlot.startTime)).toBe(true);
      expect(timeSlot.contains(timeSlot.endTime)).toBe(false); // End time is exclusive
    });

    it('should check if time slot is adjacent to another', () => {
      // Adjacent time slot (starts exactly when current ends)
      const adjacentStart = timeSlot.endTime;
      const adjacentEnd = new Date(adjacentStart.getTime() + 30 * 60 * 1000);
      const adjacentSlot = TimeSlot.create(adjacentStart, adjacentEnd, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot.isAdjacentTo(adjacentSlot)).toBe(true);
      expect(adjacentSlot.isAdjacentTo(timeSlot)).toBe(true);
    });

    it('should format time slot for display', () => {
      const formatted = timeSlot.toString();
      
      expect(formatted).toContain(timeSlot.startTime.toISOString());
      expect(formatted).toContain(timeSlot.endTime.toISOString());
      expect(formatted).toContain('30 phút');
      expect(formatted).toContain(TimeSlotStatus.AVAILABLE);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when all properties match', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      
      const timeSlot1 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      const timeSlot2 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot1.equals(timeSlot2)).toBe(true);
      expect(timeSlot2.equals(timeSlot1)).toBe(true);
    });

    it('should not be equal when properties differ', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      const differentEndTime = new Date(startTime.getTime() + 45 * 60 * 1000);
      
      const timeSlot1 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      const timeSlot2 = TimeSlot.create(startTime, differentEndTime, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot1.equals(timeSlot2)).toBe(false);
      expect(timeSlot2.equals(timeSlot1)).toBe(false);
    });

    it('should not be equal when status differs', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      
      const timeSlot1 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      const timeSlot2 = TimeSlot.create(startTime, endTime, TimeSlotStatus.BOOKED);
      
      expect(timeSlot1.equals(timeSlot2)).toBe(false);
    });

    it('should have same hash code when equal', () => {
      const startTime = TEST_CONSTANTS.DATES.TOMORROW;
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      
      const timeSlot1 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      const timeSlot2 = TimeSlot.create(startTime, endTime, TimeSlotStatus.AVAILABLE);
      
      expect(timeSlot1.getHashCode()).toBe(timeSlot2.getHashCode());
    });
  });

  describe('Edge Cases', () => {
    it('should handle exact business hour boundaries', () => {
      const validDate = new Date('2024-12-30T00:00:00.000Z'); // Monday
      
      // Test exactly 8:00 AM (should be valid)
      const exactStart = new Date(validDate);
      exactStart.setHours(8, 0, 0, 0);
      const exactEnd = new Date(exactStart.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(exactStart, exactEnd, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();

      // Test exactly 5:00 PM start (should be invalid as it would end after 5:00 PM)
      const lateStart = new Date(validDate);
      lateStart.setHours(17, 0, 0, 0);
      const lateEnd = new Date(lateStart.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(lateStart, lateEnd, TimeSlotStatus.AVAILABLE);
      }).toThrow('Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)');

      // Test ending exactly at 5:00 PM (should be valid)
      const validLateStart = new Date(validDate);
      validLateStart.setHours(16, 30, 0, 0);
      const validLateEnd = new Date(validDate);
      validLateEnd.setHours(17, 0, 0, 0);
      
      expect(() => {
        TimeSlot.create(validLateStart, validLateEnd, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T10:00:00.000Z'); // Leap year February 29
      const endTime = new Date(leapYearDate.getTime() + 30 * 60 * 1000);
      
      expect(() => {
        TimeSlot.create(leapYearDate, endTime, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();
    });

    it('should handle timezone considerations', () => {
      // Test with different timezone representations of the same time
      const utcTime = new Date('2024-12-30T10:00:00.000Z');
      const localTime = new Date('2024-12-30T10:00:00'); // Local time
      const endTime = new Date(utcTime.getTime() + 30 * 60 * 1000);
      
      // Both should be valid if they represent valid business hours
      expect(() => {
        TimeSlot.create(utcTime, endTime, TimeSlotStatus.AVAILABLE);
      }).not.toThrow();
    });
  });
});
