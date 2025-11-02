/**
 * CreatePrescriptionUseCase Tests
 * Unit tests for prescription creation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { CreatePrescriptionUseCase } from '../../../src/application/use-cases/CreatePrescriptionUseCase';
import { IPrescriptionRepository } from '../../../src/domain/repositories/IPrescriptionRepository';
import { CreatePrescriptionRequest } from '../../../src/application/dto/PrescriptionRequest';
import { MedicationDosageForm, MedicationRoute } from '../../../src/domain/aggregates/Prescription.aggregate';

describe('CreatePrescriptionUseCase', () => {
  let useCase: CreatePrescriptionUseCase;
  let mockRepository: jest.Mocked<IPrescriptionRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByMedicalRecordId: jest.fn(),
      findByPatientId: jest.fn(),
      findByPrescribedBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getNextSequence: jest.fn().mockResolvedValue(1),
    } as any;

    useCase = new CreatePrescriptionUseCase(mockRepository);
  });

  describe('Single Medication Prescription', () => {
    it('should create prescription with single medication', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'PARA-500',
            medicationName: 'Paracetamol',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'three_times_daily',
            duration: '5 ngày',
            quantity: 15,
            quantityUnit: 'viên',
            instructions: 'Uống sau ăn',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.medicationCount).toBe(1);
      expect(response.status).toBe('active');
      expect(response.message).toContain('thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create prescription with correct dosage form', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'SYRUP-001',
            medicationName: 'Cough Syrup',
            dosageForm: MedicationDosageForm.SYRUP,
            route: MedicationRoute.ORAL,
            dosage: '10mg/5ml, 5ml',
            frequency: 'three_times_daily',
            duration: '7 ngày',
            quantity: 2,
            quantityUnit: 'chai',
            instructions: 'Lắc đều trước khi uống',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.medicationCount).toBe(1);
    });
  });

  describe('Multiple Medications Prescription', () => {
    it('should create prescription with multiple medications', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'AMOX-500',
            medicationName: 'Amoxicillin',
            dosageForm: MedicationDosageForm.CAPSULE,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'three_times_daily',
            duration: '7 ngày',
            quantity: 21,
            quantityUnit: 'viên',
            instructions: 'Uống với thức ăn. Hoàn thành liệu trình.',
          },
          {
            medicationCode: 'PARA-500',
            medicationName: 'Paracetamol',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'as_needed',
            duration: '5 ngày',
            quantity: 10,
            quantityUnit: 'viên',
            instructions: 'Uống khi sốt hoặc đau',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.medicationCount).toBe(2);
      expect(response.status).toBe('active');
    });

    it('should handle complex medication regimen', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'AMLO-5',
            medicationName: 'Amlodipine',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '5mg, 1 viên',
            frequency: 'once_daily',
            duration: '30 ngày',
            quantity: 30,
            quantityUnit: 'viên',
            instructions: 'Uống vào buổi sáng',
          },
          {
            medicationCode: 'METF-500',
            medicationName: 'Metformin',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'twice_daily',
            duration: '30 ngày',
            quantity: 60,
            quantityUnit: 'viên',
            instructions: 'Uống cùng bữa ăn',
          },
          {
            medicationCode: 'ATOR-20',
            medicationName: 'Atorvastatin',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '20mg, 1 viên',
            frequency: 'once_daily',
            duration: '30 ngày',
            quantity: 30,
            quantityUnit: 'viên',
            instructions: 'Uống trước khi đi ngủ',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.medicationCount).toBe(3);
      expect(response.prescriptionId).toBeDefined();
    });
  });

  describe('Dosage Forms', () => {
    it('should handle tablet dosage form', async () => {
      const request = createPrescriptionRequest('tablet');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle capsule dosage form', async () => {
      const request = createPrescriptionRequest('capsule');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle syrup dosage form', async () => {
      const request = createPrescriptionRequest('syrup');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle injection dosage form', async () => {
      const request = createPrescriptionRequest('injection');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle topical dosage form', async () => {
      const request = createPrescriptionRequest('topical');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle inhaler dosage form', async () => {
      const request = createPrescriptionRequest('inhaler');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle suppository dosage form', async () => {
      const request = createPrescriptionRequest('suppository');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle patch dosage form', async () => {
      const request = createPrescriptionRequest('patch');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle drops dosage form', async () => {
      const request = createPrescriptionRequest('drops');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });
  });

  describe('Routes of Administration', () => {
    it('should handle oral route', async () => {
      const request = createPrescriptionWithRoute('oral');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle intravenous route', async () => {
      const request = createPrescriptionWithRoute('intravenous');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle intramuscular route', async () => {
      const request = createPrescriptionWithRoute('intramuscular');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle subcutaneous route', async () => {
      const request = createPrescriptionWithRoute('subcutaneous');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle topical route', async () => {
      const request = createPrescriptionWithRoute('topical');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });

    it('should handle inhalation route', async () => {
      const request = createPrescriptionWithRoute('inhalation');
      const response = await useCase.execute(request);
      expect(response.prescriptionId).toBeDefined();
    });
  });

  describe('Refills Management', () => {
    it('should create prescription with refills allowed', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        refillsAllowed: 3,
        medications: [
          {
            medicationCode: 'AMLO-5',
            medicationName: 'Amlodipine',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '5mg, 1 viên',
            frequency: 'once_daily',
            duration: '30 ngày',
            quantity: 30,
            quantityUnit: 'viên',
            instructions: 'Uống vào buổi sáng',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.status).toBe('active');
    });

    it('should create prescription with no refills (controlled substance)', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        refillsAllowed: 0,
        medications: [
          {
            medicationCode: 'MORPH-10',
            medicationName: 'Morphine',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '10mg, 1 viên',
            frequency: 'every_4_hours_as_needed',
            duration: '7 ngày',
            quantity: 42,
            quantityUnit: 'viên',
            instructions: 'Chỉ uống khi đau. Không lái xe.',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
    });
  });

  describe('Diagnosis Integration', () => {
    it('should create prescription with diagnosis', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        diagnosis: 'Type 2 Diabetes Mellitus',
        diagnosisCode: 'E11',
        medications: [
          {
            medicationCode: 'METF-500',
            medicationName: 'Metformin',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'twice_daily',
            duration: '30 ngày',
            quantity: 60,
            quantityUnit: 'viên',
            instructions: 'Uống cùng bữa ăn',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.message).toContain('thành công');
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: '',
        patientId: '',
        prescribedBy: '',
        prescribedDate: '',
        createdBy: '',
        medications: [],
      };

      await expect(useCase.execute(request)).rejects.toThrow('Validation failed');
    });

    it('should fail when medications array is empty', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [],
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    it('should accept medication with any dosage form value (no enum validation)', async () => {
      // DTO validation does NOT validate enum values, only required fields
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'TEST-001',
            medicationName: 'Test Med',
            dosageForm: 'invalid' as any,
            route: MedicationRoute.ORAL,
            dosage: '100mg, 1 viên',
            frequency: 'once_daily',
            duration: '5 ngày',
            quantity: 10,
            quantityUnit: 'viên',
            instructions: 'Test',
          },
        ],
      };

      const result = await useCase.execute(request);
      expect(result.prescriptionId).toBeDefined();
      expect(result.medicationCount).toBe(1);
    });

    it('should accept medication with any route value (no enum validation)', async () => {
      // DTO validation does NOT validate enum values, only required fields
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'TEST-001',
            medicationName: 'Test Med',
            dosageForm: MedicationDosageForm.TABLET,
            route: 'invalid' as any,
            dosage: '100mg, 1 viên',
            frequency: 'once_daily',
            duration: '5 ngày',
            quantity: 10,
            quantityUnit: 'viên',
            instructions: 'Test',
          },
        ],
      };

      const result = await useCase.execute(request);
      expect(result.prescriptionId).toBeDefined();
      expect(result.medicationCount).toBe(1);
    });
  });

  describe('Authorization', () => {
    it('should authorize prescriber to create prescription', async () => {
      const prescriberId = global.testUtils.generateDoctorId();
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: prescriberId,
        prescribedDate: new Date().toISOString(),
        createdBy: prescriberId,
        medications: [
          {
            medicationCode: 'PARA-500',
            medicationName: 'Paracetamol',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'three_times_daily',
            duration: '5 ngày',
            quantity: 15,
            quantityUnit: 'viên',
            instructions: 'Uống sau ăn',
          },
        ],
      };

      const authorized = await useCase.authorize(request, prescriberId);

      expect(authorized).toBe(true);
    });

    it('should not authorize different user', async () => {
      const prescriberId = global.testUtils.generateDoctorId();
      const differentUserId = global.testUtils.generateDoctorId();
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: prescriberId,
        prescribedDate: new Date().toISOString(),
        createdBy: prescriberId,
        medications: [],
      };

      const authorized = await useCase.authorize(request, differentUserId);

      expect(authorized).toBe(false);
    });
  });

  describe('PHI Protection', () => {
    it('should identify prescription as containing PHI', () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [],
      };

      const hasPHI = useCase.involvesPHI(request);

      expect(hasPHI).toBe(true);
    });

    it('should extract patient ID from request', () => {
      const patientId = global.testUtils.generatePatientId();
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId,
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [],
      };

      const extractedPatientId = useCase.getPatientId(request);

      expect(extractedPatientId).toBe(patientId);
    });
  });

  describe('Vietnamese Drug Codes', () => {
    it('should support Vietnamese drug codes', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        medications: [
          {
            medicationCode: 'VN-PARA-500',
            medicationName: 'Paracetamol (Việt Nam)',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '500mg, 1 viên',
            frequency: 'three_times_daily',
            duration: '5 ngày',
            quantity: 15,
            quantityUnit: 'viên',
            instructions: 'Uống sau ăn',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
    });

    it('should support Vietnamese instructions', async () => {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: global.testUtils.generateMedicalRecordId(),
        patientId: global.testUtils.generatePatientId(),
        prescribedBy: global.testUtils.generateDoctorId(),
        prescribedDate: new Date().toISOString(),
        createdBy: global.testUtils.generateUUID(),
        generalInstructions: 'Uống đủ nước, nghỉ ngơi nhiều',
        precautions: 'Tránh lái xe khi dùng thuốc',
        medications: [
          {
            medicationCode: 'TEST-001',
            medicationName: 'Test Med',
            dosageForm: MedicationDosageForm.TABLET,
            route: MedicationRoute.ORAL,
            dosage: '100mg, 1 viên',
            frequency: 'twice_daily',
            duration: '7 ngày',
            quantity: 14,
            quantityUnit: 'viên',
            instructions: 'Uống sau ăn, uống nhiều nước',
          },
        ],
      };

      const response = await useCase.execute(request);

      expect(response.prescriptionId).toBeDefined();
      expect(response.message).toContain('thành công');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValueOnce(new Error('Database error'));

      const request = createValidPrescriptionRequest();

      await expect(useCase.execute(request)).rejects.toThrow();
    });

    it('should handle sequence generation errors', async () => {
      mockRepository.getNextSequence.mockRejectedValueOnce(new Error('Sequence error'));

      const request = createValidPrescriptionRequest();

      await expect(useCase.execute(request)).rejects.toThrow();
    });
  });
});

// Helper functions
function createPrescriptionRequest(dosageForm: string): CreatePrescriptionRequest {
  return {
    medicalRecordId: global.testUtils.generateUUID(),
    patientId: global.testUtils.generatePatientId(),
    prescribedBy: global.testUtils.generateDoctorId(),
    prescribedDate: new Date().toISOString(),
    createdBy: global.testUtils.generateUUID(),
    medications: [
      {
        medicationCode: 'TEST-001',
        medicationName: 'Test Medication',
        dosageForm: dosageForm as any,
        route: MedicationRoute.ORAL,
        dosage: '100mg, 1 unit',
        frequency: 'once_daily',
        duration: '5 ngày',
        quantity: 10,
        quantityUnit: 'tablets',
        instructions: 'Test instructions',
      },
    ],
  };
}

function createPrescriptionWithRoute(route: string): CreatePrescriptionRequest {
  return {
    medicalRecordId: global.testUtils.generateUUID(),
    patientId: global.testUtils.generatePatientId(),
    prescribedBy: global.testUtils.generateDoctorId(),
    prescribedDate: new Date().toISOString(),
    createdBy: global.testUtils.generateUUID(),
    medications: [
      {
        medicationCode: 'TEST-001',
        medicationName: 'Test Medication',
        dosageForm: MedicationDosageForm.TABLET,
        route: route as any,
        dosage: '100mg, 1 unit',
        frequency: 'once_daily',
        duration: '5 ngày',
        quantity: 10,
        quantityUnit: 'tablets',
        instructions: 'Test instructions',
      },
    ],
  };
}

function createValidPrescriptionRequest(): CreatePrescriptionRequest {
  return {
    medicalRecordId: global.testUtils.generateUUID(),
    patientId: global.testUtils.generatePatientId(),
    prescribedBy: global.testUtils.generateDoctorId(),
    prescribedDate: new Date().toISOString(),
    createdBy: global.testUtils.generateUUID(),
    medications: [
      {
        medicationCode: 'PARA-500',
        medicationName: 'Paracetamol',
        dosageForm: MedicationDosageForm.TABLET,
        route: MedicationRoute.ORAL,
        dosage: '500mg, 1 viên',
        frequency: 'three_times_daily',
        duration: '5 ngày',
        quantity: 15,
        quantityUnit: 'viên',
        instructions: 'Uống sau ăn',
      },
    ],
  };
}
