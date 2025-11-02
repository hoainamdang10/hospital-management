/**
 * Unit Tests - AddDiagnosisUseCase
 * Tests for adding diagnosis to medical records
 */

import { AddDiagnosisUseCase } from '../../../src/application/use-cases/AddDiagnosisUseCase';

describe('AddDiagnosisUseCase', () => {
  let useCase: AddDiagnosisUseCase;
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
    useCase = new AddDiagnosisUseCase(mockRepository, mockEventBus);
  });

  describe('execute - Happy Path', () => {
    it('should add diagnosis successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const mockRecord = {
        addDiagnosis: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId,
        code: 'J00',
        display: 'Acute nasopharyngitis',
        category: 'primary' as any,
        severity: 'mild' as any,
        status: 'confirmed' as any,
        recordedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should support ICD-10 diagnosis codes', async () => {
      const mockRecord = {
        addDiagnosis: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        code: 'E11.9',
        display: 'Type 2 diabetes mellitus',
        category: 'secondary' as any,
        severity: 'moderate' as any,
        status: 'confirmed' as any,
        recordedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        code: 'J00',
        display: 'Common cold',
        category: 'primary' as any,
        severity: 'mild' as any,
        status: 'confirmed' as any,
        recordedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when diagnosis code is missing', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        code: '',
        display: 'Common cold',
        category: 'primary' as any,
        severity: 'mild' as any,
        status: 'confirmed' as any,
        recordedBy: 'DOC-001',
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
        code: 'J00',
        display: 'Common cold',
        category: 'primary' as any,
        severity: 'mild' as any,
        status: 'confirmed' as any,
        recordedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('NOT_FOUND');
    });
  });
});
