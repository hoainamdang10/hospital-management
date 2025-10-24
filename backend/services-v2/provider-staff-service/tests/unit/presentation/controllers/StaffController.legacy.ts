/**
 * StaffController Tests
 * Phase 3: Presentation Layer
 * @version 2.0.0
 */

import { Request, Response } from 'express';
import { StaffController } from '../../../../src/presentation/controllers/StaffController';
import { RegisterStaffUseCase } from '../../../../src/application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../../../src/application/use-cases/GetStaffProfileUseCase';
import { AssignStaffToDepartmentUseCase } from '../../../../src/application/use-cases/AssignStaffToDepartmentUseCase';
import { AddStaffCredentialUseCase } from '../../../../src/application/use-cases/AddStaffCredentialUseCase';
import { RemoveStaffCredentialUseCase } from '../../../../src/application/use-cases/RemoveStaffCredentialUseCase';
import { RenewStaffCredentialUseCase } from '../../../../src/application/use-cases/RenewStaffCredentialUseCase';
import { GetExpiringCredentialsUseCase } from '../../../../src/application/use-cases/GetExpiringCredentialsUseCase';
import { ActivateStaffUseCase } from '../../../../src/application/use-cases/ActivateStaffUseCase';
import { SuspendStaffUseCase } from '../../../../src/application/use-cases/SuspendStaffUseCase';
import { ReactivateStaffUseCase } from '../../../../src/application/use-cases/ReactivateStaffUseCase';
import { TerminateStaffUseCase } from '../../../../src/application/use-cases/TerminateStaffUseCase';
import { UpdateEmploymentStatusUseCase } from '../../../../src/application/use-cases/UpdateEmploymentStatusUseCase';
import { UpdateStaffScheduleUseCase } from '../../../../src/application/use-cases/UpdateStaffScheduleUseCase';
import { GetStaffSpecializationsUseCase } from '../../../../src/application/use-cases/GetStaffSpecializationsUseCase';
import { AddStaffSpecializationUseCase } from '../../../../src/application/use-cases/AddStaffSpecializationUseCase';
import { RemoveStaffSpecializationUseCase } from '../../../../src/application/use-cases/RemoveStaffSpecializationUseCase';
import { StaffCommandHandlers } from '../../../../src/application/handlers/StaffCommandHandlers';
import { StaffQueryHandlers } from '../../../../src/application/handlers/StaffQueryHandlers';
import { ILogger } from '../../../../src/application/interfaces/ILogger';

describe('StaffController', () => {
  let controller: StaffController;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRegisterStaffUseCase: jest.Mocked<RegisterStaffUseCase>;
  let mockGetStaffProfileUseCase: jest.Mocked<GetStaffProfileUseCase>;
  let mockAssignStaffToDepartmentUseCase: jest.Mocked<AssignStaffToDepartmentUseCase>;
  let mockAddStaffCredentialUseCase: jest.Mocked<AddStaffCredentialUseCase>;
  let mockRemoveStaffCredentialUseCase: jest.Mocked<RemoveStaffCredentialUseCase>;
  let mockRenewStaffCredentialUseCase: jest.Mocked<RenewStaffCredentialUseCase>;
  let mockGetExpiringCredentialsUseCase: jest.Mocked<GetExpiringCredentialsUseCase>;
  let mockActivateStaffUseCase: jest.Mocked<ActivateStaffUseCase>;
  let mockSuspendStaffUseCase: jest.Mocked<SuspendStaffUseCase>;
  let mockReactivateStaffUseCase: jest.Mocked<ReactivateStaffUseCase>;
  let mockTerminateStaffUseCase: jest.Mocked<TerminateStaffUseCase>;
  let mockUpdateEmploymentStatusUseCase: jest.Mocked<UpdateEmploymentStatusUseCase>;
  let mockUpdateStaffScheduleUseCase: jest.Mocked<UpdateStaffScheduleUseCase>;
  let mockGetStaffSpecializationsUseCase: jest.Mocked<GetStaffSpecializationsUseCase>;
  let mockAddStaffSpecializationUseCase: jest.Mocked<AddStaffSpecializationUseCase>;
  let mockRemoveStaffSpecializationUseCase: jest.Mocked<RemoveStaffSpecializationUseCase>;
  let mockStaffCommandHandlers: jest.Mocked<StaffCommandHandlers>;
  let mockStaffQueryHandlers: jest.Mocked<StaffQueryHandlers>;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Mock use cases
    mockRegisterStaffUseCase = { execute: jest.fn() } as any;
    mockGetStaffProfileUseCase = { execute: jest.fn() } as any;
    mockAssignStaffToDepartmentUseCase = { execute: jest.fn() } as any;
    mockAddStaffCredentialUseCase = { execute: jest.fn() } as any;
    mockRemoveStaffCredentialUseCase = { execute: jest.fn() } as any;
    mockRenewStaffCredentialUseCase = { execute: jest.fn() } as any;
    mockGetExpiringCredentialsUseCase = { execute: jest.fn() } as any;
    mockActivateStaffUseCase = { execute: jest.fn() } as any;
    mockSuspendStaffUseCase = { execute: jest.fn() } as any;
    mockReactivateStaffUseCase = { execute: jest.fn() } as any;
    mockTerminateStaffUseCase = { execute: jest.fn() } as any;
    mockUpdateEmploymentStatusUseCase = { execute: jest.fn() } as any;
    mockUpdateStaffScheduleUseCase = { execute: jest.fn() } as any;
    mockGetStaffSpecializationsUseCase = { execute: jest.fn() } as any;
    mockAddStaffSpecializationUseCase = { execute: jest.fn() } as any;
    mockRemoveStaffSpecializationUseCase = { execute: jest.fn() } as any;

    // Mock handlers
    mockStaffCommandHandlers = { handleQuery: jest.fn() } as any;
    mockStaffQueryHandlers = {
      handleQuery: jest.fn(),
      handleSearchStaff: jest.fn()
    } as any;

    // Create controller
    controller = new StaffController(
      mockLogger,
      mockRegisterStaffUseCase,
      mockGetStaffProfileUseCase,
      mockAssignStaffToDepartmentUseCase,
      mockStaffCommandHandlers,
      mockStaffQueryHandlers,
      mockAddStaffCredentialUseCase,
      mockRemoveStaffCredentialUseCase,
      mockRenewStaffCredentialUseCase,
      mockGetExpiringCredentialsUseCase,
      mockActivateStaffUseCase,
      mockSuspendStaffUseCase,
      mockReactivateStaffUseCase,
      mockTerminateStaffUseCase,
      mockUpdateEmploymentStatusUseCase,
      mockUpdateStaffScheduleUseCase,
      mockGetStaffSpecializationsUseCase,
      mockAddStaffSpecializationUseCase,
      mockRemoveStaffSpecializationUseCase
    );

    // Mock Request and Response
    mockRequest = {
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'test-agent';
        if (header === 'x-session-id') return 'test-session';
        return undefined;
      }),
      headers: {},
      user: { userId: 'user-admin-001', role: 'admin' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('registerStaff', () => {
    const validRequest = {
      userId: 'user-001',
      staffType: 'doctor',
      personalInfo: {
        fullName: 'Dr. Nguyen Van A',
        dateOfBirth: '1980-01-01',
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        phoneNumber: '0901234567',
        email: 'doctor@test.com',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh',
          province: 'Ho Chi Minh',
          country: 'Vietnam'
        }
      },
      professionalInfo: {
        title: 'Bác sĩ',
        department: 'Tim mạch',
        position: 'Bác sĩ điều trị',
        education: ['Doctor of Medicine'],
        languages: ['Vietnamese', 'English']
      },
      licenseNumber: 'BYS-12345',
      workSchedule: {
        workingDays: ['Monday', 'Tuesday', 'Wednesday'],
        workingHours: { start: '08:00', end: '17:00' },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: false
      },
      employmentType: 'full_time',
      hireDate: '2024-01-01',
      yearsOfExperience: 5
    };

    it('should register staff successfully', async () => {
      mockRequest.body = validRequest;

      mockRegisterStaffUseCase.execute.mockResolvedValue({
        success: true,
        staffId: 'DOC-CARD-202410-001',
        message: 'Đăng ký nhân viên thành công',
        data: {
          staff: {
            id: 'DOC-CARD-202410-001',
            userId: 'user-001',
            staffType: 'doctor',
            fullName: 'Dr. Nguyen Van A',
            licenseNumber: 'BYS-12345',
            registrationDate: new Date().toISOString(),
            isActive: true
          }
        }
      });

      await controller.registerStaff(mockRequest as Request, mockResponse as Response);

      expect(mockRegisterStaffUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Registering new staff',
        expect.objectContaining({
          userId: 'user-001',
          staffType: 'doctor'
        })
      );
    });

    it('should return 400 for validation errors', async () => {
      mockRequest.body = validRequest;

      mockRegisterStaffUseCase.execute.mockResolvedValue({
        success: false,
        message: 'Dữ liệu đăng ký không hợp lệ',
        errors: ['Họ tên không được để trống']
      });

      await controller.registerStaff(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle use case errors', async () => {
      mockRequest.body = validRequest;

      mockRegisterStaffUseCase.execute.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.registerStaff(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getStaffById', () => {
    it('should get staff by ID successfully', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };

      mockGetStaffProfileUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Success',
        data: {
          staff: {
            id: 'DOC-CARD-202410-001',
            userId: 'user-001',
            staffType: 'doctor',
            fullName: 'Dr. Test'
          }
        }
      } as any);

      await controller.getStaffById(mockRequest as Request, mockResponse as Response);

      expect(mockGetStaffProfileUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'DOC-CARD-202410-001',
          includeFullSchedule: true
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw NotFoundError when staff not found', async () => {
      mockRequest.params = { staffId: 'DOC-INVALID-001' };

      mockGetStaffProfileUseCase.execute.mockResolvedValue({
        success: false,
        message: 'Không tìm thấy nhân viên'
      } as any);

      await expect(
        controller.getStaffById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('addStaffCredential', () => {
    it('should add credential successfully', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.body = {
        credentialNumber: 'ACLS-2024-001',
        credentialType: 'ACLS',
        issuingAuthority: 'Bộ Y tế Việt Nam',
        issueDate: '2024-01-01',
        expiryDate: '2026-01-01'
      };

      mockAddStaffCredentialUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Thêm chứng chỉ thành công',
        data: {
          credentialId: 'cred-001'
        }
      });

      await controller.addStaffCredential(mockRequest as Request, mockResponse as Response);

      expect(mockAddStaffCredentialUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should validate credential data', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.body = {
        credentialType: 'ACLS'
        // Missing required fields
      };

      mockAddStaffCredentialUseCase.execute.mockResolvedValue({
        success: false,
        message: 'Dữ liệu chứng chỉ không hợp lệ',
        errors: ['Số chứng chỉ không được để trống']
      });

      await expect(
        controller.addStaffCredential(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow();
    });
  });

  describe('activateStaff', () => {
    it('should activate staff successfully', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };

      mockActivateStaffUseCase.execute.mockResolvedValue({
        staffId: 'DOC-CARD-202410-001',
        status: 'active',
        isActive: true,
        activatedAt: new Date()
      });

      await controller.activateStaff(mockRequest as Request, mockResponse as Response);

      expect(mockActivateStaffUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('suspendStaff', () => {
    it('should suspend staff with reason', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.body = {
        reason: 'Policy violation',
        suspensionStartDate: '2024-01-01',
        suspensionEndDate: '2024-06-01'
      };

      mockSuspendStaffUseCase.execute.mockResolvedValue({
        staffId: 'DOC-CARD-202410-001',
        status: 'suspended',
        isActive: false,
        suspendedAt: new Date()
      });

      await controller.suspendStaff(mockRequest as Request, mockResponse as Response);

      expect(mockSuspendStaffUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'DOC-CARD-202410-001',
          reason: 'Policy violation'
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getStaffSpecializations', () => {
    it('should get staff specializations', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.query = { includeInactive: 'false' };

      mockGetStaffSpecializationsUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Success',
        data: {
          specializations: [
            {
              id: 'spec-001',
              code: 'CARD',
              name: 'Tim mạch',
              isActive: true
            }
          ]
        }
      });

      await controller.getStaffSpecializations(mockRequest as Request, mockResponse as Response);

      expect(mockGetStaffSpecializationsUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addStaffSpecialization', () => {
    it('should add specialization successfully', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.body = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch',
        isActive: true
      };

      mockAddStaffSpecializationUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Thêm chuyên khoa thành công',
        data: {
          specializationId: 'spec-001'
        }
      });

      await controller.addStaffSpecialization(mockRequest as Request, mockResponse as Response);

      expect(mockAddStaffSpecializationUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('removeStaffSpecialization', () => {
    it('should remove specialization successfully', async () => {
      mockRequest.params = {
        staffId: 'DOC-CARD-202410-001',
        specializationCode: 'CARD'
      };

      mockRemoveStaffSpecializationUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Xóa chuyên khoa thành công'
      });

      await controller.removeStaffSpecialization(mockRequest as Request, mockResponse as Response);

      expect(mockRemoveStaffSpecializationUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('searchStaff', () => {
    it('should search staff with filters', async () => {
      mockRequest.query = {
        searchTerm: 'Tim mạch',
        staffType: 'doctor',
        page: '1',
        limit: '20'
      };

      mockStaffQueryHandlers.handleSearchStaff.mockResolvedValue({
        success: true,
        message: 'Success',
        data: {
          staff: [
            {
              id: 'DOC-CARD-202410-001',
              fullName: 'Dr. Test',
              staffType: 'doctor'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        }
      });

      await controller.searchStaff(mockRequest as Request, mockResponse as Response);

      expect(mockStaffQueryHandlers.handleSearchStaff).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateStaffSchedule', () => {
    it('should update staff schedule', async () => {
      mockRequest.params = { staffId: 'DOC-CARD-202410-001' };
      mockRequest.body = {
        workSchedule: {
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          workingHours: { start: '08:00', end: '17:00' },
          timeZone: 'Asia/Ho_Chi_Minh',
          isFlexible: false
        },
        effectiveDate: '2024-02-01'
      };

      mockUpdateStaffScheduleUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Cập nhật lịch làm việc thành công'
      });

      await controller.updateStaffSchedule(mockRequest as Request, mockResponse as Response);

      expect(mockUpdateStaffScheduleUseCase.execute).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
