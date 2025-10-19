/**
 * Patient Domain Events Tests
 * Comprehensive unit tests for all patient domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientUpdatedEvent } from '@domain/events/PatientUpdatedEvent';
import { PatientDeactivatedEvent } from '@domain/events/PatientDeactivatedEvent';
import { PatientLinkedEvent } from '@domain/events/PatientLinkedEvent';
import { PatientMergedEvent } from '@domain/events/PatientMergedEvent';
import { PatientConsentGrantedEvent } from '@domain/events/PatientConsentGrantedEvent';

describe('Patient Domain Events', () => {
  const patientId = 'PAT-202501-001';
  const correlationId = 'corr-123';
  const causationId = 'cause-456';
  const userIdForAudit = 'audit-user-789';

  describe('PatientUpdatedEvent', () => {
    const updateType = 'personal_info';
    const updatedBy = 'user-123';

    it('should create event with required data', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy
      );

      expect(event).toBeDefined();
      expect(event.patientId).toBe(patientId);
      expect(event.updateType).toBe(updateType);
      expect(event.updatedBy).toBe(updatedBy);
      expect(event.eventType).toBe('PatientUpdated');
      expect(event.aggregateType).toBe('Patient');
      expect(event.eventVersion).toBe(1);
    });

    it('should create event with correlation and causation IDs', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy,
        correlationId,
        causationId,
        userIdForAudit
      );

      expect(event.correlationId).toBe(correlationId);
      expect(event.causationId).toBe(causationId);
      expect(event.userId).toBe(userIdForAudit);
    });

    it('should return event data', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy
      );

      const eventData = event.getEventData();

      expect(eventData.patientId).toBe(patientId);
      expect(eventData.updateType).toBe(updateType);
      expect(eventData.updatedBy).toBe(updatedBy);
      expect(eventData.updatedAt).toBeDefined();
    });

    it('should contain PHI', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return patient ID', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy
      );

      expect(event.getPatientId()).toBe(patientId);
    });

    it('should return payload', () => {
      const event = new PatientUpdatedEvent(
        patientId,
        updateType,
        updatedBy
      );

      const payload = event.getPayload();

      expect(payload).toEqual(event.getEventData());
    });
  });

  describe('PatientDeactivatedEvent', () => {
    const reason = 'Patient requested deactivation';
    const performedBy = 'admin-123';

    it('should create event with required data', () => {
      const event = new PatientDeactivatedEvent(
        patientId,
        reason,
        performedBy
      );

      expect(event).toBeDefined();
      expect(event.patientId).toBe(patientId);
      expect(event.reason).toBe(reason);
      expect(event.performedBy).toBe(performedBy);
      expect(event.eventType).toBe('PatientDeactivated');
      expect(event.aggregateType).toBe('Patient');
    });

    it('should return event data', () => {
      const event = new PatientDeactivatedEvent(
        patientId,
        reason,
        performedBy
      );

      const eventData = event.getEventData();

      expect(eventData.patientId).toBe(patientId);
      expect(eventData.reason).toBe(reason);
      expect(eventData.performedBy).toBe(performedBy);
      expect(eventData.deactivatedAt).toBeDefined();
    });

    it('should contain PHI', () => {
      const event = new PatientDeactivatedEvent(
        patientId,
        reason,
        performedBy
      );

      expect(event.containsPHI()).toBe(true);
    });
  });

  describe('PatientLinkedEvent', () => {
    const otherPatientId = 'PAT-202501-002';
    const linkType = 'refer' as const;
    const performedBy = 'admin-123';

    it('should create event with required data', () => {
      const event = new PatientLinkedEvent(
        patientId,
        otherPatientId,
        linkType,
        performedBy
      );

      expect(event).toBeDefined();
      expect(event.patientId).toBe(patientId);
      expect(event.otherPatientId).toBe(otherPatientId);
      expect(event.linkType).toBe(linkType);
      expect(event.performedBy).toBe(performedBy);
      expect(event.eventType).toBe('PatientLinked');
    });

    it('should return event data', () => {
      const event = new PatientLinkedEvent(
        patientId,
        otherPatientId,
        linkType,
        performedBy
      );

      const eventData = event.getEventData();

      expect(eventData.patientId).toBe(patientId);
      expect(eventData.otherPatientId).toBe(otherPatientId);
      expect(eventData.linkType).toBe(linkType);
      expect(eventData.performedBy).toBe(performedBy);
      expect(eventData.linkedAt).toBeDefined();
    });

    it('should contain PHI', () => {
      const event = new PatientLinkedEvent(
        patientId,
        otherPatientId,
        linkType,
        performedBy
      );

      expect(event.containsPHI()).toBe(true);
    });
  });

  describe('PatientMergedEvent', () => {
    const duplicatePatientId = 'PAT-202501-002';
    const masterPatientId = 'PAT-202501-001';
    const reason = 'Duplicate patient records found';
    const performedBy = 'admin-123';

    it('should create event with required data', () => {
      const event = new PatientMergedEvent(
        duplicatePatientId,
        masterPatientId,
        reason,
        performedBy
      );

      expect(event).toBeDefined();
      expect(event.duplicatePatientId).toBe(duplicatePatientId);
      expect(event.masterPatientId).toBe(masterPatientId);
      expect(event.reason).toBe(reason);
      expect(event.performedBy).toBe(performedBy);
      expect(event.eventType).toBe('PatientMerged');
    });

    it('should return event data', () => {
      const event = new PatientMergedEvent(
        duplicatePatientId,
        masterPatientId,
        reason,
        performedBy
      );

      const eventData = event.getEventData();

      expect(eventData.duplicatePatientId).toBe(duplicatePatientId);
      expect(eventData.masterPatientId).toBe(masterPatientId);
      expect(eventData.reason).toBe(reason);
      expect(eventData.performedBy).toBe(performedBy);
      expect(eventData.mergedAt).toBeDefined();
    });

    it('should contain PHI', () => {
      const event = new PatientMergedEvent(
        duplicatePatientId,
        masterPatientId,
        reason,
        performedBy
      );

      expect(event.containsPHI()).toBe(true);
    });
  });

  describe('PatientConsentGrantedEvent', () => {
    const consentId = 'consent-123';
    const consentType = 'treatment';
    const grantedBy = 'patient-123';

    it('should create event with required data', () => {
      const event = new PatientConsentGrantedEvent(
        patientId,
        consentId,
        consentType,
        grantedBy
      );

      expect(event).toBeDefined();
      expect(event.patientId).toBe(patientId);
      expect(event.consentId).toBe(consentId);
      expect(event.consentType).toBe(consentType);
      expect(event.grantedBy).toBe(grantedBy);
      expect(event.eventType).toBe('PatientConsentGranted');
    });

    it('should return event data', () => {
      const event = new PatientConsentGrantedEvent(
        patientId,
        consentId,
        consentType,
        grantedBy
      );

      const eventData = event.getEventData();

      expect(eventData.patientId).toBe(patientId);
      expect(eventData.consentId).toBe(consentId);
      expect(eventData.consentType).toBe(consentType);
      expect(eventData.grantedBy).toBe(grantedBy);
      expect(eventData.grantedAt).toBeDefined();
    });

    it('should contain PHI', () => {
      const event = new PatientConsentGrantedEvent(
        patientId,
        consentId,
        consentType,
        grantedBy
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return patient ID', () => {
      const event = new PatientConsentGrantedEvent(
        patientId,
        consentId,
        consentType,
        grantedBy
      );

      expect(event.getPatientId()).toBe(patientId);
    });

    it('should return payload', () => {
      const event = new PatientConsentGrantedEvent(
        patientId,
        consentId,
        consentType,
        grantedBy
      );

      const payload = event.getPayload();

      expect(payload).toEqual(event.getEventData());
    });
  });

  describe('Common Event Properties', () => {
    it('all events should have occurredAt timestamp', () => {
      const beforeCreate = new Date();

      const events = [
        new PatientUpdatedEvent(patientId, 'update', 'user-123'),
        new PatientDeactivatedEvent(patientId, 'reason', 'admin-123'),
        new PatientLinkedEvent(patientId, 'PAT-002', 'refer', 'admin-123'),
        new PatientMergedEvent('PAT-002', patientId, 'duplicate', 'admin-123'),
        new PatientConsentGrantedEvent(patientId, 'consent-123', 'treatment', 'patient-123')
      ];

      const afterCreate = new Date();

      events.forEach(event => {
        expect(event.occurredAt).toBeDefined();
        expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });
    });

    it('all events should have Patient aggregate type', () => {
      const events = [
        new PatientUpdatedEvent(patientId, 'update', 'user-123'),
        new PatientDeactivatedEvent(patientId, 'reason', 'admin-123'),
        new PatientLinkedEvent(patientId, 'PAT-002', 'refer', 'admin-123'),
        new PatientMergedEvent('PAT-002', patientId, 'duplicate', 'admin-123'),
        new PatientConsentGrantedEvent(patientId, 'consent-123', 'treatment', 'patient-123')
      ];

      events.forEach(event => {
        expect(event.aggregateType).toBe('Patient');
      });
    });
  });
});

