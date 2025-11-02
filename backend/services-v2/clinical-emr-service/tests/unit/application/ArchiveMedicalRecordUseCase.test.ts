/**
 * Unit Tests - ArchiveMedicalRecordUseCase
 * Tests for archiving medical records
 */

import { ArchiveMedicalRecordUseCase } from '../../../src/application/use-cases/ArchiveMedicalRecordUseCase';
import { TestFactories } from '../../helpers/test-factories';

describe('ArchiveMedicalRecordUseCase', () => {
  let useCase: ArchiveMedicalRecordUseCase;
  let mockRepository: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };
    mockEventBus = {
      publishBatch: jest.fn(),
    };
    useCase = new ArchiveMedicalRecordUseCase(mockRepository, mockEventBus);
  });

  describe('execute - Happy Path', () => {
    it('should archive medical record successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.archive = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        archivedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should include archive reason when provided', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.archive = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        archivedBy: 'DOC-001',
        reason: 'Patient transferred',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.reason).toBe('Patient transferred');
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        archivedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('REQUIRED_FIELD');
    });

    it('should fail when archivedBy is missing', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        archivedBy: '',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('execute - Record Not Found', () => {
    it('should fail when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        archivedBy: 'DOC-001',
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('MEDICAL_RECORD_NOT_FOUND');
    });
  });

  describe('execute - Repository Errors', () => {
    it('should handle repository failure', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecord.createValid({ recordId });
      existingRecord.archive = jest.fn();
      existingRecord.getUncommittedEvents = jest.fn().mockReturnValue([]);
      mockRepository.findById.mockResolvedValue(existingRecord);
      mockRepository.update.mockRejectedValue(new Error('Database error'));
      
      const request = {
        recordId,
        archivedBy: 'DOC-001',
      };

      await expect(useCase.execute(request)).rejects.toThrow();
    });
  });
});
