/**
 * Unit Tests - GetMedicalRecordUseCase
 * Tests for retrieving medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest, Clean Architecture, HIPAA
 */

import { GetMedicalRecordUseCase } from '../../../src/application/use-cases/GetMedicalRecordUseCase';
import { MedicalRecordAggregate, MedicalRecordStatus } from '../../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../../src/domain/value-objects/RecordId';
import { TestFactories } from '../../helpers/test-factories';

describe('GetMedicalRecordUseCase', () => {
  let useCase: GetMedicalRecordUseCase;
  let mockRepository: any;
  let testRecord: MedicalRecordAggregate;

  beforeEach(() => {
    // Create mocks
    mockRepository = TestFactories.MockRepository.createMockMedicalRecordRepository();
    
    // Create use case instance
    useCase = new GetMedicalRecordUseCase(mockRepository);

    // Create test medical record
    const props = TestFactories.MedicalRecord.createValidMedicalRecordProps();
    testRecord = MedicalRecordAggregate.create(
      props.recordId,
      props.patientId,
      props.doctorId,
      props.visitDate,
      props.createdBy,
      {
        symptoms: props.symptoms,
        diagnosis: props.diagnosis,
        treatment: props.treatment,
        notes: props.notes,
        vitalSigns: props.vitalSigns,
      }
    );
  });

  describe('execute - Happy Path', () => {
    it('should retrieve medical record with valid ID', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.data).toBeDefined();
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should include vital signs when requested', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.vitalSigns).toBeDefined();
    });

    it('should exclude vital signs when not requested', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: false,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.vitalSigns).toBeUndefined();
    });
  });

  describe('execute - Validation Failures', () => {
    it('should fail when recordId is missing', async () => {
      // Arrange
      const request = {
        recordId: '',
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when recordId format is invalid', async () => {
      // Arrange
      const request = {
        recordId: 'invalid-format',
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockRejectedValue(new Error('Định dạng RecordId không hợp lệ'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.code).toBe('INVALID_FORMAT');
    });

    it('should fail when requestedBy is missing', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: '',
        includeArchived: false,
        includeVitalSigns: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('execute - Record Not Found', () => {
    it('should return not found when record does not exist', async () => {
      // Arrange
      const request = {
        recordId: global.testUtils.generateMedicalRecordId(),
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
      expect(result.errors?.[0]?.code).toBe('MEDICAL_RECORD_NOT_FOUND');
    });
  });

  describe('execute - Archived Records', () => {
    it('should not return archived record when includeArchived is false', async () => {
      // Arrange
      const archivedRecord = {
        ...testRecord,
        isArchived: jest.fn().mockReturnValue(true),
        isDeleted: jest.fn().mockReturnValue(false),
      } as any;
      
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(archivedRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('lưu trữ');
      expect(result.errors?.[0]?.code).toBe('MEDICAL_RECORD_ARCHIVED');
    });

    it('should return archived record when includeArchived is true', async () => {
      // Arrange
      const archivedRecord = Object.assign(Object.create(Object.getPrototypeOf(testRecord)), testRecord, {
        isArchived: jest.fn().mockReturnValue(true),
        isDeleted: jest.fn().mockReturnValue(false),
      });
      
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: true,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(archivedRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('execute - Deleted Records', () => {
    it('should not return deleted record', async () => {
      // Arrange
      const deletedRecord = {
        ...testRecord,
        isArchived: jest.fn().mockReturnValue(false),
        isDeleted: jest.fn().mockReturnValue(true),
      } as any;
      
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(deletedRecord);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('đã bị xóa');
      expect(result.errors?.[0]?.code).toBe('MEDICAL_RECORD_DELETED');
    });
  });

  describe('authorize - Authorization Rules', () => {
    it('should authorize doctor who created the record', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.doctorId,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const authorized = await useCase.authorize(request, testRecord.doctorId);

      // Assert
      expect(authorized).toBe(true);
    });

    it('should authorize patient who owns the record', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.patientId,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const authorized = await useCase.authorize(request, testRecord.patientId);

      // Assert
      expect(authorized).toBe(true);
    });

    it('should authorize user who created the record', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const authorized = await useCase.authorize(request, testRecord.createdBy);

      // Assert
      expect(authorized).toBe(true);
    });

    it('should deny access to unauthorized user', async () => {
      // Arrange
      const unauthorizedUserId = global.testUtils.generateUUID();
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: unauthorizedUserId,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const authorized = await useCase.authorize(request, unauthorizedUserId);

      // Assert
      expect(authorized).toBe(false);
    });

    it('should deny access when requestedBy does not match userId', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.doctorId,
        includeArchived: false,
        includeVitalSigns: true,
      };
      const differentUserId = global.testUtils.generateUUID();
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const authorized = await useCase.authorize(request, differentUserId);

      // Assert
      expect(authorized).toBe(false);
    });
  });

  describe('authorizeWithRoles - Role-Based Access Control', () => {
    it('should authorize admin for any record', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: global.testUtils.generateUUID(),
        includeArchived: false,
        includeVitalSigns: true,
      };
      const userId = global.testUtils.generateUUID();
      const userRoles = ['admin'];

      // Act
      const authorized = await useCase.authorizeWithRoles(request, userId, userRoles);

      // Assert
      expect(authorized).toBe(true);
    });

    it('should authorize system_admin for any record', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: global.testUtils.generateUUID(),
        includeArchived: false,
        includeVitalSigns: true,
      };
      const userId = global.testUtils.generateUUID();
      const userRoles = ['system_admin'];

      // Act
      const authorized = await useCase.authorizeWithRoles(request, userId, userRoles);

      // Assert
      expect(authorized).toBe(true);
    });
  });

  describe('executeWithRoles - Enhanced Execution', () => {
    it('should execute successfully with admin role', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: global.testUtils.generateUUID(),
        includeArchived: false,
        includeVitalSigns: true,
      };
      const userId = global.testUtils.generateUUID();
      const userRoles = ['admin'];
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const result = await useCase.executeWithRoles(request, userId, userRoles);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should deny access for unauthorized user with no roles', async () => {
      // Arrange
      const unauthorizedUserId = global.testUtils.generateUUID();
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: unauthorizedUserId,
        includeArchived: false,
        includeVitalSigns: true,
      };
      const userRoles: string[] = [];
      mockRepository.findById.mockResolvedValue(testRecord);

      // Act
      const result = await useCase.executeWithRoles(request, unauthorizedUserId, userRoles);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('không có quyền');
      expect(result.errors?.[0]?.code).toBe('UNAUTHORIZED_ACCESS');
    });
  });

  describe('HIPAA Compliance', () => {
    it('should always return involvesPHI as true', () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };

      // Act
      const involvesPHI = useCase.involvesPHI(request);

      // Assert
      expect(involvesPHI).toBe(true);
    });

    it('should have correct required permissions', () => {
      // Act
      const permissions = useCase.getRequiredPermissions();

      // Assert
      expect(permissions).toContain('medical_record:read');
    });

    it('should have Vietnamese description for audit', () => {
      // Act
      const description = useCase.getDescription();

      // Assert
      expect(description).toBe('Xem thông tin hồ sơ bệnh án');
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository connection failure', async () => {
      // Arrange
      const request = {
        recordId: testRecord.recordId.value,
        requestedBy: testRecord.createdBy,
        includeArchived: false,
        includeVitalSigns: true,
      };
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Lỗi khi lấy thông tin hồ sơ bệnh án');
    });
  });
});
