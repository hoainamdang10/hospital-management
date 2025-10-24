/**
 * StaffCredentialVerifiedEvent Tests
 * @version 2.0.0
 */

import { StaffCredentialVerifiedEvent } from '../../../../src/domain/events/StaffCredentialVerifiedEvent';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';

describe('StaffCredentialVerifiedEvent', () => {
  const staffId = StaffId.create('DOC-CARD-202410-001');
  const credentialNumber = 'BYS-12345';
  const credentialType = 'license';
  const issuingAuthority = 'Bộ Y tế Việt Nam';

  describe('constructor', () => {
    it('should create event with credential info', () => {
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        credentialNumber,
        credentialType,
        issuingAuthority
      );

      expect(event.eventType).toBe('StaffCredentialVerified');
      expect(event.staffId).toBe(staffId);
      expect(event.credentialNumber).toBe(credentialNumber);
      expect(event.credentialType).toBe(credentialType);
      expect(event.issuingAuthority).toBe(issuingAuthority);
    });

    it('should include verifier information', () => {
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        credentialNumber,
        credentialType,
        issuingAuthority,
        'correlation-123',
        'causation-456',
        'admin-123'
      );

      expect(event.correlationId).toBe('correlation-123');
    });
  });

  describe('getEventData', () => {
    it('should return credential verification data', () => {
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        credentialNumber,
        credentialType,
        issuingAuthority
      );

      const data = event.getEventData();

      expect(data.credentialNumber).toBe(credentialNumber);
      expect(data.credentialType).toBe(credentialType);
      expect(data.issuingAuthority).toBe(issuingAuthority);
      expect(data).toHaveProperty('occurredAt');
    });
  });

  describe('containsPHI', () => {
    it('should return false', () => {
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        credentialNumber,
        credentialType,
        issuingAuthority
      );

      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null', () => {
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        credentialNumber,
        'license',
        credentialType,
        issuingAuthority
      );

      expect(event.getPatientId()).toBeNull();
    });
  });
});
