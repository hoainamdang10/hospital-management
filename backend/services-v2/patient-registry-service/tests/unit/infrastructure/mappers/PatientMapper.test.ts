/**
 * PatientMapper Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for Domain-Persistence mapping
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Mapper Pattern
 */

import { PatientMapper, PatientRecord, InsuranceRecord, EmergencyContactRecord, PatientConsentRecord, PatientLinkRecord } from '../../../../src/infrastructure/mappers/PatientMapper';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { InsuranceInfo } from '../../../../src/domain/entities/InsuranceInfo';
import { EmergencyContact } from '../../../../src/domain/entities/EmergencyContact';
import { PatientConsent } from '../../../../src/domain/entities/PatientConsent';
import { PatientLink } from '../../../../src/domain/value-objects/PatientLink';
import { PatientStatus } from '../../../../src/domain/value-objects/PatientStatus';
import { CommunicationPreference } from '../../../../src/domain/value-objects/CommunicationPreference';
import { v4 as uuidv4 } from 'uuid';

describe('PatientMapper', () => {
  // Test data
  let validPatientRecord: PatientRecord;
  let validInsuranceRecord: InsuranceRecord;
  let validEmergencyContactRecords: EmergencyContactRecord[];
  let validConsentRecords: PatientConsentRecord[];
  let validLinkRecords: PatientLinkRecord[];
  let testPatient: Patient;

  beforeEach(() => {
    // Create valid patient record
    validPatientRecord = {
      id: uuidv4(),
      patient_id: 'PAT-202510-001',
      user_id: uuidv4(),
      personal_info: {
        fullName: 'Nguyễn Văn Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        ethnicity: 'Kinh',
        occupation: 'Software Engineer',
        maritalStatus: 'single'
      },
      contact_info: {
        primaryPhone: '0901234567',
        email: 'test@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '123 Test Street',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam',
          postalCode: '700000'
        }
      },
      basic_medical_info: {
        bloodType: 'O+',
        knownAllergies: ['Penicillin'],
        emergencyMedicalInfo: 'No known conditions'
      },
      photo_url: 'https://example.com/photo.jpg',
      communication_preference: {
        language: 'vi',
        preferred: true,
        contactMethod: 'phone',
        timezone: 'Asia/Ho_Chi_Minh'
      },
      status: 'active',
      merged_into: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      created_by: 'admin-user',
      updated_by: 'admin-user'
    };

    // Create valid insurance record
    validInsuranceRecord = {
      id: uuidv4(),
      patient_id: 'PAT-202510-001',
      provider: 'BHYT',
      policy_number: 'BHYT123456789',
      group_number: 'GRP001',
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      coverage_type: 'BHYT',
      is_vietnamese_insurance: true,
      bhyt_number: 'BHYT123456789',
      is_primary: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    // Create valid emergency contact records
    validEmergencyContactRecords = [{
      id: uuidv4(),
      patient_id: 'PAT-202510-001',
      name: 'Nguyễn Thị Emergency',
      relationship: 'spouse',
      primary_phone: '0901234568',
      email: 'emergency@example.com',
      address: '456 Emergency Street',
      is_primary: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }];

    // Create valid consent records
    validConsentRecords = [{
      id: uuidv4(),
      patient_id: 'PAT-202510-001',
      consent_type: 'treatment',
      is_granted: true,
      granted_at: '2024-01-01T00:00:00.000Z',
      expires_at: '2025-01-01T00:00:00.000Z',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }];

    // Create valid link records
    validLinkRecords = [{
      id: uuidv4(),
      patient_id: 'PAT-202510-001',
      other_patient_id: 'PAT-202510-002',
      link_type: 'seealso',
      created_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system-test'
    }];

    // Create test patient domain object
    const personalInfo = PersonalInfo.create({
      fullName: 'Nguyễn Văn Test',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnamese',
      ethnicity: 'Kinh',
      occupation: 'Software Engineer',
      maritalStatus: 'single'
    });

    const contactInfo = ContactInfo.create({
      primaryPhone: '0901234567',
      email: 'test@example.com',
      preferredContactMethod: 'phone',
      address: {
        street: '123 Test Street',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam',
        postalCode: '700000'
      }
    });

    const basicMedicalInfo = BasicMedicalInfo.create({
      bloodType: 'O+',
      knownAllergies: ['Penicillin'],
      emergencyMedicalInfo: 'No known conditions'
    });

    testPatient = Patient.register(
      uuidv4(),
      personalInfo,
      contactInfo,
      basicMedicalInfo,
      undefined,
      [],
      'admin-user'
    );
  });

  describe('toDomain', () => {
    it('should map patient record to domain object successfully', () => {
      // Act
      const result = PatientMapper.toDomain(
        validPatientRecord,
        validInsuranceRecord,
        validEmergencyContactRecords,
        validConsentRecords,
        validLinkRecords
      );

      // Assert
      expect(result).toBeInstanceOf(Patient);
      expect(result.getPatientId()).toBe('PAT-202510-001');
      expect(result.getProps().userId).toBe(validPatientRecord.user_id);
      expect(result.getProps().personalInfo.fullName).toBe('Nguyễn Văn Test');
      expect(result.getProps().personalInfo.dateOfBirth).toEqual(new Date('1990-01-01'));
      expect(result.getProps().personalInfo.gender).toBe('male');
      expect(result.getProps().personalInfo.nationalId).toBe('001234567890');
      expect(result.getProps().contactInfo.primaryPhone).toBe('0901234567');
      expect(result.getProps().contactInfo.email).toBe('test@example.com');
      expect(result.getProps().basicMedicalInfo.bloodType).toBe('O+');
      expect(result.getProps().basicMedicalInfo.knownAllergies).toEqual(['Penicillin']);
      expect(result.getProps().status).toBe(PatientStatus.ACTIVE);
    });

    it('should map patient record without optional fields', () => {
      // Arrange
      const minimalPatientRecord = {
        ...validPatientRecord,
        photo_url: null,
        communication_preference: null,
        merged_into: null
      };

      // Act
      const result = PatientMapper.toDomain(
        minimalPatientRecord,
        null, // No insurance
        [], // No emergency contacts
        [], // No consents
        [] // No links
      );

      // Assert
      expect(result).toBeInstanceOf(Patient);
      expect(result.getProps().photoUrl).toBeUndefined();
      expect(result.getProps().communicationPreference).toBeUndefined();
      expect(result.getProps().mergedInto).toBeUndefined();
      expect(result.getProps().insuranceInfo).toBeUndefined();
      expect(result.getProps().emergencyContacts).toHaveLength(0);
      expect(result.getProps().consents).toHaveLength(0);
      expect(result.getProps().links).toHaveLength(0);
    });

    it('should map insurance information correctly', () => {
      // Act
      const result = PatientMapper.toDomain(
        validPatientRecord,
        validInsuranceRecord
      );

      // Assert
      const insuranceInfo = result.getProps().insuranceInfo;
      expect(insuranceInfo).toBeDefined();
      expect(insuranceInfo!.provider).toBe('BHYT');
      expect(insuranceInfo!.policyNumber).toBe('BHYT123456789');
      expect(insuranceInfo!.isVietnameseInsurance).toBe(true);
      expect(insuranceInfo!.bhytNumber).toBe('BHYT123456789');
      expect(insuranceInfo!.isPrimary).toBe(true);
    });

    it('should map emergency contacts correctly', () => {
      // Act
      const result = PatientMapper.toDomain(
        validPatientRecord,
        null,
        validEmergencyContactRecords
      );

      // Assert
      const emergencyContacts = result.getProps().emergencyContacts;
      expect(emergencyContacts).toHaveLength(1);
      expect(emergencyContacts[0].name).toBe('Nguyễn Thị Emergency');
      expect(emergencyContacts[0].relationship).toBe('spouse');
      expect(emergencyContacts[0].primaryPhone).toBe('0901234568');
      expect(emergencyContacts[0].isPrimary).toBe(true);
    });

    it('should map patient consents correctly', () => {
      // Act
      const result = PatientMapper.toDomain(
        validPatientRecord,
        null,
        [],
        validConsentRecords
      );

      // Assert
      const consents = result.getProps().consents;
      expect(consents).toHaveLength(1);
      expect(consents[0].consentType).toBe('treatment');
      expect(consents[0].consentType).toBe('treatment');
      expect(consents[0].isActive).toBe(true);
    });

    it('should map patient links correctly', () => {
      // Act
      const result = PatientMapper.toDomain(
        validPatientRecord,
        null,
        [],
        [],
        validLinkRecords
      );

      // Assert
      const links = result.getProps().links;
      expect(links).toHaveLength(1);
      expect(links[0].otherPatientId.getValue()).toBe('PAT-202510-002');
      expect(links[0].linkType).toBe('seealso');
    });

    it('should map communication preference correctly', () => {
      // Act
      const result = PatientMapper.toDomain(validPatientRecord);

      // Assert
      const commPref = result.getProps().communicationPreference;
      expect(commPref).toBeDefined();
      expect(commPref!.language).toBe('vi');
      expect(commPref!.preferred).toBe(true);
      expect(commPref!.contactMethod).toBe('phone');
      expect(commPref!.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('should handle invalid date formats gracefully', () => {
      // Arrange
      const invalidPatientRecord = {
        ...validPatientRecord,
        personal_info: {
          ...validPatientRecord.personal_info,
          dateOfBirth: 'invalid-date'
        }
      };

      // Act & Assert
      expect(() => PatientMapper.toDomain(invalidPatientRecord)).toThrow(
        'Failed to map patient to domain'
      );
    });

    it('should handle missing required fields', () => {
      // Arrange
      const incompletePatientRecord = {
        ...validPatientRecord,
        personal_info: {
          ...validPatientRecord.personal_info,
          fullName: undefined as any
        }
      };

      // Act & Assert
      expect(() => PatientMapper.toDomain(incompletePatientRecord)).toThrow(
        'Failed to map patient to domain'
      );
    });
  });

  describe('toPersistence', () => {
    it('should map patient domain object to persistence records successfully', () => {
      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.patientRecord).toBeDefined();
      expect(result.patientRecord.id).toBe(testPatient.id);
      expect(result.patientRecord.patient_id).toBe(testPatient.getPatientId());
      expect(result.patientRecord.user_id).toBe(testPatient.getProps().userId);

      // Check personal info mapping
      expect(result.patientRecord.personal_info).toBeDefined();
      expect(result.patientRecord.personal_info!.fullName).toBe('Nguyễn Văn Test');
      expect(result.patientRecord.personal_info!.dateOfBirth).toBe('1990-01-01');
      expect(result.patientRecord.personal_info!.gender).toBe('male');
      expect(result.patientRecord.personal_info!.nationalId).toBe('001234567890');
      expect(result.patientRecord.personal_info!.nationality).toBe('Vietnamese');

      // Check contact info mapping
      expect(result.patientRecord.contact_info).toBeDefined();
      expect(result.patientRecord.contact_info!.primaryPhone).toBe('0901234567');
      expect(result.patientRecord.contact_info!.email).toBe('test@example.com');
      expect(result.patientRecord.contact_info!.preferredContactMethod).toBe('phone');

      // Check basic medical info mapping
      expect(result.patientRecord.basic_medical_info).toBeDefined();
      expect(result.patientRecord.basic_medical_info!.bloodType).toBe('O+');
      expect(result.patientRecord.basic_medical_info!.knownAllergies).toEqual(['Penicillin']);

      // Check status and timestamps
      expect(result.patientRecord.status).toBe('active');
      expect(result.patientRecord.created_by).toBe('admin-user');
      expect(result.patientRecord.updated_by).toBe('admin-user');
    });

    it('should map patient with insurance information', () => {
      // Arrange
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHYT',
        policyNumber: 'BHYT123456789',
        groupNumber: 'GRP001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageType: 'BHYT',
        isVietnameseInsurance: true,
        bhytNumber: 'BHYT123456789',
        isPrimary: true,
        isActive: true
      });

      // Create patient with insurance
      const patientWithInsurance = Patient.register(
        uuidv4(),
        testPatient.getProps().personalInfo,
        testPatient.getProps().contactInfo,
        testPatient.getProps().basicMedicalInfo,
        insuranceInfo,
        [],
        'admin-user'
      );

      // Act
      const result = PatientMapper.toPersistence(patientWithInsurance);

      // Assert
      expect(result.insuranceRecord).toBeDefined();
      expect(result.insuranceRecord!.provider).toBe('BHYT');
      expect(result.insuranceRecord!.policy_number).toBe('BHYT123456789');
      expect(result.insuranceRecord!.group_number).toBe('GRP001');
      expect(result.insuranceRecord!.valid_from).toBe('2024-01-01');
      expect(result.insuranceRecord!.valid_to).toBe('2024-12-31');
      expect(result.insuranceRecord!.coverage_type).toBe('BHYT');
      expect(result.insuranceRecord!.is_vietnamese_insurance).toBe(true);
      expect(result.insuranceRecord!.bhyt_number).toBe('BHYT123456789');
      expect(result.insuranceRecord!.is_primary).toBe(true);
    });

    it('should map patient with emergency contacts', () => {
      // Arrange
      const emergencyContact = EmergencyContact.create(
        'Nguyễn Thị Emergency',
        'spouse',
        '0901234568',
        undefined,
        'emergency@example.com',
        '456 Emergency Street',
        true
      );

      const patientWithContacts = Patient.register(
        uuidv4(),
        testPatient.getProps().personalInfo,
        testPatient.getProps().contactInfo,
        testPatient.getProps().basicMedicalInfo,
        undefined,
        [emergencyContact],
        'admin-user'
      );

      // Act
      const result = PatientMapper.toPersistence(patientWithContacts);

      // Assert
      expect(result.emergencyContactRecords).toHaveLength(1);
      expect(result.emergencyContactRecords[0].name).toBe('Nguyễn Thị Emergency');
      expect(result.emergencyContactRecords[0].relationship).toBe('spouse');
      expect(result.emergencyContactRecords[0].primary_phone).toBe('0901234568');
      expect(result.emergencyContactRecords[0].email).toBe('emergency@example.com');
      expect(result.emergencyContactRecords[0].address).toBe('456 Emergency Street');
      expect(result.emergencyContactRecords[0].is_primary).toBe(true);
    });

    it('should map patient with consents', () => {
      // Arrange
      const patientId = testPatient.getPatientId();
      if (!patientId) throw new Error('Patient ID is required');

      const consent = PatientConsent.grant(
        PatientId.create(patientId),
        'treatment',
        'patient-user-id',
        new Date('2025-01-01'),
        'Consent for medical treatment'
      );

      // Add consent to patient
      testPatient.grantConsent(consent, 'admin-user');

      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.consentRecords).toHaveLength(1);
      expect(result.consentRecords[0].consent_type).toBe('treatment');
      expect(result.consentRecords[0].consent_type).toBe('treatment');
      expect(result.consentRecords[0].is_granted).toBe(true);
      expect(result.consentRecords[0].expires_at).toBe('2025-01-01T00:00:00.000Z');
      expect(result.consentRecords[0].is_active).toBe(true);
    });

    it('should map patient with links', () => {
      // Arrange
      const link = PatientLink.create(
        PatientId.create('PAT-202510-002'),
        'seealso',
        'admin-user'
      );

      // Add link to patient
      testPatient.linkTo(PatientId.create('PAT-202510-002'), 'seealso', 'admin-user');

      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.linkRecords).toHaveLength(1);
      expect(result.linkRecords[0].other_patient_id).toBe('PAT-202510-002');
      expect(result.linkRecords[0].link_type).toBe('seealso');
    });

    it('should handle patient without optional fields', () => {
      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.insuranceRecord).toBeUndefined();
      expect(result.emergencyContactRecords).toHaveLength(0);
      expect(result.consentRecords).toHaveLength(0);
      expect(result.linkRecords).toHaveLength(0);
      expect(result.patientRecord.photo_url).toBeNull();
      expect(result.patientRecord.communication_preference).toBeNull();
      expect(result.patientRecord.merged_into).toBeNull();
    });

    it('should format dates correctly', () => {
      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.patientRecord.personal_info!.dateOfBirth).toBe('1990-01-01');
      expect(result.patientRecord.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.patientRecord.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should map communication preference when present', () => {
      // Arrange
      const commPref = CommunicationPreference.create({
        language: 'vi',
        preferred: true,
        contactMethod: 'phone',
        timezone: 'Asia/Ho_Chi_Minh'
      });

      // Set communication preference
      testPatient.updateCommunicationPreference(commPref, 'admin-user');

      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.patientRecord.communication_preference).toBeDefined();
      expect(result.patientRecord.communication_preference!.language).toBe('vi');
      expect(result.patientRecord.communication_preference!.preferred).toBe(true);
      expect(result.patientRecord.communication_preference!.contactMethod).toBe('phone');
      expect(result.patientRecord.communication_preference!.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('should map merged patient correctly', () => {
      // Arrange
      const masterPatientId = PatientId.create('PAT-202510-999');
      testPatient.mergeInto(masterPatientId, 'Duplicate patient', 'admin-user');

      // Act
      const result = PatientMapper.toPersistence(testPatient);

      // Assert
      expect(result.patientRecord.merged_into).toBe('PAT-202510-999');
      expect(result.patientRecord.status).toBe('merged');
    });
  });

  describe('bidirectional mapping consistency', () => {
    it('should maintain data consistency in round-trip mapping', () => {
      // Arrange - Create a complex patient with all optional fields
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHYT',
        policyNumber: 'BHYT123456789',
        groupNumber: 'GRP001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageType: 'BHYT',
        isVietnameseInsurance: true,
        bhytNumber: 'BHYT123456789',
        isPrimary: true,
        isActive: true
      });

      const emergencyContact = EmergencyContact.create(
        'Nguyễn Thị Emergency',
        'spouse',
        '0901234568',
        undefined,
        'emergency@example.com',
        '456 Emergency Street',
        true
      );

      const complexPatient = Patient.register(
        uuidv4(),
        testPatient.getProps().personalInfo,
        testPatient.getProps().contactInfo,
        testPatient.getProps().basicMedicalInfo,
        insuranceInfo,
        [emergencyContact],
        'admin-user'
      );

      // Act - Convert to persistence and back to domain
      const persistenceData = PatientMapper.toPersistence(complexPatient);
      const reconstructedPatient = PatientMapper.toDomain(
        persistenceData.patientRecord as PatientRecord,
        persistenceData.insuranceRecord as InsuranceRecord,
        persistenceData.emergencyContactRecords as EmergencyContactRecord[],
        persistenceData.consentRecords as PatientConsentRecord[],
        persistenceData.linkRecords as PatientLinkRecord[]
      );

      // Assert - Key properties should be preserved
      expect(reconstructedPatient.getPatientId()).toBe(complexPatient.getPatientId());
      expect(reconstructedPatient.getProps().userId).toBe(complexPatient.getProps().userId);
      expect(reconstructedPatient.getProps().personalInfo.fullName).toBe(complexPatient.getProps().personalInfo.fullName);
      expect(reconstructedPatient.getProps().personalInfo.nationalId).toBe(complexPatient.getProps().personalInfo.nationalId);
      expect(reconstructedPatient.getProps().contactInfo.primaryPhone).toBe(complexPatient.getProps().contactInfo.primaryPhone);
      expect(reconstructedPatient.getProps().basicMedicalInfo.bloodType).toBe(complexPatient.getProps().basicMedicalInfo.bloodType);
      expect(reconstructedPatient.getProps().insuranceInfo?.policyNumber).toBe(complexPatient.getProps().insuranceInfo?.policyNumber);
      expect(reconstructedPatient.getProps().emergencyContacts).toHaveLength(1);
      expect(reconstructedPatient.getProps().emergencyContacts[0].name).toBe(complexPatient.getProps().emergencyContacts[0].name);
    });
  });
});
