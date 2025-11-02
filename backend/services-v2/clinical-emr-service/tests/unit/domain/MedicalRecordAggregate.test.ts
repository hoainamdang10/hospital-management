/**
 * Unit Tests - MedicalRecordAggregate
 * Tests for domain aggregate business logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest, DDD, Clean Architecture
 */

import { MedicalRecordAggregate, MedicalRecordStatus } from '../../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../../src/domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../../src/domain/value-objects/BasicVitalSigns';
import { Diagnosis } from '../../../src/domain/value-objects/Diagnosis';
import { Medication } from '../../../src/domain/value-objects/Medication';
import { TestFactories } from '../../helpers/test-factories';

describe('MedicalRecordAggregate', () => {
  let recordId: RecordId;
  let patientId: string;
  let doctorId: string;
  let createdBy: string;
  let visitDate: Date;

  beforeEach(() => {
    recordId = RecordId.generate();
    patientId = global.testUtils.generatePatientId();
    doctorId = global.testUtils.generateDoctorId();
    createdBy = global.testUtils.generateUUID();
    visitDate = new Date();
  });

  describe('create - Happy Path', () => {
    it('should create medical record with valid data', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        {
          symptoms: 'Test symptoms',
          diagnosis: 'Test diagnosis',
          treatment: 'Test treatment',
        }
      );

      // Assert
      expect(medicalRecord).toBeDefined();
      expect(medicalRecord.recordId).toBe(recordId);
      expect(medicalRecord.patientId).toBe(patientId);
      expect(medicalRecord.doctorId).toBe(doctorId);
      expect(medicalRecord.status).toBe(MedicalRecordStatus.ACTIVE);
    });

    it('should create medical record with minimal data', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord).toBeDefined();
      expect(medicalRecord.diagnoses).toEqual([]);
      expect(medicalRecord.medications).toEqual([]);
    });

    it('should create medical record with vital signs', () => {
      // Arrange
      const vitalSigns = TestFactories.VitalSigns.createNormalVitalSigns();

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { vitalSigns }
      );

      // Assert
      expect(medicalRecord.vitalSigns).toBeDefined();
      expect(medicalRecord.vitalSigns).toBe(vitalSigns);
    });

    it('should create medical record with diagnoses array', () => {
      // Arrange
      const diagnoses = [
        TestFactories.Diagnosis.createCommonColdDiagnosis(),
        TestFactories.Diagnosis.createHypertensionDiagnosis(),
      ];

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { diagnoses }
      );

      // Assert
      expect(medicalRecord.diagnoses).toHaveLength(2);
      expect(medicalRecord.diagnoses[0]).toBeInstanceOf(Diagnosis);
    });

    it('should create medical record with medications array', () => {
      // Arrange
      const medications = [
        TestFactories.Medication.createParacetamolMedication(),
        TestFactories.Medication.createAntibioticMedication(),
      ];

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { medications }
      );

      // Assert
      expect(medicalRecord.medications).toHaveLength(2);
      expect(medicalRecord.medications[0]).toBeInstanceOf(Medication);
    });

    it('should emit MedicalRecordCreatedEvent on creation', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { symptoms: 'Test symptoms' }
      );

      // Assert
      const events = medicalRecord.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('MedicalRecordCreated');
    });
  });

  describe('create - FHIR Compliance', () => {
    it('should auto-generate FHIR resource ID', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.fhirResourceId).toBe(`MedicalRecord/${recordId.value}`);
    });

    it('should set default FHIR version to 4.0.1', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.fhirVersion).toBe('4.0.1');
    });

    it('should set default FHIR profile', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.fhirProfile).toContain('StructureDefinition/MedicalRecord');
    });

    it('should accept custom FHIR profile', () => {
      // Arrange
      const customProfile = 'http://custom.fhir.profile/MedicalRecord';

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { fhirProfile: customProfile }
      );

      // Assert
      expect(medicalRecord.fhirProfile).toBe(customProfile);
    });
  });

  describe('create - Vietnamese Healthcare Standards', () => {
    it('should set Vietnamese medical code to record ID', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.vietnameseMedicalCode).toBe(recordId.value);
    });

    it('should accept specialty code', () => {
      // Arrange
      const specialtyCode = 'NOI'; // Nội khoa

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { specialtyCode }
      );

      // Assert
      expect(medicalRecord.specialtyCode).toBe(specialtyCode);
    });

    it('should accept hospital code', () => {
      // Arrange
      const hospitalCode = 'BV001';

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { hospitalCode }
      );

      // Assert
      expect(medicalRecord.hospitalCode).toBe(hospitalCode);
    });
  });

  describe('create - HIPAA Compliance (Access Logging)', () => {
    it('should initialize access log with creation entry', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.accessLog).toBeDefined();
      expect(medicalRecord.accessLog).toHaveLength(1);
      expect(medicalRecord.accessLog![0].accessedBy).toBe(createdBy);
      expect(medicalRecord.accessLog![0].accessType).toBe('write');
      expect(medicalRecord.accessLog![0].purpose).toContain('Tạo hồ sơ');
    });

    it('should set lastAccessedAt on creation', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.lastAccessedAt).toBeDefined();
      expect(medicalRecord.lastAccessedBy).toBe(createdBy);
    });

    it('should set createdBy and updatedBy to same user', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.createdBy).toBe(createdBy);
      expect(medicalRecord.updatedBy).toBe(createdBy);
    });
  });

  describe('create - Status Management', () => {
    it('should default to ACTIVE status', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.status).toBe(MedicalRecordStatus.ACTIVE);
    });

    it('should accept custom status', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { status: MedicalRecordStatus.DRAFT }
      );

      // Assert
      expect(medicalRecord.status).toBe(MedicalRecordStatus.DRAFT);
    });

    it('should support PENDING_REVIEW status', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { status: MedicalRecordStatus.PENDING_REVIEW }
      );

      // Assert
      expect(medicalRecord.status).toBe(MedicalRecordStatus.PENDING_REVIEW);
    });
  });

  describe('create - Timestamps', () => {
    it('should set createdAt timestamp', () => {
      // Arrange
      const beforeCreation = new Date();

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      const afterCreation = new Date();

      // Assert
      expect(medicalRecord.createdAt).toBeDefined();
      expect(medicalRecord.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(medicalRecord.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should set updatedAt to same as createdAt initially', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      expect(medicalRecord.updatedAt).toBeDefined();
      expect(medicalRecord.updatedAt.getTime()).toBeGreaterThanOrEqual(medicalRecord.createdAt.getTime());
    });
  });

  describe('create - Legacy Fields Support', () => {
    it('should support legacy diagnosis field', () => {
      // Arrange
      const diagnosis = 'Hypertension';

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { diagnosis }
      );

      // Assert
      expect(medicalRecord.diagnosis).toBe(diagnosis);
    });

    it('should support legacy treatment field', () => {
      // Arrange
      const treatment = 'Medication and rest';

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { treatment }
      );

      // Assert
      expect(medicalRecord.treatment).toBe(treatment);
    });

    it('should support legacy medications field', () => {
      // Arrange
      const medicationsLegacy = 'Paracetamol 500mg, 3 times daily';

      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { medicationsLegacy }
      );

      // Assert
      expect(medicalRecord.medicationsLegacy).toBe(medicationsLegacy);
    });
  });

  describe('Business Invariants', () => {
    it('should validate recordId is provided', () => {
      // Act & Assert
      expect(() => {
        MedicalRecordAggregate.create(
          null as any,
          patientId,
          doctorId,
          visitDate,
          createdBy
        );
      }).toThrow();
    });

    it('should validate patientId is provided', () => {
      // Act & Assert
      expect(() => {
        MedicalRecordAggregate.create(
          recordId,
          '',
          doctorId,
          visitDate,
          createdBy
        );
      }).toThrow();
    });

    it('should validate doctorId is provided', () => {
      // Act & Assert
      expect(() => {
        MedicalRecordAggregate.create(
          recordId,
          patientId,
          '',
          visitDate,
          createdBy
        );
      }).toThrow();
    });

    it('should validate visitDate is provided', () => {
      // Act & Assert
      expect(() => {
        MedicalRecordAggregate.create(
          recordId,
          patientId,
          doctorId,
          null as any,
          createdBy
        );
      }).toThrow();
    });

    it('should validate createdBy is provided', () => {
      // Act & Assert
      expect(() => {
        MedicalRecordAggregate.create(
          recordId,
          patientId,
          doctorId,
          visitDate,
          ''
        );
      }).toThrow();
    });
  });

  describe('Domain Events', () => {
    it('should have uncommitted events after creation', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      // Assert
      const events = medicalRecord.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should clear events after marking as committed', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy
      );

      medicalRecord.markEventsAsCommitted();

      // Assert
      const events = medicalRecord.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should include all required data in creation event', () => {
      // Act
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        patientId,
        doctorId,
        visitDate,
        createdBy,
        { symptoms: 'Test symptoms' }
      );

      // Assert
      const events = medicalRecord.getUncommittedEvents();
      const createdEvent = events[0];
      const eventData = createdEvent.getEventData();
      expect(createdEvent.aggregateId).toBe(recordId.value);
      expect(eventData).toHaveProperty('patientId', patientId);
      expect(eventData).toHaveProperty('doctorId', doctorId);
      expect(eventData).toHaveProperty('createdBy', createdBy);
    });
  });
});
