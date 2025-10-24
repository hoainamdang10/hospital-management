import { ActivateStaffUseCase } from '../../../../src/application/use-cases/ActivateStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('ActivateStaffUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: ActivateStaffUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-001',
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new ActivateStaffUseCase(repository, logger);
  });

  it('kích hoạt nhân viên đang inactive', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'inactive' });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.staffId).toBe(staff.staffIdValue);
    expect(result.isActive).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff activated',
      expect.objectContaining({
        staffId: staff.id,
        activatedBy: baseRequest.requestedBy
      })
    );
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không tìm thấy nhân viên');
  });

  it('chặn kích hoạt khi nhân viên không ở trạng thái inactive', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'active' });
    repository.findById.mockResolvedValue(staff);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Nhân viên đã ở trạng thái hoạt động');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validate định dạng staffId', async () => {
    await expect(useCase.execute({ ...baseRequest, staffId: 'INVALID' } as any)).rejects.toThrow('Mã nhân viên không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)');
  });
});
