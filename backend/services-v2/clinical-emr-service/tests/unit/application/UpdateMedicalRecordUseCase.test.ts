/**
 * Unit Tests - UpdateMedicalRecordUseCase
 * Tests for updating medical records
 */

import { UpdateMedicalRecordUseCase } from '../../../src/application/use-cases/UpdateMedicalRecordUseCase';
import * as TestFactories from '../../helpers/test-factories';

describe('UpdateMedicalRecordUseCase', () => {
  let useCase: UpdateMedicalRecordUseCase;
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
    useCase = new UpdateMedicalRecordUseCase(mockRepository, mockEventBus);
  });

  describe('execute - Happy Path', () => {
    it('should update medical record successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.update = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        diagnosis: 'Updated diagnosis',
        updatedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should update vital signs', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.update = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        vitalSigns: TestFactories.VitalSigns.createValid(),
        updatedBy: 'NURSE-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });

    it('should update treatment plan', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.update = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        treatment: 'Updated treatment plan',
        medications: ['Amoxicillin 500mg'],
        updatedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        diagnosis: 'Updated diagnosis',
        updatedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('INVALID_FORMAT');
    });

    it('should fail when updatedBy is missing', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        diagnosis: 'Updated diagnosis',
        updatedBy: '',
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
        diagnosis: 'Updated diagnosis',
        updatedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('NOT_FOUND');
    });
  });
});
