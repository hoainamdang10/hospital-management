/**
 * Test Data Factories - Clinical EMR Service
 * Factory functions to create test data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { MedicalRecordProps, MedicalRecordStatus } from '../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../src/domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../src/domain/value-objects/BasicVitalSigns';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../src/domain/value-objects/Diagnosis';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit, MedicationStatus } from '../../src/domain/value-objects/Medication';

/**
 * Factory for creating test medical record data
 */
export class MedicalRecordTestFactory {
  /**
   * Create a valid medical record props object for testing
   */
  static createValidMedicalRecordProps(overrides?: Partial<MedicalRecordProps>): MedicalRecordProps {
    const now = new Date();
    const recordId = RecordId.create(`MED-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-001`);
    
    return {
      recordId,
      patientId: global.testUtils.generatePatientId(),
      doctorId: global.testUtils.generateDoctorId(),
      appointmentId: global.testUtils.generateUUID(),
      visitDate: new Date(),
      symptoms: 'Test symptoms - fever, cough',
      examinationNotes: 'Test examination notes',
      
      // Enhanced with Value Objects
      diagnoses: [
        Diagnosis.create(
          'J00',
          'Acute nasopharyngitis [common cold]',
          DiagnosisCategory.PRIMARY,
          DiagnosisSeverity.MILD,
          DiagnosisStatus.CONFIRMED,
          global.testUtils.generateUUID(),
          { notes: 'Common cold symptoms' }
        ),
      ],
      medications: [
        Medication.create(
          'PARA-500',
          'Paracetamol',
          '500mg',
          DosageForm.TABLET,
          RouteOfAdministration.ORAL,
          '1 viên',
          'Three times daily',
          FrequencyUnit.THREE_TIMES_DAILY,
          'Take after meals',
          global.testUtils.generateUUID(),
          { duration: '5 days', status: MedicationStatus.ACTIVE }
        ),
      ],

      // Legacy fields for backward compatibility
      diagnosis: 'Common cold',
      treatment: 'Rest and hydration',
      medicationsLegacy: 'Paracetamol 500mg, 3 times daily',
      notes: 'Follow up in 5 days if symptoms persist',

      vitalSigns: BasicVitalSigns.create({
        temperature: 37.5,
        bloodPressure: '120/80',
        heartRate: 72,
        weight: 70,
        height: 170,
      }),
      status: MedicalRecordStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      createdBy: global.testUtils.generateUUID(),
      ...overrides,
    };
  }

  /**
   * Create minimal medical record props (required fields only)
   */
  static createMinimalMedicalRecordProps(overrides?: Partial<MedicalRecordProps>): MedicalRecordProps {
    const now = new Date();
    const recordId = RecordId.create(`MED-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-002`);
    
    return {
      recordId,
      patientId: global.testUtils.generatePatientId(),
      doctorId: global.testUtils.generateDoctorId(),
      visitDate: new Date(),
      diagnoses: [],
      medications: [],
      status: MedicalRecordStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      createdBy: global.testUtils.generateUUID(),
      ...overrides,
    };
  }

  /**
   * Create medical record props with FHIR compliance
   */
  static createFHIRCompliantMedicalRecordProps(overrides?: Partial<MedicalRecordProps>): MedicalRecordProps {
    const baseProps = this.createValidMedicalRecordProps();
    
    return {
      ...baseProps,
      fhirResourceId: `Patient/${global.testUtils.generateUUID()}`,
      fhirVersion: '4.0.1',
      fhirProfile: 'http://hl7.org/fhir/StructureDefinition/Encounter',
      ...overrides,
    };
  }

  /**
   * Create medical record props with Vietnamese medical standards
   */
  static createVietnameseMedicalRecordProps(overrides?: Partial<MedicalRecordProps>): MedicalRecordProps {
    const baseProps = this.createValidMedicalRecordProps();
    
    return {
      ...baseProps,
      vietnameseMedicalCode: 'BA-2025-001',
      specialtyCode: 'NOI',
      hospitalCode: 'BV001',
      ...overrides,
    };
  }
}

/**
 * Factory for creating test vital signs data
 */
export class VitalSignsTestFactory {
  /**
   * Create normal vital signs
   */
  static createNormalVitalSigns(overrides?: Partial<any>): BasicVitalSigns {
    return BasicVitalSigns.create({
      temperature: 36.8,
      bloodPressure: '120/80',
      heartRate: 70,
      weight: 70,
      height: 170,
      ...overrides,
    });
  }

  /**
   * Create abnormal vital signs (fever)
   */
  static createFeverVitalSigns(overrides?: Partial<any>): BasicVitalSigns {
    return BasicVitalSigns.create({
      temperature: 38.5,
      bloodPressure: '130/85',
      heartRate: 90,
      weight: 70,
      height: 170,
      ...overrides,
    });
  }
}

/**
 * Factory for creating test diagnosis data
 */
export class DiagnosisTestFactory {
  /**
   * Create a common cold diagnosis
   */
  static createCommonColdDiagnosis(): Diagnosis {
    return Diagnosis.create(
      'J00',
      'Acute nasopharyngitis [common cold]',
      DiagnosisCategory.PRIMARY,
      DiagnosisSeverity.MILD,
      DiagnosisStatus.CONFIRMED,
      global.testUtils.generateUUID(),
      { notes: 'Common cold symptoms' }
    );
  }

  /**
   * Create a hypertension diagnosis
   */
  static createHypertensionDiagnosis(): Diagnosis {
    return Diagnosis.create(
      'I10',
      'Essential (primary) hypertension',
      DiagnosisCategory.PRIMARY,
      DiagnosisSeverity.MODERATE,
      DiagnosisStatus.CONFIRMED,
      global.testUtils.generateUUID(),
      { notes: 'Essential hypertension' }
    );
  }

  /**
   * Create a diabetes diagnosis
   */
  static createDiabetesDiagnosis(): Diagnosis {
    return Diagnosis.create(
      'E11',
      'Type 2 diabetes mellitus',
      DiagnosisCategory.PRIMARY,
      DiagnosisSeverity.MODERATE,
      DiagnosisStatus.CONFIRMED,
      global.testUtils.generateUUID(),
      { notes: 'Type 2 diabetes mellitus without complications' }
    );
  }
}

/**
 * Factory for creating test medication data
 */
export class MedicationTestFactory {
  /**
   * Create a paracetamol medication
   */
  static createParacetamolMedication(): Medication {
    return Medication.create(
      'PARA-500',
      'Paracetamol',
      '500mg',
      DosageForm.TABLET,
      RouteOfAdministration.ORAL,
      '1 viên',
      'Three times daily',
      FrequencyUnit.THREE_TIMES_DAILY,
      'Take after meals',
      global.testUtils.generateUUID(),
      {
        duration: '5 days',
        status: MedicationStatus.ACTIVE,
      }
    );
  }

  /**
   * Create an antibiotic medication
   */
  static createAntibioticMedication(): Medication {
    return Medication.create(
      'AMOX-500',
      'Amoxicillin',
      '500mg',
      DosageForm.CAPSULE,
      RouteOfAdministration.ORAL,
      '1 viên',
      'Three times daily',
      FrequencyUnit.THREE_TIMES_DAILY,
      'Take with food. Complete the full course.',
      global.testUtils.generateUUID(),
      {
        duration: '7 days',
        status: MedicationStatus.ACTIVE,
        sideEffects: ['Nausea', 'Diarrhea'],
      }
    );
  }

  /**
   * Create a blood pressure medication
   */
  static createBloodPressureMedication(): Medication {
    return Medication.create(
      'AMLO-5',
      'Amlodipine',
      '5mg',
      DosageForm.TABLET,
      RouteOfAdministration.ORAL,
      '1 viên',
      'Once daily',
      FrequencyUnit.ONCE_DAILY,
      'Take in the morning',
      global.testUtils.generateUUID(),
      {
        duration: '30 days',
        status: MedicationStatus.ACTIVE,
        specialInstructions: 'Monitor blood pressure regularly',
      }
    );
  }
}

/**
 * Factory for creating test Create Medical Record request data
 */
export class CreateMedicalRecordRequestFactory {
  /**
   * Create a valid request
   */
  static createValidRequest(overrides?: any): any {
    return {
      patientId: global.testUtils.generatePatientId(),
      doctorId: global.testUtils.generateDoctorId(),
      appointmentId: global.testUtils.generateUUID(),
      visitDate: new Date().toISOString(),
      createdBy: global.testUtils.generateUUID(),
      symptoms: 'Test symptoms',
      examinationNotes: 'Test examination',
      diagnosis: 'Test diagnosis',
      treatment: 'Test treatment',
      medications: 'Test medications',
      notes: 'Test notes',
      vitalSigns: {
        temperature: 36.8,
        bloodPressure: '120/80',
        heartRate: 70,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 70,
        height: 170,
      },
      ...overrides,
    };
  }
}

/**
 * Factory for creating mock repositories
 */
export class MockRepositoryFactory {
  /**
   * Create a mock medical record repository
   */
  static createMockMedicalRecordRepository(): any {
    return {
      save: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      findByAppointmentId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      exists: jest.fn(),
    };
  }

  /**
   * Create a mock event publisher
   */
  static createMockEventPublisher(): any {
    return {
      publish: jest.fn().mockResolvedValue(undefined),
      publishBatch: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
  }
}

/**
 * Export all factories
 */
export const TestFactories = {
  MedicalRecord: MedicalRecordTestFactory,
  VitalSigns: VitalSignsTestFactory,
  Diagnosis: DiagnosisTestFactory,
  Medication: MedicationTestFactory,
  CreateRequest: CreateMedicalRecordRequestFactory,
  MockRepository: MockRepositoryFactory,
};
