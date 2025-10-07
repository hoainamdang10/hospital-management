/**
 * Unit Tests for Domain Events
 * Tests UserCreatedEvent, UserAuthenticatedEvent, UserRoleChangedEvent
 */

import { UserCreatedEvent } from '@domain/events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '@domain/events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '@domain/events/UserRoleChangedEvent';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { HealthcareRole } from '@domain/entities/HealthcareRole';

describe('Domain Events', () => {
  describe('UserCreatedEvent', () => {
    let userId: UserId;
    let email: Email;
    let role: HealthcareRole;

    beforeEach(() => {
      userId = UserId.fromString('u-123');
      email = Email.create('doctor@hospital.vn');
      role = HealthcareRole.create('DOCTOR', 'Doctor', 'Bác sĩ', 'Medical doctor', true);
    });

    it('should create UserCreatedEvent with correct properties', () => {
      const event = new UserCreatedEvent(userId, email, role);

      expect(event.eventType).toBe('UserCreated');
      expect(event.aggregateId).toBe('u-123');
      expect(event.aggregateType).toBe('User');
      expect(event.userIdVO).toBe(userId);
      expect(event.userEmail).toBe(email);
      expect(event.userRole).toBe(role);
    });

    it('should return correct event data', () => {
      const event = new UserCreatedEvent(userId, email, role);
      const eventData = event.getEventData();

      expect(eventData.userId).toBe('u-123');
      expect(eventData.email).toBe('doctor@hospital.vn');
      expect(eventData.role).toBe('DOCTOR');
    });

    it('should indicate event contains PHI', () => {
      const event = new UserCreatedEvent(userId, email, role);
      expect(event.containsPHI()).toBe(true);
    });

    it('should return null for patient ID', () => {
      const event = new UserCreatedEvent(userId, email, role);
      expect(event.getPatientId()).toBeNull();
    });

    it('should have event version 1', () => {
      const event = new UserCreatedEvent(userId, email, role);
      expect(event.eventVersion).toBe(1);
    });

    it('should have timestamp', () => {
      const event = new UserCreatedEvent(userId, email, role);
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should create event for different role types', () => {
      const nurseRole = HealthcareRole.create('NURSE', 'Nurse', 'Y tá', 'Registered nurse', true);
      const event = new UserCreatedEvent(userId, email, nurseRole);

      const eventData = event.getEventData();
      expect(eventData.role).toBe('NURSE');
    });

    it('should create event for admin role', () => {
      const adminRole = HealthcareRole.create('ADMIN', 'Admin', 'Quản trị viên', 'System administrator', true);
      const event = new UserCreatedEvent(userId, email, adminRole);

      const eventData = event.getEventData();
      expect(eventData.role).toBe('ADMIN');
    });

    it('should create event for patient role', () => {
      const patientRole = HealthcareRole.create('PATIENT', 'Patient', 'Bệnh nhân', 'Patient user', false);
      const event = new UserCreatedEvent(userId, email, patientRole);

      const eventData = event.getEventData();
      expect(eventData.role).toBe('PATIENT');
    });
  });

  describe('UserAuthenticatedEvent', () => {
    let userId: UserId;
    let timestamp: Date;

    beforeEach(() => {
      userId = UserId.fromString('u-123');
      timestamp = new Date('2024-01-01T10:00:00Z');
    });

    it('should create UserAuthenticatedEvent with correct properties', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );

      expect(event.eventType).toBe('UserAuthenticated');
      expect(event.aggregateId).toBe('u-123');
      expect(event.aggregateType).toBe('User');
      expect(event.userIdVO).toBe(userId);
      expect(event.ipAddress).toBe('192.168.1.1');
      expect(event.userAgent).toBe('Mozilla/5.0');
      expect(event.timestamp).toBe(timestamp);
    });

    it('should return correct event data', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );
      const eventData = event.getEventData();

      expect(eventData.userId).toBe('u-123');
      expect(eventData.ipAddress).toBe('192.168.1.1');
      expect(eventData.userAgent).toBe('Mozilla/5.0');
      expect(eventData.timestamp).toBe(timestamp);
    });

    it('should indicate event does not contain PHI', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );
      expect(event.containsPHI()).toBe(false);
    });

    it('should return null for patient ID', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );
      expect(event.getPatientId()).toBeNull();
    });

    it('should have event version 1', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        timestamp
      );
      expect(event.eventVersion).toBe(1);
    });

    it('should handle IPv6 addresses', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        'Mozilla/5.0',
        timestamp
      );
      expect(event.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle different user agents', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Chrome/91.0.4472.124',
        timestamp
      );
      expect(event.userAgent).toBe('Chrome/91.0.4472.124');
    });

    it('should handle localhost IP', () => {
      const event = new UserAuthenticatedEvent(
        userId,
        '127.0.0.1',
        'Mozilla/5.0',
        timestamp
      );
      expect(event.ipAddress).toBe('127.0.0.1');
    });

    it('should handle current timestamp', () => {
      const now = new Date();
      const event = new UserAuthenticatedEvent(
        userId,
        '192.168.1.1',
        'Mozilla/5.0',
        now
      );
      expect(event.timestamp).toBe(now);
    });
  });

  describe('UserRoleChangedEvent', () => {
    let userId: UserId;
    let oldRole: HealthcareRole;
    let newRole: HealthcareRole;

    beforeEach(() => {
      userId = UserId.fromString('u-123');
      oldRole = HealthcareRole.create('NURSE', 'Nurse', 'Y tá', 'Registered nurse', true);
      newRole = HealthcareRole.create('DOCTOR', 'Doctor', 'Bác sĩ', 'Medical doctor', true);
    });

    it('should create UserRoleChangedEvent with correct properties', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-123');

      expect(event.eventType).toBe('UserRoleChanged');
      expect(event.aggregateId).toBe('u-123');
      expect(event.aggregateType).toBe('User');
      expect(event.userIdVO).toBe(userId);
      expect(event.oldRole).toBe(oldRole);
      expect(event.newRole).toBe(newRole);
      expect(event.changedBy).toBe('admin-123');
    });

    it('should return correct event data', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-123');
      const eventData = event.getEventData();

      expect(eventData.userId).toBe('u-123');
      expect(eventData.oldRole).toBe('NURSE');
      expect(eventData.newRole).toBe('DOCTOR');
      expect(eventData.changedBy).toBe('admin-123');
    });

    it('should indicate event does not contain PHI', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-123');
      expect(event.containsPHI()).toBe(false);
    });

    it('should return null for patient ID', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-123');
      expect(event.getPatientId()).toBeNull();
    });

    it('should have event version 1', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-123');
      expect(event.eventVersion).toBe(1);
    });

    it('should handle role upgrade from patient to receptionist', () => {
      const patientRole = HealthcareRole.create('PATIENT', 'Patient', 'Bệnh nhân', 'Patient user', false);
      const receptionistRole = HealthcareRole.create('RECEPTIONIST', 'Receptionist', 'Lễ tân', 'Front desk staff', true);
      const event = new UserRoleChangedEvent(userId, patientRole, receptionistRole, 'admin-123');

      const eventData = event.getEventData();
      expect(eventData.oldRole).toBe('PATIENT');
      expect(eventData.newRole).toBe('RECEPTIONIST');
    });

    it('should handle role upgrade to admin', () => {
      const receptionistRole = HealthcareRole.create('RECEPTIONIST', 'Receptionist', 'Lễ tân', 'Front desk staff', true);
      const adminRole = HealthcareRole.create('ADMIN', 'Admin', 'Quản trị viên', 'System administrator', true);
      const event = new UserRoleChangedEvent(userId, receptionistRole, adminRole, 'super-admin');

      const eventData = event.getEventData();
      expect(eventData.oldRole).toBe('RECEPTIONIST');
      expect(eventData.newRole).toBe('ADMIN');
    });

    it('should handle role downgrade from admin to receptionist', () => {
      const adminRole = HealthcareRole.create('ADMIN', 'Admin', 'Quản trị viên', 'System administrator', true);
      const receptionistRole = HealthcareRole.create('RECEPTIONIST', 'Receptionist', 'Lễ tân', 'Front desk staff', false);
      const event = new UserRoleChangedEvent(userId, adminRole, receptionistRole, 'super-admin');

      const eventData = event.getEventData();
      expect(eventData.oldRole).toBe('ADMIN');
      expect(eventData.newRole).toBe('RECEPTIONIST');
    });

    it('should track who made the change', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'admin-456');
      expect(event.changedBy).toBe('admin-456');
    });

    it('should handle system-initiated role changes', () => {
      const event = new UserRoleChangedEvent(userId, oldRole, newRole, 'SYSTEM');
      expect(event.changedBy).toBe('SYSTEM');
    });
  });
});

