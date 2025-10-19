/**
 * PatientConsent Entity Tests
 * Comprehensive unit tests for PatientConsent entity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientConsent } from '@domain/entities/PatientConsent';
import { PatientId } from '@domain/value-objects/PatientId';

describe('PatientConsent Entity', () => {
  let patientId: PatientId;

  beforeEach(() => {
    patientId = PatientId.generate();
  });

  describe('grant', () => {
    it('should grant consent with full data', () => {
      const expiresAt = new Date('2025-12-31');
      const witnessId = 'witness-123';
      const notes = 'Patient consented to treatment';

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        witnessId,
        expiresAt,
        notes
      );

      expect(consent).toBeDefined();
      expect(consent.patientId).toBe(patientId);
      expect(consent.consentType).toBe('treatment');
      expect(consent.isActive).toBe(true);
      expect(consent.witnessId).toBe(witnessId);
      expect(consent.expiresAt).toBe(expiresAt);
      expect(consent.notes).toBe(notes);
      expect(consent.isGranted()).toBe(true);
    });

    it('should grant consent with minimal data', () => {
      const consent = PatientConsent.grant(patientId, 'hipaa');

      expect(consent).toBeDefined();
      expect(consent.patientId).toBe(patientId);
      expect(consent.consentType).toBe('hipaa');
      expect(consent.isActive).toBe(true);
      expect(consent.witnessId).toBeUndefined();
      expect(consent.expiresAt).toBeUndefined();
      expect(consent.notes).toBeUndefined();
    });

    it('should trim whitespace from consent type and notes', () => {
      const consent = PatientConsent.grant(
        patientId,
        '  treatment  ',
        undefined,
        undefined,
        '  Patient agreed  '
      );

      expect(consent.consentType).toBe('treatment');
      expect(consent.notes).toBe('Patient agreed');
    });

    it('should generate unique ID for each consent', () => {
      const consent1 = PatientConsent.grant(patientId, 'treatment');
      const consent2 = PatientConsent.grant(patientId, 'hipaa');

      expect(consent1.getId()).not.toBe(consent2.getId());
    });

    it('should set grantedAt timestamp', () => {
      const beforeGrant = new Date();
      const consent = PatientConsent.grant(patientId, 'treatment');
      const afterGrant = new Date();

      expect(consent.grantedAt.getTime()).toBeGreaterThanOrEqual(beforeGrant.getTime());
      expect(consent.grantedAt.getTime()).toBeLessThanOrEqual(afterGrant.getTime());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute consent from persistence data', () => {
      const props = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        patientId,
        consentType: 'treatment',
        isActive: true,
        grantedAt: new Date('2024-01-01'),
        witnessId: 'witness-123',
        expiresAt: new Date('2025-12-31'),
        notes: 'Test notes',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const consent = PatientConsent.reconstitute(props);

      expect(consent.getId()).toBe(props.id);
      expect(consent.patientId).toBe(props.patientId);
      expect(consent.consentType).toBe(props.consentType);
      expect(consent.isActive).toBe(props.isActive);
      expect(consent.witnessId).toBe(props.witnessId);
      expect(consent.notes).toBe(props.notes);
    });
  });

  describe('isGranted', () => {
    it('should return true for active consent without withdrawal', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.isGranted()).toBe(true);
    });

    it('should return false for withdrawn consent', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');
      consent.withdraw();

      expect(consent.isGranted()).toBe(false);
    });
  });

  describe('withdraw', () => {
    it('should withdraw active consent', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.isActive).toBe(true);
      expect(consent.withdrawnAt).toBeUndefined();

      consent.withdraw();

      expect(consent.isActive).toBe(false);
      expect(consent.withdrawnAt).toBeDefined();
      expect(consent.isGranted()).toBe(false);
    });

    it('should set withdrawnAt timestamp', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');
      const beforeWithdraw = new Date();
      
      consent.withdraw();
      const afterWithdraw = new Date();

      expect(consent.withdrawnAt).toBeDefined();
      expect(consent.withdrawnAt!.getTime()).toBeGreaterThanOrEqual(beforeWithdraw.getTime());
      expect(consent.withdrawnAt!.getTime()).toBeLessThanOrEqual(afterWithdraw.getTime());
    });
  });

  describe('isExpired', () => {
    it('should return false for consent without expiry date', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.isExpired()).toBe(false);
    });

    it('should return false for non-expired consent', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        futureDate
      );

      expect(consent.isExpired()).toBe(false);
    });

    it('should return true for expired consent', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        pastDate
      );

      expect(consent.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true for active non-expired consent', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        futureDate
      );

      expect(consent.isValid()).toBe(true);
    });

    it('should return false for withdrawn consent', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');
      consent.withdraw();

      expect(consent.isValid()).toBe(false);
    });

    it('should return false for expired consent', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        pastDate
      );

      expect(consent.isValid()).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return null for consent without expiry date', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.getDaysUntilExpiry()).toBeNull();
    });

    it('should calculate days until expiry correctly', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        futureDate
      );

      const days = consent.getDaysUntilExpiry();
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should return negative days for expired consent', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        pastDate
      );

      const days = consent.getDaysUntilExpiry();
      expect(days).toBeLessThan(0);
    });
  });

  describe('isExpiringWithin', () => {
    it('should return false for consent without expiry date', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.isExpiringWithin(30)).toBe(false);
    });

    it('should return true if expiring within specified days', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 15);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        futureDate
      );

      expect(consent.isExpiringWithin(30)).toBe(true);
    });

    it('should return false if not expiring within specified days', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 60);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        futureDate
      );

      expect(consent.isExpiringWithin(30)).toBe(false);
    });

    it('should return false for already expired consent', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        undefined,
        pastDate
      );

      expect(consent.isExpiringWithin(30)).toBe(false);
    });
  });

  describe('HIPAA specific methods', () => {
    it('should identify HIPAA consent', () => {
      const consent = PatientConsent.grant(patientId, 'hipaa');

      expect(consent.isHIPAAConsent()).toBe(true);
      expect(consent.isTreatmentConsent()).toBe(false);
      expect(consent.isResearchConsent()).toBe(false);
    });

    it('should identify data sharing as HIPAA consent', () => {
      const consent = PatientConsent.grant(patientId, 'data_sharing');

      expect(consent.isHIPAAConsent()).toBe(true);
    });

    it('should identify treatment consent', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      expect(consent.isTreatmentConsent()).toBe(true);
      expect(consent.isHIPAAConsent()).toBe(false);
      expect(consent.isResearchConsent()).toBe(false);
    });

    it('should identify research consent', () => {
      const consent = PatientConsent.grant(patientId, 'research');

      expect(consent.isResearchConsent()).toBe(true);
      expect(consent.isTreatmentConsent()).toBe(false);
      expect(consent.isHIPAAConsent()).toBe(false);
    });
  });

  describe('isHIPAACompliant', () => {
    it('should return true for valid HIPAA compliant consent', () => {
      const consent = PatientConsent.grant(patientId, 'hipaa');

      expect(consent.isHIPAACompliant()).toBe(true);
    });

    it('should return true for withdrawn consent (audit trail)', () => {
      const consent = PatientConsent.grant(patientId, 'hipaa');
      consent.withdraw();

      expect(consent.isHIPAACompliant()).toBe(true);
    });
  });

  describe('validate', () => {
    it('should not throw error for HIPAA compliant consent', () => {
      const consent = PatientConsent.grant(patientId, 'hipaa');

      expect(() => consent.validate()).not.toThrow();
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const expiresAt = new Date('2025-12-31');
      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        expiresAt,
        'Test notes'
      );

      const persistence = consent.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence.patient_id).toBe(patientId.value);
      expect(persistence.consent_type).toBe('treatment');
      expect(persistence.is_active).toBe(true);
      expect(persistence.granted_at).toBeDefined();
      expect(persistence.witness_id).toBe('witness-123');
      expect(persistence.expires_at).toBeDefined();
      expect(persistence.notes).toBe('Test notes');
      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });

    it('should handle withdrawn consent in persistence', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');
      consent.withdraw();

      const persistence = consent.toPersistence();

      expect(persistence.is_active).toBe(false);
      expect(persistence.withdrawn_at).toBeDefined();
    });
  });

  describe('getSummaryForLogging', () => {
    it('should return summary for logging', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');

      const summary = consent.getSummaryForLogging();

      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('patientId');
      expect(summary).toHaveProperty('consentType');
      expect(summary).toHaveProperty('isActive');
      expect(summary).toHaveProperty('isExpired');
      expect(summary).toHaveProperty('grantedAt');
    });

    it('should include withdrawnAt in summary if withdrawn', () => {
      const consent = PatientConsent.grant(patientId, 'treatment');
      consent.withdraw();

      const summary: any = consent.getSummaryForLogging();

      expect(summary.withdrawnAt).toBeDefined();
    });
  });
});

