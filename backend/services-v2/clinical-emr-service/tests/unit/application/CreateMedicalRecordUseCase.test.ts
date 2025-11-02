/**
 * Unit Tests - CreateMedicalRecordUseCase
 * Tests for creating medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest, Clean Architecture, HIPAA
 */

import { CreateMedicalRecordUseCase } from '../../../src/application/use-cases/CreateMedicalRecordUseCase';
import { MedicalRecordAggregate } from '../../../src/domain/aggregates/clinical.aggregate';
import { TestFactories } from '../../helpers/test-factories';

describe('CreateMedicalRecordUseCase', () => {
  let useCase: CreateMedicalRecordUseCase;
  let mockRepository: any;
  let mockEventPublisher: any;

  beforeEach(() => {
    // Create mocks
    mockRepository = TestFactories.MockRepository.createMockMedicalRecordRepository();
    mockEventPublisher = TestFactories.MockRepository.createMockEventPublisher();
    
    // Create use case instance
    useCase = new CreateMedicalRecordUseCase(
      mockRepository,
      mockEventPublisher
    );
  });

  describe('execute - Happy Path', () => {
    it('should create medical record with valid data', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockResolvedValue(undefined);
      mockEventPublisher.publishBatch.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.recordId).toBeTruthy();
      expect(result.message).toContain('thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishBatch).toHaveBeenCalled();
    });

    it('should create medical record with minimal data', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        symptoms: undefined,
        examinationNotes: undefined,
        medications: undefined,
        notes: undefined,
        vitalSigns: undefined,
      });
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should include vital signs when provided', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        vitalSigns: {
          temperature: 37.5,
          bloodPressure: '120/80',
          heartRate: 72,
          weight: 70,
          height: 170,
        },
      });
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      const savedRecord = mockRepository.save.mock.calls[0][0];
      expect(savedRecord).toBeInstanceOf(MedicalRecordAggregate);
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when patientId is missing', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        patientId: '',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.field).toContain('patientId');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when doctorId is missing', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        doctorId: '',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.field).toContain('doctorId');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when visitDate is missing', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        visitDate: '',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when visitDate is invalid format', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        visitDate: 'invalid-date',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when createdBy is missing', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        createdBy: '',
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('execute - Repository Errors', () => {
    it('should handle repository save failure', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Lỗi khi tạo hồ sơ bệnh án');
    });

    it('should handle duplicate record error', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockRejectedValue(new Error('Hồ sơ đã tồn tại'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('đã tồn tại');
      expect(result.errors?.[0]?.code).toBe('RECORD_ALREADY_EXISTS');
    });
  });

  describe('execute - Event Publishing', () => {
    it('should publish domain events after successful creation', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockResolvedValue(undefined);
      mockEventPublisher.publishBatch.mockResolvedValue(undefined);

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockEventPublisher.publishBatch).toHaveBeenCalledTimes(1);
      const publishedEvents = mockEventPublisher.publishBatch.mock.calls[0][0];
      expect(Array.isArray(publishedEvents)).toBe(true);
      expect(publishedEvents.length).toBeGreaterThan(0);
    });

    it('should handle event publishing failure gracefully', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockResolvedValue(undefined);
      mockEventPublisher.publishBatch.mockRejectedValue(new Error('Event bus connection failed'));

      // Act & Assert
      // Should still complete but log warning about event failure
      await expect(useCase.execute(request)).rejects.toThrow();
    });
  });

  describe('execute - Vietnamese Healthcare Standards', () => {
    it('should accept Vietnamese patient ID format', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        patientId: 'PAT-202501-001',
      });
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept Vietnamese doctor ID format', async () => {
      // Arrange
      const request = TestFactories.CreateRequest.createValidRequest({
        doctorId: 'HOSP-DOC-202501-001',
      });
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('execute - HIPAA Compliance', () => {
    it('should include createdBy for audit trail', async () => {
      // Arrange
      const createdBy = global.testUtils.generateUUID();
      const request = TestFactories.CreateRequest.createValidRequest({ createdBy });
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.createdBy).toBe(createdBy);
    });

    it('should generate unique record ID for each record', async () => {
      // Arrange
      const request1 = TestFactories.CreateRequest.createValidRequest();
      const request2 = TestFactories.CreateRequest.createValidRequest();
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result1 = await useCase.execute(request1);
      const result2 = await useCase.execute(request2);

      // Assert
      expect(result1.recordId).not.toBe(result2.recordId);
    });
  });
});
