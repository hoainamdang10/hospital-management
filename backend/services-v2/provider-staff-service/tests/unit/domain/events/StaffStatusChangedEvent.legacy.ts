/**
 * StaffStatusChangedEvent Tests
 * @version 2.0.0
 */

import { StaffStatusChangedEvent } from '../../../../src/domain/events/StaffStatusChangedEvent';

describe('StaffStatusChangedEvent', () => {
  const eventData = {
    staffId: 'staff-123',
    oldStatus: 'active' as const,
    newStatus: 'suspended' as const,
    reason: 'License expired',
    changedBy: 'admin-123',
    timestamp: new Date()
  };

  describe('constructor', () => {
    it('should create event with status change', () => {
      const event = new StaffStatusChangedEvent(eventData);

      expect(event.eventType).toBe('StaffStatusChanged');
      expect(event.staffId).toBe('staff-123');
      expect(event.oldStatus).toBe('active');
      expect(event.newStatus).toBe('suspended');
      expect(event.reason).toBe('License expired');
    });

    it('should work without reason', () => {
      const { reason, ...dataWithoutReason } = eventData;
      const event = new StaffStatusChangedEvent(dataWithoutReason);

      expect(event.reason).toBeUndefined();
    });
  });

  describe('getEventData', () => {
    it('should return status change data', () => {
      const event = new StaffStatusChangedEvent(eventData);
      const data = event.getEventData();

      expect(data.oldStatus).toBe('active');
      expect(data.newStatus).toBe('suspended');
      expect(data.reason).toBe('License expired');
      expect(data.changedBy).toBe('admin-123');
    });
  });

  describe('containsPHI', () => {
    it('should return false', () => {
      const event = new StaffStatusChangedEvent(eventData);
      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null', () => {
      const event = new StaffStatusChangedEvent(eventData);
      expect(event.getPatientId()).toBeNull();
    });
  });
});
