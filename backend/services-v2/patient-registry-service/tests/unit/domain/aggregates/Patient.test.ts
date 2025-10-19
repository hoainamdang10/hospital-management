/**
 * Patient Aggregate Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { InsuranceInfo } from '../../../../src/domain/entities/InsuranceInfo';
import { EmergencyContact } from '../../../../src/domain/entities/EmergencyContact';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PatientStatus } from '../../../../src/domain/value-objects/PatientStatus';

describe('Patient Aggregate', () => {
  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Nguyễn Văn Test',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    ethnicity: 'Kinh',
    occupation: 'Software Engineer',
    maritalStatus: 'single'
  });

  const validContactInfo = ContactInfo.create({
    primaryPhone: '0901234567',
    email: 'test@example.com',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam',
      postalCode: '700000'
    },
    preferredContactMethod: 'phone'
  });

  const validBasicMedicalInfo = BasicMedicalInfo.create({
    bloodType: 'O+',
    knownAllergies: ['Penicillin'],
    emergencyMedicalInfo: 'No known chronic conditions'
  });

  const validInsuranceInfo = InsuranceInfo.create({
    provider: 'BHXH TP.HCM',
    policyNumber: 'HS1234567890123',
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2025-12-31'),
    coverageType: 'BHYT',
    isActive: true,
    isPrimary: true,
    isVietnameseInsurance: true,
    bhytNumber: 'HS1234567890123'
  });

  const validEmergencyContact = EmergencyContact.create(
    'Nguyễn Thị Emergency',
    'spouse',
    '0909876543',
    undefined,
    'emergency@example.com',
    '123 Test Street, District 1, Ho Chi Minh City',
    true
  );

  describe('register', () => {
    it('should create Patient with valid data', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [validEmergencyContact],
        'admin-user-id'
      );

      expect(patient).toBeInstanceOf(Patient);
      expect(patient.getPatientId()).toMatch(/^PAT-\d{6}-\d{3}$/);
      expect(patient.getUserId()).toBe('user-123');
      expect(patient.isActive()).toBe(true);
    });

    it('should generate PatientRegistered domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [validEmergencyContact],
        'admin-user-id'
      );

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('PatientRegistered');
    });

    it('should create Patient without optional fields', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient).toBeInstanceOf(Patient);
      expect(patient.getInsuranceInfo()).toBeUndefined();
      expect(patient.getEmergencyContacts()).toHaveLength(0);
    });

    it('should set status to ACTIVE by default', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.getStatus()).toBe(PatientStatus.ACTIVE);
    });
  });

  describe('updatePersonalInfo', () => {
    it('should update personal information', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn Updated',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      patient.updatePersonalInfo(newPersonalInfo, 'admin-user-id');

      expect(patient.getPersonalInfo().fullName).toBe('Nguyễn Văn Updated');
    });

    it('should generate PatientUpdated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn Updated',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      patient.updatePersonalInfo(newPersonalInfo, 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientUpdated');
    });
  });

  describe('updateContactInfo', () => {
    it('should update contact information', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const newContactInfo = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'newemail@example.com',
        address: {
          street: '456 New Street',
          ward: 'Ward 2',
          district: 'District 2',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam'
        },
        preferredContactMethod: 'email'
      });

      patient.updateContactInfo(newContactInfo, 'admin-user-id');

      expect(patient.getContactInfo().primaryPhone).toBe('0987654321');
    });
  });

  describe('deactivate', () => {
    it('should deactivate patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Patient requested deactivation', 'admin-user-id');

      expect(patient.getStatus()).toBe(PatientStatus.INACTIVE);
    });

    it('should generate PatientDeactivated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Patient requested deactivation', 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientDeactivated');
    });

    it('should throw error when deactivating already inactive patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Test', 'admin-user-id');

      expect(() => patient.deactivate('Test again', 'admin-user-id')).toThrow();
    });
  });

  describe('reactivate', () => {
    it('should reactivate inactive patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Test', 'admin-user-id');
      patient.reactivate('Reactivation requested', 'admin-user-id');

      expect(patient.getStatus()).toBe(PatientStatus.ACTIVE);
    });
  });

  describe('addEmergencyContact', () => {
    it('should add emergency contact', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.addEmergencyContact(validEmergencyContact, 'admin-user-id');

      expect(patient.getEmergencyContacts()).toHaveLength(1);
    });
  });

  describe('getPatientId', () => {
    it('should return patient ID as string', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const patientId = patient.getPatientId();
      expect(typeof patientId).toBe('string');
      expect(patientId).toMatch(/^PAT-\d{6}-\d{3}$/);
    });
  });

  describe('updateBasicMedicalInfo', () => {
    it('should update basic medical information', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const newBasicMedicalInfo = BasicMedicalInfo.create({
        bloodType: 'A+',
        knownAllergies: ['Aspirin', 'Peanuts'],
        emergencyMedicalInfo: 'Diabetes Type 2'
      });

      patient.updateBasicMedicalInfo(newBasicMedicalInfo, 'admin-user-id');

      expect(patient.getBasicMedicalInfo().bloodType).toBe('A+');
      expect(patient.getBasicMedicalInfo().knownAllergies).toContain('Aspirin');
    });

    it('should generate PatientUpdated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const newBasicMedicalInfo = BasicMedicalInfo.create({
        bloodType: 'A+',
        knownAllergies: [],
        emergencyMedicalInfo: undefined
      });

      patient.updateBasicMedicalInfo(newBasicMedicalInfo, 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientUpdated');
    });

    it('should throw error when updating inactive patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Test', 'admin-user-id');

      const newBasicMedicalInfo = BasicMedicalInfo.create({
        bloodType: 'A+',
        knownAllergies: [],
        emergencyMedicalInfo: undefined
      });

      expect(() => patient.updateBasicMedicalInfo(newBasicMedicalInfo, 'admin-user-id')).toThrow();
    });
  });

  describe('updateInsuranceInfo', () => {
    it('should update insurance information', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.updateInsuranceInfo(validInsuranceInfo, 'admin-user-id');

      expect(patient.getInsuranceInfo()).toBeDefined();
      expect(patient.getInsuranceInfo()?.policyNumber).toBe('HS1234567890123');
    });

    it('should allow setting insurance to undefined', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [],
        'admin-user-id'
      );

      patient.updateInsuranceInfo(undefined, 'admin-user-id');

      expect(patient.getInsuranceInfo()).toBeUndefined();
    });

    it('should generate PatientUpdated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.updateInsuranceInfo(validInsuranceInfo, 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientUpdated');
    });
  });

  describe('removeEmergencyContact', () => {
    it('should remove emergency contact', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [validEmergencyContact],
        'admin-user-id'
      );

      const contactId = patient.getEmergencyContacts()[0].getId();
      patient.removeEmergencyContact(contactId, 'admin-user-id');

      expect(patient.getEmergencyContacts()).toHaveLength(0);
    });

    it('should generate PatientUpdated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [validEmergencyContact],
        'admin-user-id'
      );

      const contactId = patient.getEmergencyContacts()[0].getId();
      patient.removeEmergencyContact(contactId, 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientUpdated');
    });

    it('should not throw error when removing non-existent contact', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(() => patient.removeEmergencyContact('non-existent-id', 'admin-user-id')).not.toThrow();
    });
  });

  describe('grantConsent', () => {
    it('should grant consent', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const consent = require('../../../../src/domain/entities/PatientConsent').PatientConsent.grant(
        patient.id,
        'treatment',
        'admin-user-id',
        new Date('2025-12-31'),
        'Consent for treatment'
      );

      patient.grantConsent(consent, 'admin-user-id');

      expect(patient.getConsents()).toHaveLength(1);
    });

    it('should generate PatientConsentGranted domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const consent = require('../../../../src/domain/entities/PatientConsent').PatientConsent.grant(
        patient.id,
        'treatment',
        'admin-user-id',
        new Date('2025-12-31'),
        'Consent for treatment'
      );

      patient.grantConsent(consent, 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientConsentGranted');
    });
  });

  describe('mergeInto', () => {
    it('should merge patient into master patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate record', 'admin-user-id');

      expect(patient.getStatus()).toBe(PatientStatus.MERGED);
      expect(patient.getMergedInto()?.equals(masterPatientId)).toBe(true);
    });

    it('should generate PatientMerged domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate record', 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientMerged');
    });

    it('should throw error when merging already merged patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate record', 'admin-user-id');

      const anotherMasterId = PatientId.generate();
      expect(() => patient.mergeInto(anotherMasterId, 'Another merge', 'admin-user-id')).toThrow('Bệnh nhân đã được gộp trước đó');
    });

    it('should throw error when merging deceased patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      const masterPatientId = PatientId.generate();
      expect(() => patient.mergeInto(masterPatientId, 'Duplicate record', 'admin-user-id')).toThrow('Không thể gộp bệnh nhân đã qua đời');
    });

    it('should throw error when merging patient into itself', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const patientId = patient.getPatientIdObject();
      expect(() => patient.mergeInto(patientId, 'Self merge', 'admin-user-id')).toThrow('Không thể gộp bệnh nhân vào chính nó');
    });
  });

  describe('linkTo', () => {
    it('should link to another patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const otherPatientId = PatientId.generate();
      patient.linkTo(otherPatientId, 'refer', 'admin-user-id');

      expect(patient.getLinks()).toHaveLength(1);
      expect(patient.getLinks()[0].linkType).toBe('refer');
    });

    it('should generate PatientLinked domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const otherPatientId = PatientId.generate();
      patient.linkTo(otherPatientId, 'seealso', 'admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientLinked');
    });

    it('should throw error when linking to itself', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const patientId = patient.getPatientIdObject();
      expect(() => patient.linkTo(patientId, 'refer', 'admin-user-id')).toThrow('Không thể liên kết bệnh nhân với chính nó');
    });

    it('should throw error when link already exists', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const otherPatientId = PatientId.generate();
      patient.linkTo(otherPatientId, 'refer', 'admin-user-id');

      expect(() => patient.linkTo(otherPatientId, 'refer', 'admin-user-id')).toThrow(/Liên kết .* đã tồn tại/);
    });
  });

  describe('markAsDeceased', () => {
    it('should mark patient as deceased', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      expect(patient.getStatus()).toBe(PatientStatus.DECEASED);
    });

    it('should generate PatientUpdated domain event', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      const events = patient.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(1);
      expect(events[events.length - 1].eventType).toBe('PatientUpdated');
    });

    it('should throw error when marking already deceased patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      expect(() => patient.markAsDeceased('admin-user-id')).toThrow('Bệnh nhân đã được đánh dấu qua đời');
    });
  });

  describe('status query methods', () => {
    it('isActive should return true for active patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.isActive()).toBe(true);
    });

    it('isInactive should return true for inactive patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.deactivate('Test', 'admin-user-id');

      expect(patient.isInactive()).toBe(true);
    });

    it('isMerged should return true for merged patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate', 'admin-user-id');

      expect(patient.isMerged()).toBe(true);
    });

    it('isDeceased should return true for deceased patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      expect(patient.isDeceased()).toBe(true);
    });
  });

  describe('insurance query methods', () => {
    it('hasBHYTInsurance should return true when patient has BHYT insurance', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [],
        'admin-user-id'
      );

      expect(patient.hasBHYTInsurance()).toBe(true);
    });

    it('hasBHYTInsurance should return false when patient has no insurance', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.hasBHYTInsurance()).toBe(false);
    });

    it('hasValidInsurance should return true when patient has valid insurance', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [],
        'admin-user-id'
      );

      expect(patient.hasValidInsurance()).toBe(true);
    });

    it('hasValidInsurance should return false when patient has no insurance', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.hasValidInsurance()).toBe(false);
    });
  });

  describe('collection query methods', () => {
    it('hasEmergencyContacts should return true when patient has emergency contacts', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [validEmergencyContact],
        'admin-user-id'
      );

      expect(patient.hasEmergencyContacts()).toBe(true);
    });

    it('hasEmergencyContacts should return false when patient has no emergency contacts', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.hasEmergencyContacts()).toBe(false);
    });

    it('hasActiveConsents should return true when patient has active consents', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const consent = require('../../../../src/domain/entities/PatientConsent').PatientConsent.grant(
        patient.id,
        'treatment',
        'admin-user-id',
        new Date('2025-12-31'),
        'Consent for treatment'
      );

      patient.grantConsent(consent, 'admin-user-id');

      expect(patient.hasActiveConsents()).toBe(true);
    });

    it('hasActiveConsents should return false when patient has no consents', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.hasActiveConsents()).toBe(false);
    });

    it('hasLinks should return true when patient has links', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const otherPatientId = PatientId.generate();
      patient.linkTo(otherPatientId, 'refer', 'admin-user-id');

      expect(patient.hasLinks()).toBe(true);
    });

    it('hasLinks should return false when patient has no links', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(patient.hasLinks()).toBe(false);
    });
  });

  describe('error handling for update operations', () => {
    it('should throw error when updating personal info on merged patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate', 'admin-user-id');

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Updated Name',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      expect(() => patient.updatePersonalInfo(newPersonalInfo, 'admin-user-id')).toThrow(/Không thể cập nhật bệnh nhân/);
    });

    it('should throw error when updating contact info on deceased patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      const newContactInfo = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'new@example.com',
        address: {
          street: '456 New Street',
          ward: 'Ward 2',
          district: 'District 2',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam'
        },
        preferredContactMethod: 'email'
      });

      expect(() => patient.updateContactInfo(newContactInfo, 'admin-user-id')).toThrow(/Không thể cập nhật bệnh nhân/);
    });

    it('should throw error when deactivating merged patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      const masterPatientId = PatientId.generate();
      patient.mergeInto(masterPatientId, 'Duplicate', 'admin-user-id');

      expect(() => patient.deactivate('Test', 'admin-user-id')).toThrow('Không thể vô hiệu hóa bệnh nhân đã được gộp');
    });

    it('should throw error when deactivating deceased patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      patient.markAsDeceased('admin-user-id');

      expect(() => patient.deactivate('Test', 'admin-user-id')).toThrow('Không thể vô hiệu hóa bệnh nhân đã qua đời');
    });

    it('should throw error when reactivating non-inactive patient', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'admin-user-id'
      );

      expect(() => patient.reactivate('Test', 'admin-user-id')).toThrow('Chỉ có thể kích hoạt lại bệnh nhân đã bị vô hiệu hóa');
    });
  });

  describe('getters', () => {
    it('should return copies of collections to prevent external mutation', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [validEmergencyContact],
        'admin-user-id'
      );

      const contacts1 = patient.getEmergencyContacts();
      const contacts2 = patient.getEmergencyContacts();

      expect(contacts1).not.toBe(contacts2); // Different array instances
      expect(contacts1).toEqual(contacts2); // Same content
    });

    it('should return all getters correctly', () => {
      const patient = Patient.register(
        'user-123',
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        validInsuranceInfo,
        [validEmergencyContact],
        'admin-user-id'
      );

      expect(patient.getUserId()).toBe('user-123');
      expect(patient.getPersonalInfo()).toBe(validPersonalInfo);
      expect(patient.getContactInfo()).toBe(validContactInfo);
      expect(patient.getBasicMedicalInfo()).toBe(validBasicMedicalInfo);
      expect(patient.getInsuranceInfo()).toBe(validInsuranceInfo);
      expect(patient.getEmergencyContacts()).toHaveLength(1);
      expect(patient.getConsents()).toHaveLength(0);
      expect(patient.getStatus()).toBe(PatientStatus.ACTIVE);
      expect(patient.getMergedInto()).toBeUndefined();
      expect(patient.getLinks()).toHaveLength(0);
    });
  });
});
