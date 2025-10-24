import { DeactivateStaffUseCase, DeactivateStaffRequest } from '../../../../src/application/use-cases/DeactivateStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('DeactivateStaffUseCase', () => {
  const baseRequest: DeactivateStaffRequest = {
    staffId: 'DOC-CARD-202501-001',
    reason: 'Nhân viên xin nghỉ việc',
    deactivatedBy: 'admin-001',
    deactivatedByRole: 'admin',
    notes: 'Đã bàn giao công việc'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: DeactivateStaffUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new DeactivateStaffUseCase(repository, logger);
  });

  it('deactivates active staff and lưu audit', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue(undefined);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Vô hiệu hóa nhân viên thành công');
    expect(result.data?.staffId).toBe('aggregate-staff-test');
    expect(repository.save).toHaveBeenCalledWith(staff);
    expect(logger.info).toHaveBeenCalledWith(
      'HIPAA Audit: Staff deactivation',
      expect.objectContaining({
        action: 'STAFF_DEACTIVATION',
        staffId: staff.id,
        deactivatedBy: baseRequest.deactivatedBy
      })
    );
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy thông tin nhân viên');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ngăn chặn tự vô hiệu hóa chính mình', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, userId: 'admin-001' });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      deactivatedBy: 'admin-001',
      deactivatedByRole: 'admin'
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không có quyền');
  });

  it('không cho phép role không hợp lệ', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      deactivatedByRole: 'doctor'
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không có quyền');
    expect(logger.warn).toHaveBeenCalledWith(
      'Unauthorized staff deactivation attempt',
      expect.objectContaining({
        staffId: staff.id,
        deactivatedByRole: 'doctor'
      })
    );
  });

  it('trả về lỗi validation khi lý do dưới 10 ký tự', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      reason: 'nghĩ'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Lý do vô hiệu hóa phải có ít nhất 10 ký tự');
  });

  it('xử lý lỗi repository.save', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockRejectedValue(new Error('Database error'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Lỗi hệ thống');
    expect(logger.error).toHaveBeenCalledWith(
      'Error deactivating staff',
      expect.objectContaining({
        staffId: baseRequest.staffId,
        error: 'Database error'
      })
    );
  });

  it('hợp lệ hóa staffId trước khi gọi repository', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      staffId: 'INVALID'
    });

    expect(result.success).toBe(false);
    expect(repository.findById).not.toHaveBeenCalled();
  });
});
