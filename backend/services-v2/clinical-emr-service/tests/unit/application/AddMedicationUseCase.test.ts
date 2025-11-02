/**
 * Unit Tests - AddMedicationUseCase
 * Tests for adding medications to medical records
 */

import { AddMedicationUseCase } from '../../../src/application/use-cases/AddMedicationUseCase';

describe('AddMedicationUseCase', () => {
  let useCase: AddMedicationUseCase;
  let mockRepository: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockEventBus = {
      publishBatch: jest.fn(),
    };
    useCase = new AddMedicationUseCase(mockRepository, mockEventBus);
  });

  describe('execute - Happy Path', () => {
    it('should add medication successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const mockRecord = {
        addMedication: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId,
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        frequency: '3 times daily',
        duration: '7 days',
        route: 'oral',
        prescribedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should support Vietnamese medication names', async () => {
      const mockRecord = {
        addMedication: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        medicationName: 'Paracetamol (Hạ sốt)',
        dosage: '500mg',
        frequency: 'Uống 3 lần/ngày',
        duration: '5 ngày',
        route: 'oral',
        prescribedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        prescribedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when medication name is missing', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        medicationName: '',
        dosage: '500mg',
        prescribedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
    });
  });

  describe('execute - Record Not Found', () => {
    it('should fail when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        prescribedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('NOT_FOUND');
    });
  });
});
