/**
 * StaffUpdatedEvent Tests
 * @version 2.0.0
 */

import { StaffUpdatedEvent } from '../../../../src/domain/events/StaffUpdatedEvent';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';

describe('StaffUpdatedEvent', () => {
  const staffId = StaffId.create('DOC-CARD-202501-001');
  const updatedFields = ['professionalInfo', 'workSchedule'];
  const updatedData = {
    professionalInfo: { title: 'Senior Doctor' },
    workSchedule: { workingDays: ['monday', 'tuesday'] }
  };

  describe('constructor', () => {
    it('should create event with updated fields', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        updatedFields,
        updatedData
      );

      expect(event.eventType).toBe('StaffUpdated');
      expect(event.staffId).toBe(staffId);
      expect(event.updatedFields).toEqual(updatedFields);
      expect(event.updatedData).toEqual(updatedData);
    });

    it('should include audit trail', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        updatedFields,
        updatedData,
        'correlation-123',
        'causation-456',
        'admin-123'
      );

      expect(event.correlationId).toBe('correlation-123');
    });
  });

  describe('getEventData', () => {
    it('should return event data with updated fields', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        updatedFields,
        updatedData
      );

      const data = event.getEventData();

      expect(data.updatedFields).toEqual(updatedFields);
      expect(data.updatedData).toEqual(updatedData);
    });
  });

  describe('containsPHI', () => {
    it('should return true when personalInfo updated', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        ['personalInfo'],
        { personalInfo: {} }
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return false when no PHI fields updated', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        ['workSchedule'],
        { workSchedule: {} }
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null', () => {
      const event = new StaffUpdatedEvent(
        staffId,
        updatedFields,
        updatedData
      );

      expect(event.getPatientId()).toBeNull();
    });
  });
});
