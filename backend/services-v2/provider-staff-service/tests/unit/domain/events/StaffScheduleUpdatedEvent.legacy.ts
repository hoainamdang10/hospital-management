/**
 * StaffScheduleUpdatedEvent Tests
 * @version 2.0.0
 */

import { StaffScheduleUpdatedEvent } from '../../../../src/domain/events/StaffScheduleUpdatedEvent';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';

describe('StaffScheduleUpdatedEvent', () => {
  const staffId = StaffId.create('DOC-CARD-202501-001');
  const workSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '08:00', end: '17:00' },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  describe('constructor', () => {
    it('should create event with schedule', () => {
      const event = new StaffScheduleUpdatedEvent(
        staffId,
        workSchedule
      );

      expect(event.eventType).toBe('StaffScheduleUpdated');
      expect(event.staffId).toBe(staffId);
      expect(event.newSchedule).toBe(workSchedule);
    });

    it('should include tracking info', () => {
      const event = new StaffScheduleUpdatedEvent(
        staffId,
        workSchedule,
        'correlation-123',
        'causation-456',
        'admin-123'
      );

      expect(event.correlationId).toBe('correlation-123');
    });
  });

  describe('getEventData', () => {
    it('should return schedule data', () => {
      const event = new StaffScheduleUpdatedEvent(
        staffId,
        workSchedule
      );

      const data = event.getEventData();

      expect(data).toHaveProperty('staffId');
      expect(data).toHaveProperty('newSchedule');
      expect(data).toHaveProperty('occurredAt');
    });
  });

  describe('containsPHI', () => {
    it('should return false', () => {
      const event = new StaffScheduleUpdatedEvent(
        staffId,
        workSchedule
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null', () => {
      const event = new StaffScheduleUpdatedEvent(
        staffId,
        workSchedule
      );

      expect(event.getPatientId()).toBeNull();
    });
  });
});
