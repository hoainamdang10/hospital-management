import { ReactivateStaffUseCase } from '../../../../src/application/use-cases/ReactivateStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('ReactivateStaffUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: ReactivateStaffUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-002',
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new ReactivateStaffUseCase(repository, logger);
  });

  it('kích hoạt lại nhân viên đang bị tạm ngưng', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'suspended' });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.status).toBe('active');
    expect(result.isActive).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff reactivated',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        reactivatedBy: baseRequest.requestedBy
      })
    );
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không tìm thấy nhân viên');
  });

  it('chỉ cho phép re-activate khi staff bị suspended', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'inactive' });
    repository.findById.mockResolvedValue(staff);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Chỉ có thể kích hoạt lại nhân viên đang bị tạm ngưng');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validate định dạng staffId', async () => {
    await expect(useCase.execute({ ...baseRequest, staffId: 'INVALID' } as any)).rejects.toThrow('ID nhân viên không hợp lệ');
  });
});
