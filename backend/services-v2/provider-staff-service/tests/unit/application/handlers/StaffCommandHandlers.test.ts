import {
  StaffCommandHandlers,
  RegisterStaffCommand,
  UpdateStaffStatusCommand
} from '../../../../src/application/handlers/StaffCommandHandlers';
import { StaffStatus } from '../../../../src/domain/aggregates/ProviderStaff';
import { createMockLogger } from '../../../helpers/mockFactories';

const buildHandlers = () => {
  const registerStaffUseCase = { execute: jest.fn() };
  const updateStaffProfileUseCase = { execute: jest.fn() };
  const activateStaffUseCase = { execute: jest.fn() };
  const suspendStaffUseCase = { execute: jest.fn() };
  const terminateStaffUseCase = { execute: jest.fn() };
  const addStaffCredentialUseCase = { execute: jest.fn() };
  const assignStaffToDepartmentUseCase = { execute: jest.fn() };
  const updateStaffScheduleUseCase = { execute: jest.fn() };
  const logger = createMockLogger();

  const handlers = new StaffCommandHandlers(
    registerStaffUseCase as any,
    updateStaffProfileUseCase as any,
    activateStaffUseCase as any,
    suspendStaffUseCase as any,
    terminateStaffUseCase as any,
    addStaffCredentialUseCase as any,
    assignStaffToDepartmentUseCase as any,
    updateStaffScheduleUseCase as any,
    logger
  );

  return {
    handlers,
    registerStaffUseCase,
    updateStaffProfileUseCase,
    activateStaffUseCase,
    suspendStaffUseCase,
    terminateStaffUseCase,
    addStaffCredentialUseCase,
    assignStaffToDepartmentUseCase,
    updateStaffScheduleUseCase,
    logger
  };
};

const buildRegisterCommand = (): RegisterStaffCommand => ({
  commandId: 'CMD-001',
  commandType: 'RegisterStaff',
  timestamp: new Date(),
  requestedBy: 'admin-user',
  data: {
    userId: 'user-123',
    staffType: 'doctor',
    personalInfo: {
      fullName: 'Dr. Test',
      dateOfBirth: '1985-01-01',
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnam',
      phoneNumber: '0901234567',
      email: 'doctor@test.vn',
      address: {
        street: '123 Test Street',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'Vietnam'
      }
    },
    professionalInfo: {
      title: 'Bác sĩ',
      department: 'Cardiology',
      position: 'Trưởng khoa',
      education: ['Đại học Y Hà Nội'],
      languages: ['Vietnamese', 'English']
    },
    workSchedule: {
      workingDays: ['monday', 'tuesday'],
      workingHours: { start: '08:00', end: '17:00' },
      timeZone: 'Asia/Ho_Chi_Minh',
      isFlexible: false
    },
    licenseNumber: 'MED-001',
    employmentType: 'full_time',
    hireDate: '2020-01-01',
    yearsOfExperience: 10,
    consultationFee: 500000,
    specializations: [{ code: 'CARD', name: 'Cardiology', isActive: true }],
    requestedBy: 'admin-user'
  }
});

describe('StaffCommandHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('xử lý lệnh RegisterStaff hợp lệ và gọi use case tương ứng', async () => {
    const {
      handlers,
      registerStaffUseCase,
      logger
    } = buildHandlers();

    const command = buildRegisterCommand();
    registerStaffUseCase.execute.mockResolvedValue({
      success: true,
      staffId: 'STF-001'
    });

    const result = await handlers.handleCommand(command);

    expect(registerStaffUseCase.execute).toHaveBeenCalledWith(command.data);
    expect(result).toEqual({ success: true, staffId: 'STF-001' });
    expect(logger.info).toHaveBeenCalledWith(
      'RegisterStaff command processed',
      expect.objectContaining({
        commandId: command.commandId,
        success: true,
        staffId: 'STF-001'
      })
    );
  });

  it('trả về lỗi validation khi RegisterStaff command thiếu dữ liệu', async () => {
    const { handlers, registerStaffUseCase } = buildHandlers();

    const invalidCommand: RegisterStaffCommand = {
      commandId: 'CMD-002',
      commandType: 'RegisterStaff',
      timestamp: new Date(),
      requestedBy: 'admin-user',
      data: {} as any
    };

    const result = await handlers.handleCommand(invalidCommand);

    expect(result).toEqual({
      success: false,
      message: 'Cấu trúc lệnh đăng ký nhân viên không hợp lệ'
    });
    expect(registerStaffUseCase.execute).not.toHaveBeenCalled();
  });

  it('chuyển trạng thái nhân viên và gọi đúng use case', async () => {
    const {
      handlers,
      activateStaffUseCase,
      suspendStaffUseCase,
      terminateStaffUseCase
    } = buildHandlers();

    const baseCommand: UpdateStaffStatusCommand = {
      commandId: 'CMD-STATUS',
      commandType: 'UpdateStaffStatus',
      timestamp: new Date(),
      requestedBy: 'admin',
      data: {
        staffId: 'STF-123',
        reason: 'policy',
        requestedBy: 'admin',
        requestedByRole: 'ADMIN',
        newStatus: 'active' as StaffStatus
      }
    };

    await handlers.handleCommand(baseCommand);
    expect(activateStaffUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ staffId: 'STF-123' })
    );

    activateStaffUseCase.execute.mockClear();

    await handlers.handleCommand({
      ...baseCommand,
      data: { ...baseCommand.data, newStatus: 'suspended' as StaffStatus }
    });
    expect(suspendStaffUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: 'STF-123',
        reason: 'policy'
      })
    );

    await handlers.handleCommand({
      ...baseCommand,
      data: {
        ...baseCommand.data,
        newStatus: 'terminated' as StaffStatus
      }
    });
    expect(terminateStaffUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        staffId: 'STF-123',
        requestedBy: 'admin'
      })
    );
  });

  it('trả về lỗi khi cập nhật trạng thái với giá trị không hợp lệ', async () => {
    const { handlers } = buildHandlers();

    const command: UpdateStaffStatusCommand = {
      commandId: 'CMD-INVALID',
      commandType: 'UpdateStaffStatus',
      timestamp: new Date(),
      requestedBy: 'admin',
      data: {
        staffId: 'STF-999',
        newStatus: 'unknown' as StaffStatus,
        reason: 'n/a',
        requestedBy: 'admin',
        requestedByRole: 'ADMIN'
      }
    };

    const result = await handlers.handleCommand(command);

    expect(result).toEqual({
      success: false,
      message: 'Trạng thái không hợp lệ: unknown'
    });
  });

  it('ghi log cảnh báo khi gặp command không được hỗ trợ', async () => {
    const { handlers, logger } = buildHandlers();

    const command: any = {
      commandId: 'CMD-UNKNOWN',
      commandType: 'Unsupported',
      timestamp: new Date(),
      requestedBy: 'admin',
      data: {}
    };

    const result = await handlers.handleCommand(command as any);

    expect(result).toEqual({
      success: false,
      message: 'Loại lệnh không được hỗ trợ'
    });
    expect(logger.warn).toHaveBeenCalledWith('Unknown command type', {
      commandType: 'Unsupported',
      commandId: 'CMD-UNKNOWN'
    });
  });

  it('trả về trạng thái health check', () => {
    const { handlers } = buildHandlers();
    const status = handlers.getStatus();

    expect(status.handlerName).toBe('StaffCommandHandlers');
    expect(status.supportedCommands).toContain('RegisterStaff');
    expect(status.isHealthy).toBe(true);
  });
});
