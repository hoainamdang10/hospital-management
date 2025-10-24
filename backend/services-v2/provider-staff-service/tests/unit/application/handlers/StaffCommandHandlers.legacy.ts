/**
 * StaffCommandHandlers Tests
 * @version 2.0.0
 */

import {
  StaffCommandHandlers,
  RegisterStaffCommand,
  UpdateStaffInfoCommand,
  UpdateStaffStatusCommand
} from '../../../../src/application/handlers/StaffCommandHandlers';
import { RegisterStaffUseCase } from '../../../../src/application/use-cases/RegisterStaffUseCase';
import { UpdateStaffProfileUseCase } from '../../../../src/application/use-cases/UpdateStaffProfileUseCase';
import { ActivateStaffUseCase } from '../../../../src/application/use-cases/ActivateStaffUseCase';
import { SuspendStaffUseCase } from '../../../../src/application/use-cases/SuspendStaffUseCase';
import { TerminateStaffUseCase } from '../../../../src/application/use-cases/TerminateStaffUseCase';
import { AddStaffCredentialUseCase } from '../../../../src/application/use-cases/AddStaffCredentialUseCase';
import { AssignStaffToDepartmentUseCase } from '../../../../src/application/use-cases/AssignStaffToDepartmentUseCase';
import { UpdateStaffScheduleUseCase } from '../../../../src/application/use-cases/UpdateStaffScheduleUseCase';
import { ILogger } from '../../../../src/application/interfaces/ILogger';

describe('StaffCommandHandlers', () => {
  let handlers: StaffCommandHandlers;
  let mockRegisterUseCase: jest.Mocked<RegisterStaffUseCase>;
  let mockUpdateProfileUseCase: jest.Mocked<UpdateStaffProfileUseCase>;
  let mockActivateUseCase: jest.Mocked<ActivateStaffUseCase>;
  let mockSuspendUseCase: jest.Mocked<SuspendStaffUseCase>;
  let mockTerminateUseCase: jest.Mocked<TerminateStaffUseCase>;
  let mockAddCredentialUseCase: jest.Mocked<AddStaffCredentialUseCase>;
  let mockAssignDepartmentUseCase: jest.Mocked<AssignStaffToDepartmentUseCase>;
  let mockUpdateScheduleUseCase: jest.Mocked<UpdateStaffScheduleUseCase>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRegisterUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdateProfileUseCase = {
      execute: jest.fn()
    } as any;

    mockActivateUseCase = {
      execute: jest.fn()
    } as any;

    mockSuspendUseCase = {
      execute: jest.fn()
    } as any;

    mockTerminateUseCase = {
      execute: jest.fn()
    } as any;

    mockAddCredentialUseCase = {
      execute: jest.fn()
    } as any;

    mockAssignDepartmentUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdateScheduleUseCase = {
      execute: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    handlers = new StaffCommandHandlers(
      mockRegisterUseCase,
      mockUpdateProfileUseCase,
      mockActivateUseCase,
      mockSuspendUseCase,
      mockTerminateUseCase,
      mockAddCredentialUseCase,
      mockAssignDepartmentUseCase,
      mockUpdateScheduleUseCase,
      mockLogger
    );
  });

  describe('handleRegisterStaff', () => {
    const validCommand: RegisterStaffCommand = {
      commandId: 'cmd-001',
      commandType: 'RegisterStaff',
      timestamp: new Date(),
      requestedBy: 'admin-001',
      data: {
        userId: 'user-001',
        staffType: 'doctor',
        personalInfo: {
          fullName: 'Dr. Test',
          dateOfBirth: '1980-01-01',
          gender: 'male',
          nationalId: '001234567890',
          nationality: 'Vietnamese',
          phoneNumber: '0901234567',
          email: 'test@test.com',
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
          languages: ['Vietnamese']
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
        yearsOfExperience: 5,
        requestedBy: 'admin-001'
      }
    };

    it('should handle register staff command successfully', async () => {
      mockRegisterUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Đăng ký thành công',
        staffId: 'DOC-CARD-202410-001'
      });

      const result = await handlers.handleRegisterStaff(validCommand);

      expect(result.success).toBe(true);
      expect(result.staffId).toBe('DOC-CARD-202410-001');
      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(validCommand.data);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should fail with invalid command structure', async () => {
      const invalidCommand = {
        ...validCommand,
        data: { ...validCommand.data, userId: '' }
      };

      const result = await handlers.handleRegisterStaff(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không hợp lệ');
      expect(mockRegisterUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle use case errors', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(new Error('Database error'));

      const result = await handlers.handleRegisterStaff(validCommand);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleUpdateStaffInfo', () => {
    const validCommand: UpdateStaffInfoCommand = {
      commandId: 'cmd-002',
      commandType: 'UpdateStaffInfo',
      timestamp: new Date(),
      requestedBy: 'admin-001',
      data: {
        staffId: 'DOC-CARD-202410-001',
        updates: {
          consultationFee: 500000
        },
        requestedBy: 'admin-001',
        requestedByRole: 'admin'
      }
    };

    it('should handle update staff info command successfully', async () => {
      mockUpdateProfileUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Cập nhật thành công'
      });

      const result = await handlers.handleUpdateStaffInfo(validCommand);

      expect(result.success).toBe(true);
      expect(mockUpdateProfileUseCase.execute).toHaveBeenCalled();
    });

    it('should fail with invalid command', async () => {
      const invalidCommand = {
        ...validCommand,
        data: { ...validCommand.data, staffId: '' }
      };

      const result = await handlers.handleUpdateStaffInfo(invalidCommand);

      expect(result.success).toBe(false);
    });
  });

  describe('handleUpdateStaffStatus', () => {
    it('should handle activate status', async () => {
      const command: UpdateStaffStatusCommand = {
        commandId: 'cmd-003',
        commandType: 'UpdateStaffStatus',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {
          staffId: 'DOC-CARD-202410-001',
          newStatus: 'active',
          reason: 'Reactivate',
          requestedBy: 'admin-001',
          requestedByRole: 'admin'
        }
      };

      mockActivateUseCase.execute.mockResolvedValue({} as any);

      const result = await handlers.handleUpdateStaffStatus(command);

      expect(result.success).toBe(true);
      expect(mockActivateUseCase.execute).toHaveBeenCalled();
    });

    it('should handle suspend status', async () => {
      const command: UpdateStaffStatusCommand = {
        commandId: 'cmd-004',
        commandType: 'UpdateStaffStatus',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {
          staffId: 'DOC-CARD-202410-001',
          newStatus: 'suspended',
          reason: 'Violation',
          requestedBy: 'admin-001',
          requestedByRole: 'admin'
        }
      };

      mockSuspendUseCase.execute.mockResolvedValue({} as any);

      const result = await handlers.handleUpdateStaffStatus(command);

      expect(result.success).toBe(true);
      expect(mockSuspendUseCase.execute).toHaveBeenCalled();
    });

    it('should handle terminated status', async () => {
      const command: UpdateStaffStatusCommand = {
        commandId: 'cmd-005',
        commandType: 'UpdateStaffStatus',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {
          staffId: 'DOC-CARD-202410-001',
          newStatus: 'terminated',
          reason: 'End contract',
          requestedBy: 'admin-001',
          requestedByRole: 'admin'
        }
      };

      mockTerminateUseCase.execute.mockResolvedValue({} as any);

      const result = await handlers.handleUpdateStaffStatus(command);

      expect(result.success).toBe(true);
      expect(mockTerminateUseCase.execute).toHaveBeenCalled();
    });

    it('should fail with invalid status', async () => {
      const command: UpdateStaffStatusCommand = {
        commandId: 'cmd-006',
        commandType: 'UpdateStaffStatus',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {
          staffId: 'DOC-CARD-202410-001',
          newStatus: 'invalid_status' as any,
          reason: 'Test',
          requestedBy: 'admin-001',
          requestedByRole: 'admin'
        }
      };

      const result = await handlers.handleUpdateStaffStatus(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không hợp lệ');
    });
  });

  describe('handleCommand', () => {
    it('should dispatch to correct handler', async () => {
      const command: RegisterStaffCommand = {
        commandId: 'cmd-007',
        commandType: 'RegisterStaff',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {
          userId: 'user-001',
          staffType: 'doctor',
          personalInfo: {} as any,
          professionalInfo: {} as any,
          licenseNumber: 'BYS-12345',
          workSchedule: {} as any,
          employmentType: 'full_time',
          hireDate: '2024-01-01',
          yearsOfExperience: 5,
          requestedBy: 'admin-001'
        }
      };

      mockRegisterUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Success',
        staffId: 'DOC-001'
      });

      await handlers.handleCommand(command);

      expect(mockRegisterUseCase.execute).toHaveBeenCalled();
    });

    it('should handle unknown command type', async () => {
      const invalidCommand = {
        commandId: 'cmd-008',
        commandType: 'UnknownCommand',
        timestamp: new Date(),
        requestedBy: 'admin-001',
        data: {}
      } as any;

      const result = await handlers.handleCommand(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không được hỗ trợ');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return handler status', () => {
      const status = handlers.getStatus();

      expect(status.handlerName).toBe('StaffCommandHandlers');
      expect(status.supportedCommands).toHaveLength(6);
      expect(status.isHealthy).toBe(true);
      expect(status.supportedCommands).toContain('RegisterStaff');
      expect(status.supportedCommands).toContain('UpdateStaffInfo');
    });
  });
});
