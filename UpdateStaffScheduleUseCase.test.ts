import { UpdateStaffScheduleUseCase, UpdateStaffScheduleRequest } from '../../../../src/application/use-cases/UpdateStaffScheduleUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

const baseRequest: UpdateStaffScheduleRequest = {
  staffId: 'DOC-CARD-202501-001',
  updatedBy: 'scheduler-001',
  updatedByRole: 'admin',
  workSchedule: {
    workingDays: ['monday', 'tuesday', 'wednesday'],
    workingHours: { start: '08:00', end: '17:00' },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  },
  effectiveDate: '2025-02-01'
};

describe('UpdateStaffScheduleUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: UpdateStaffScheduleUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new UpdateStaffScheduleUseCase(repository, logger);
  });

  it('cập nhật lịch làm việc thành công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe('aggregate-staff-test');
    expect(result.data?.effectiveDate).toBe(baseRequest.effectiveDate);
    expect(repository.save).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy thông tin nhân viên');
  });

  it('chặn role không được phép cập nhật lịch', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, userId: 'user-001' });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      updatedBy: 'user-002',
      updatedByRole: 'doctor'
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không có quyền cập nhật lịch làm việc của nhân viên này');
    expect(logger.warn).toHaveBeenCalledWith(
      'Unauthorized staff schedule update attempt',
      expect.objectContaining({
        staffId: staff.id,
        updatedByRole: 'doctor'
      })
    );
  });

  it('cho phép nhân viên tự đề xuất thay đổi lịch', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, userId: baseRequest.updatedBy });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue();

    const result = await useCase.execute({
      ...baseRequest,
      updatedBy: baseRequest.updatedBy,
      updatedByRole: 'staff'
    });

    expect(result.success).toBe(true);
  });

  it('trả về lỗi validation khi thiếu thông tin lịch', async () => {
    const result = await useCase.execute({
      staffId: baseRequest.staffId,
      updatedBy: 'scheduler-001',
      updatedByRole: 'admin'
    } as UpdateStaffScheduleRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Thông tin lịch làm việc không được để trống');
  });

  it('xử lý lỗi repository.save', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockRejectedValue(new Error('Database error'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Lỗi hệ thống khi cập nhật lịch làm việc');
    expect(logger.error).toHaveBeenCalledWith(
      'Error updating staff schedule',
      expect.objectContaining({
        staffId: baseRequest.staffId,
        error: 'Database error'
      })
    );
  });
});
