/**
 * Unit Tests - DeleteMedicalRecordUseCase
 * Tests for deleting medical records
 */

import { DeleteMedicalRecordUseCase } from '../../../src/application/use-cases/DeleteMedicalRecordUseCase';
import { TestFactories } from '../../helpers/test-factories';

describe('DeleteMedicalRecordUseCase', () => {
  let useCase: DeleteMedicalRecordUseCase;
  let mockRepository: any;
  let mockEventBus: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockRepository = TestFactories.MockRepository.createMockRepository();
    mockEventBus = TestFactories.MockEventBus.createMockEventBus();
    mockAuditService = { logCriticalAction: jest.fn() };
    useCase = new DeleteMedicalRecordUseCase(mockRepository, mockEventBus, mockAuditService);
  });

  describe('execute - Happy Path', () => {
    it('should delete medical record successfully', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecordAggregate.createValid({ recordId });
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        deletedBy: 'ADMIN-001',
        reason: 'Patient request',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(recordId);
      expect(mockAuditService.logCriticalAction).toHaveBeenCalled();
    });

    it('should soft delete by default', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecordAggregate.createValid({ recordId });
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        deletedBy: 'ADMIN-001',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      const request = {
        recordId: '',
        deletedBy: 'ADMIN-001',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('INVALID_FORMAT');
    });

    it('should fail when deletedBy is missing', async () => {
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        deletedBy: '',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(false);
    });
  });

  describe('execute - Record Not Found', () => {
    it('should fail when record does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        deletedBy: 'ADMIN-001',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('RECORD_NOT_FOUND');
    });
  });

  describe('execute - Authorization', () => {
    it('should require ADMIN role', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecordAggregate.createValid({ recordId });
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        deletedBy: 'DOC-001',
        role: 'DOCTOR',
      };

      const result = await useCase.execute(request);

      expect(result.isSuccess).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('execute - HIPAA Compliance', () => {
    it('should audit deletion attempt', async () => {
      const recordId = global.testUtils.generateMedicalRecordId();
      const existingRecord = TestFactories.MedicalRecordAggregate.createValid({ recordId });
      mockRepository.findById.mockResolvedValue(existingRecord);
      
      const request = {
        recordId,
        deletedBy: 'ADMIN-001',
        reason: 'Data retention policy',
      };

      await useCase.execute(request);

      expect(mockAuditService.logCriticalAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE_MEDICAL_RECORD',
          recordId,
          deletedBy: 'ADMIN-001',
        })
      );
    });
  });
});
