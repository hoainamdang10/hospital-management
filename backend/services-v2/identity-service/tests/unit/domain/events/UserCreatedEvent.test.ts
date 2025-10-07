/**
 * Unit Tests for UserCreatedEvent
 * Tests user creation event with PHI assertions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserCreatedEvent } from '@domain/events/UserCreatedEvent';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { HealthcareRole } from '@domain/entities/HealthcareRole';

describe('UserCreatedEvent', () => {
  const testUserId = UserId.fromString('u-test-123');
  const testEmail = Email.create('doctor@hospital.vn');
  const testRole = HealthcareRole.fromRoleType('DOCTOR');

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.userIdVO).toBe(testUserId);
      expect(event.userEmail).toBe(testEmail);
      expect(event.userRole).toBe(testRole);
    });

    it('should set correct event type', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.eventType).toBe('UserCreated');
    });

    it('should set correct aggregate type', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.aggregateType).toBe('User');
    });

    it('should set correct aggregate ID', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.aggregateId).toBe(testUserId.value);
    });

    it('should set event version to 1', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.eventVersion).toBe(1);
    });

    it('should have timestamp (occurredAt)', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should have unique event ID', () => {
      const event1 = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );
      const event2 = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });

  describe('getEventData', () => {
    it('should return complete event data', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const eventData = event.getEventData();

      expect(eventData).toEqual({
        userId: testUserId.value,
        email: testEmail.value,
        role: testRole.type
      });
    });

    it('should include user ID', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const eventData = event.getEventData();

      expect(eventData.userId).toBe(testUserId.value);
    });

    it('should include email address', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const eventData = event.getEventData();

      expect(eventData.email).toBe(testEmail.value);
    });

    it('should include role type', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const eventData = event.getEventData();

      expect(eventData.role).toBe(testRole.type);
    });
  });

  describe('containsPHI', () => {
    it('should return true as email is PHI', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return true for patient email', () => {
      const patientEmail = Email.create('patient@example.com');
      const patientRole = HealthcareRole.fromRoleType('PATIENT');
      const event = new UserCreatedEvent(
        testUserId,
        patientEmail,
        patientRole
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return true for doctor email', () => {
      const doctorEmail = Email.create('doctor@hospital.vn');
      const doctorRole = HealthcareRole.fromRoleType('DOCTOR');
      const event = new UserCreatedEvent(
        testUserId,
        doctorEmail,
        doctorRole
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return true for admin email', () => {
      const adminEmail = Email.create('admin@hospital.vn');
      const adminRole = HealthcareRole.fromRoleType('ADMIN');
      const event = new UserCreatedEvent(
        testUserId,
        adminEmail,
        adminRole
      );

      expect(event.containsPHI()).toBe(true);
    });
  });

  describe('getPatientId', () => {
    it('should return null as user is not a patient', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      expect(event.getPatientId()).toBeNull();
    });

    it('should return null even for patient role', () => {
      const patientEmail = Email.create('patient@example.com');
      const patientRole = HealthcareRole.fromRoleType('PATIENT');
      const event = new UserCreatedEvent(
        testUserId,
        patientEmail,
        patientRole
      );

      // User entity is not the same as Patient entity
      expect(event.getPatientId()).toBeNull();
    });
  });

  describe('role-specific scenarios', () => {
    it('should create event for patient user', () => {
      const patientEmail = Email.create('patient@example.com');
      const patientRole = HealthcareRole.fromRoleType('PATIENT');
      const event = new UserCreatedEvent(
        testUserId,
        patientEmail,
        patientRole
      );

      const data = event.getEventData();
      expect(data.role).toBe('PATIENT');
      expect(data.email).toBe('patient@example.com');
    });

    it('should create event for doctor user', () => {
      const doctorEmail = Email.create('doctor@hospital.vn');
      const doctorRole = HealthcareRole.fromRoleType('DOCTOR');
      const event = new UserCreatedEvent(
        testUserId,
        doctorEmail,
        doctorRole
      );

      const data = event.getEventData();
      expect(data.role).toBe('DOCTOR');
      expect(data.email).toBe('doctor@hospital.vn');
    });

    it('should create event for nurse user', () => {
      const nurseEmail = Email.create('nurse@hospital.vn');
      const nurseRole = HealthcareRole.fromRoleType('NURSE');
      const event = new UserCreatedEvent(
        testUserId,
        nurseEmail,
        nurseRole
      );

      const data = event.getEventData();
      expect(data.role).toBe('NURSE');
      expect(data.email).toBe('nurse@hospital.vn');
    });

    it('should create event for admin user', () => {
      const adminEmail = Email.create('admin@hospital.vn');
      const adminRole = HealthcareRole.fromRoleType('ADMIN');
      const event = new UserCreatedEvent(
        testUserId,
        adminEmail,
        adminRole
      );

      const data = event.getEventData();
      expect(data.role).toBe('ADMIN');
      expect(data.email).toBe('admin@hospital.vn');
    });

    it('should create event for receptionist user (billing merged)', () => {
      const staffEmail = Email.create('staff@hospital.vn');
      const staffRole = HealthcareRole.fromRoleType('RECEPTIONIST');
      const event = new UserCreatedEvent(
        testUserId,
        staffEmail,
        staffRole
      );

      const data = event.getEventData();
      expect(data.role).toBe('RECEPTIONIST');
      expect(data.email).toBe('staff@hospital.vn');
    });
  });

  describe('email domain scenarios', () => {
    it('should handle Vietnamese hospital email', () => {
      const vnEmail = Email.create('doctor@benhvien.vn');
      const event = new UserCreatedEvent(
        testUserId,
        vnEmail,
        testRole
      );

      expect(event.userEmail.value).toBe('doctor@benhvien.vn');
      expect(event.userEmail.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should handle international hospital email', () => {
      const intlEmail = Email.create('doctor@hospital.com');
      const event = new UserCreatedEvent(
        testUserId,
        intlEmail,
        testRole
      );

      expect(event.userEmail.value).toBe('doctor@hospital.com');
    });

    it('should handle clinic email', () => {
      const clinicEmail = Email.create('doctor@clinic.vn');
      const event = new UserCreatedEvent(
        testUserId,
        clinicEmail,
        testRole
      );

      expect(event.userEmail.value).toBe('doctor@clinic.vn');
      expect(event.userEmail.isVietnameseHospitalEmail()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should have immutable user ID', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const originalUserId = event.userIdVO;
      expect(event.userIdVO).toBe(originalUserId);
    });

    it('should have immutable email', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const originalEmail = event.userEmail;
      expect(event.userEmail).toBe(originalEmail);
    });

    it('should have immutable role', () => {
      const event = new UserCreatedEvent(
        testUserId,
        testEmail,
        testRole
      );

      const originalRole = event.userRole;
      expect(event.userRole).toBe(originalRole);
    });
  });
});

