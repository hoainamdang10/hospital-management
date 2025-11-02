/**
 * Unit Tests - UpdateVitalSignsUseCase
 * Tests for updating vital signs
 */

import { UpdateVitalSignsUseCase } from '../../../src/application/use-cases/UpdateVitalSignsUseCase';

describe('UpdateVitalSignsUseCase', () => {
  let useCase: UpdateVitalSignsUseCase;
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
    useCase = new UpdateVitalSignsUseCase(mockRepository, mockEventBus);
  });

  describe('execute - Happy Path', () => {
    it('should update vital signs successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const mockRecord = {
        updateVitalSigns: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId,
        temperature: 37.5,
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        updatedBy: 'NURSE-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should update only provided vital signs', async () => {
      const mockRecord = {
        updateVitalSigns: jest.fn(),
        getUncommittedEvents: jest.fn().mockReturnValue([]),
        markEventsAsCommitted: jest.fn(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(mockRecord);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        temperature: 38.5,
        systolicBP: 130,
        diastolicBP: 85,
        updatedBy: 'NURSE-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        temperature: 37.5,
        updatedBy: 'NURSE-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should fail when temperature is invalid', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        temperature: 50.0,
        updatedBy: 'NURSE-001',
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
        temperature: 37.5,
        updatedBy: 'NURSE-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('NOT_FOUND');
    });
  });
});
