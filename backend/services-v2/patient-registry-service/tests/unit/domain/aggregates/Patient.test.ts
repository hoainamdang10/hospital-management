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
});
