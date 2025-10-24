import { SuspendStaffUseCase } from '../../../../src/application/use-cases/SuspendStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('SuspendStaffUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: SuspendStaffUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-003',
    reason: 'Vi phạm quy định bệnh viện nghiêm trọng',
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new SuspendStaffUseCase(repository, logger);
  });

  it('tạm ngưng nhân viên đang active', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'active' });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.status).toBe('suspended');
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe(baseRequest.reason);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff suspended',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        suspendedBy: baseRequest.requestedBy
      })
    );
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không tìm thấy nhân viên');
  });

  it('chỉ có thể tạm ngưng nhân viên đang hoạt động', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'suspended' });
    repository.findById.mockResolvedValue(staff);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Chỉ có thể tạm ngưng nhân viên đang hoạt động');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validate reason phải đủ dài', async () => {
    await expect(useCase.execute({ ...baseRequest, reason: 'ngắn' } as any)).rejects.toThrow('Lý do tạm ngưng phải có ít nhất 10 ký tự');
  });

  it('validate staffId sai định dạng', async () => {
    await expect(useCase.execute({ ...baseRequest, staffId: 'INVALID' } as any)).rejects.toThrow('ID nhân viên không hợp lệ');
  });
});
