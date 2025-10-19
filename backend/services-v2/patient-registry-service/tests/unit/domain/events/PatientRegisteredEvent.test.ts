/**
 * PatientRegisteredEvent Tests
 * Comprehensive unit tests for PatientRegisteredEvent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientRegisteredEvent } from '@domain/events/PatientRegisteredEvent';

describe('PatientRegisteredEvent', () => {
  const patientId = 'PAT-202501-001';
  const userId = 'user-123';
  const fullName = 'Nguyen Van A';
  const dateOfBirth = new Date('1990-01-01');
  const gender = 'male' as const;
  const nationalId = '001234567890';

  describe('constructor', () => {
    it('should create event with all required data', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );

      expect(event).toBeDefined();
      expect(event.patientId).toBe(patientId);
      expect(event.patientUserId).toBe(userId);
      expect(event.fullName).toBe(fullName);
      expect(event.dateOfBirth).toBe(dateOfBirth);
      expect(event.gender).toBe(gender);
      expect(event.nationalId).toBe(nationalId);
      expect(event.eventType).toBe('PatientRegistered');
      expect(event.aggregateType).toBe('Patient');
      expect(event.eventVersion).toBe(1);
    });

    it('should create event with correlation and causation IDs', () => {
      const correlationId = 'corr-123';
      const causationId = 'cause-456';
      const userIdForAudit = 'audit-user-789';

      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId,
        correlationId,
        causationId,
        userIdForAudit
      );

      expect(event.correlationId).toBe(correlationId);
      expect(event.causationId).toBe(causationId);
      expect(event.userId).toBe(userIdForAudit);
    });

    it('should set occurredAt timestamp', () => {
      const beforeCreate = new Date();
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );
      const afterCreate = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('getEventData', () => {
    it('should return complete event data', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );

      const eventData = event.getEventData();

      expect(eventData.patientId).toBe(patientId);
      expect(eventData.userId).toBe(userId);
      expect(eventData.personalInfo.fullName).toBe(fullName);
      expect(eventData.personalInfo.dateOfBirth).toBe(dateOfBirth);
      expect(eventData.personalInfo.gender).toBe(gender);
      expect(eventData.personalInfo.nationalId).toBe(nationalId);
      expect(eventData.registeredAt).toBeDefined();
    });
  });

  describe('containsPHI', () => {
    it('should return true as event contains PHI data', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );

      expect(event.containsPHI()).toBe(true);
    });
  });

  describe('getPatientId', () => {
    it('should return patient ID', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );

      expect(event.getPatientId()).toBe(patientId);
    });
  });

  describe('getPayload', () => {
    it('should return event payload', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        gender,
        nationalId
      );

      const payload = event.getPayload();

      expect(payload).toEqual(event.getEventData());
      expect(payload.patientId).toBe(patientId);
      expect(payload.userId).toBe(userId);
    });
  });

  describe('gender variations', () => {
    it('should handle male gender', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        'male',
        nationalId
      );

      expect(event.gender).toBe('male');
    });

    it('should handle female gender', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        'female',
        nationalId
      );

      expect(event.gender).toBe('female');
    });

    it('should handle other gender', () => {
      const event = new PatientRegisteredEvent(
        patientId,
        userId,
        fullName,
        dateOfBirth,
        'other',
        nationalId
      );

      expect(event.gender).toBe('other');
    });
  });
});

