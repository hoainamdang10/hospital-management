import {
  GetStaffByDepartmentRequest,
  GetStaffByDepartmentUseCase
} from '../../../../src/application/use-cases/GetStaffByDepartmentUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('GetStaffByDepartmentUseCase', () => {
  const baseRequest: GetStaffByDepartmentRequest = {
    departmentId: 'DEPT-CARD',
    includeInactive: false,
    requestedBy: 'admin-user',
    requestedByRole: 'admin'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: GetStaffByDepartmentUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new GetStaffByDepartmentUseCase(repository, logger);
    jest.clearAllMocks();
  });

  it('lấy danh sách nhân viên theo phòng ban thành công', async () => {
    const activeStaff = createTestStaff();
    const inactiveStaff = createTestStaff({
      aggregateId: 'staff-inactive',
      status: 'inactive'
    });

    repository.findByDepartment.mockResolvedValue([activeStaff, inactiveStaff]);

    const result = await useCase.execute({
      ...baseRequest,
      includeInactive: true
    });

    expect(result.success).toBe(true);
    expect(result.data?.department).toBe(baseRequest.departmentId);
    expect(result.data?.totalStaff).toBe(2);
    expect(result.data?.activeStaff).toBe(1);
    expect(result.data?.staff).toHaveLength(2);
    expect(result.data?.staff[0]).toEqual(
      expect.objectContaining({
        id: activeStaff.id,
        userId: activeStaff.userId,
        staffType: activeStaff.staffType,
        fullName: activeStaff.personalInfo.fullName,
        specializations: expect.any(Array),
        status: activeStaff.status,
        isActive: activeStaff.isActive
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Staff by department retrieved successfully',
      expect.objectContaining({
        departmentId: baseRequest.departmentId,
        totalStaff: 2,
        activeStaff: 1
      })
    );
  });

  it('lọc bỏ nhân viên inactive khi includeInactive = false', async () => {
    const activeStaff = createTestStaff();
    const inactiveStaff = createTestStaff({
      aggregateId: 'staff-inactive',
      status: 'inactive'
    });

    repository.findByDepartment.mockResolvedValue([activeStaff, inactiveStaff]);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.totalStaff).toBe(1);
    expect(result.data?.staff).toHaveLength(1);
    expect(result.data?.staff[0].id).toBe(activeStaff.id);
  });

  it('trả về lỗi khi dữ liệu không hợp lệ', async () => {
    const result = await useCase.execute({
      departmentId: '',
      includeInactive: false,
      requestedBy: '',
      requestedByRole: ''
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Yêu cầu không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'ID phòng ban không được để trống',
        'Thông tin người yêu cầu không được để trống',
        'Vai trò người yêu cầu không được để trống'
      ])
    );
    expect(repository.findByDepartment).not.toHaveBeenCalled();
  });

  it('trả về lỗi hệ thống khi repository ném lỗi', async () => {
    repository.findByDepartment.mockRejectedValue(new Error('Database timeout'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Lỗi hệ thống khi lấy danh sách nhân viên theo phòng ban');
    expect(logger.error).toHaveBeenCalledWith(
      'Error getting staff by department',
      expect.objectContaining({
        departmentId: baseRequest.departmentId,
        error: 'Database timeout'
      })
    );
  });
});
