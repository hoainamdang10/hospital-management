/**
 * StaffEmploymentStatusUpdatedEvent Tests
 * @version 2.0.0
 */

import { StaffEmploymentStatusUpdatedEvent } from '../../../../src/domain/events/StaffEmploymentStatusUpdatedEvent';

describe('StaffEmploymentStatusUpdatedEvent', () => {
  const eventData = {
    staffId: 'staff-123',
    oldEmploymentType: 'full_time' as const,
    newEmploymentType: 'part_time' as const,
    contractEndDate: new Date('2025-12-31'),
    updatedBy: 'admin-123',
    timestamp: new Date()
  };

  describe('constructor', () => {
    it('should create event with employment change', () => {
      const event = new StaffEmploymentStatusUpdatedEvent(eventData);

      expect(event.eventType).toBe('StaffEmploymentStatusUpdated');
      expect(event.staffId).toBe('staff-123');
      expect(event.oldEmploymentType).toBe('full_time');
      expect(event.newEmploymentType).toBe('part_time');
    });

    it('should work without contract end date', () => {
      const { contractEndDate, ...dataWithoutEndDate } = eventData;
      const event = new StaffEmploymentStatusUpdatedEvent(dataWithoutEndDate);

      expect(event.contractEndDate).toBeUndefined();
    });
  });

  describe('getEventData', () => {
    it('should return employment change data', () => {
      const event = new StaffEmploymentStatusUpdatedEvent(eventData);
      const data = event.getEventData();

      expect(data.oldEmploymentType).toBe('full_time');
      expect(data.newEmploymentType).toBe('part_time');
      expect(data.updatedBy).toBe('admin-123');
    });
  });

  describe('containsPHI', () => {
    it('should return false', () => {
      const event = new StaffEmploymentStatusUpdatedEvent(eventData);
      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null', () => {
      const event = new StaffEmploymentStatusUpdatedEvent(eventData);
      expect(event.getPatientId()).toBeNull();
    });
  });
});
