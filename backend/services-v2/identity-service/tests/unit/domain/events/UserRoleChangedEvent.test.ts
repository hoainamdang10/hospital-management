/**
 * Unit Tests for UserRoleChangedEvent
 * Tests domain event creation and assertions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserRoleChangedEvent } from '@domain/events/UserRoleChangedEvent';
import { UserId } from '@domain/value-objects/UserId';
import { HealthcareRole } from '@domain/entities/HealthcareRole';

describe('UserRoleChangedEvent', () => {
  const testUserId = UserId.fromString('u-test-123');
  const oldRole = HealthcareRole.fromRoleType('PATIENT');
  const newRole = HealthcareRole.fromRoleType('DOCTOR');
  const changedBy = 'admin-user-456';

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.userIdVO).toBe(testUserId);
      expect(event.oldRole).toBe(oldRole);
      expect(event.newRole).toBe(newRole);
      expect(event.changedBy).toBe(changedBy);
    });

    it('should set correct event type', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.eventType).toBe('UserRoleChanged');
    });

    it('should set correct aggregate type', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.aggregateType).toBe('User');
    });

    it('should set correct aggregate ID', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.aggregateId).toBe(testUserId.value);
    });

    it('should set event version to 1', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.eventVersion).toBe(1);
    });

    it('should have timestamp (occurredAt)', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should have unique event ID', () => {
      const event1 = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );
      const event2 = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('getEventData', () => {
    it('should return complete event data', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      const eventData = event.getEventData();

      expect(eventData).toEqual({
        userId: testUserId.value,
        oldRole: oldRole.type,
        newRole: newRole.type,
        changedBy: changedBy
      });
    });

    it('should include old role type', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      const eventData = event.getEventData();

      expect(eventData.oldRole).toBe('PATIENT');
    });

    it('should include new role type', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      const eventData = event.getEventData();

      expect(eventData.newRole).toBe('DOCTOR');
    });

    it('should include changedBy user ID', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      const eventData = event.getEventData();

      expect(eventData.changedBy).toBe(changedBy);
    });
  });

  describe('containsPHI', () => {
    it('should return false as role changes do not contain PHI', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null as this is not a patient-specific event', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      expect(event.getPatientId()).toBeNull();
    });
  });

  describe('role change scenarios', () => {
    it('should handle patient to doctor role change', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        HealthcareRole.fromRoleType('PATIENT'),
        HealthcareRole.fromRoleType('DOCTOR'),
        changedBy
      );

      const data = event.getEventData();
      expect(data.oldRole).toBe('PATIENT');
      expect(data.newRole).toBe('DOCTOR');
    });

    it('should handle doctor to admin role change', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        HealthcareRole.fromRoleType('DOCTOR'),
        HealthcareRole.fromRoleType('ADMIN'),
        changedBy
      );

      const data = event.getEventData();
      expect(data.oldRole).toBe('DOCTOR');
      expect(data.newRole).toBe('ADMIN');
    });

    it('should handle nurse to doctor role change', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        HealthcareRole.fromRoleType('NURSE'),
        HealthcareRole.fromRoleType('DOCTOR'),
        changedBy
      );

      const data = event.getEventData();
      expect(data.oldRole).toBe('NURSE');
      expect(data.newRole).toBe('DOCTOR');
    });

    it('should handle admin to patient role change (demotion)', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        HealthcareRole.fromRoleType('ADMIN'),
        HealthcareRole.fromRoleType('PATIENT'),
        changedBy
      );

      const data = event.getEventData();
      expect(data.oldRole).toBe('ADMIN');
      expect(data.newRole).toBe('PATIENT');
    });
  });

  describe('audit trail', () => {
    it('should preserve changedBy for audit purposes', () => {
      const adminId = 'admin-123';
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        adminId
      );

      expect(event.changedBy).toBe(adminId);
      expect(event.getEventData().changedBy).toBe(adminId);
    });

    it('should have immutable timestamp (occurredAt)', () => {
      const event = new UserRoleChangedEvent(
        testUserId,
        oldRole,
        newRole,
        changedBy
      );

      const originalTimestamp = event.occurredAt;

      // occurredAt is readonly, so it cannot be modified
      expect(event.occurredAt).toBe(originalTimestamp);
      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });
});

