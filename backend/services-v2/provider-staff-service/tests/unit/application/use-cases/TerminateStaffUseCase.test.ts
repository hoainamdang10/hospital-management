import { TerminateStaffUseCase } from '../../../../src/application/use-cases/TerminateStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('TerminateStaffUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: TerminateStaffUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-010',
    reason: 'Vi phạm nghiêm trọng quy định bệnh viện',
    terminationDate: '2025-03-01',
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new TerminateStaffUseCase(repository, logger);
  });

  it('chấm dứt hợp đồng nhân viên đang active', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'active' });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.status).toBe('terminated');
    expect(result.isActive).toBe(false);
    expect(result.reason).toBe(baseRequest.reason);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff terminated',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        reason: baseRequest.reason
      })
    );
  });

  it('trả về lỗi khi staff không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không tìm thấy nhân viên');
  });

  it('chỉ chấm dứt khi nhân viên chưa terminated', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'terminated' });
    repository.findById.mockResolvedValue(staff);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Nhân viên đã bị chấm dứt hợp đồng');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validate lý do tối thiểu 10 ký tự', async () => {
    await expect(useCase.execute({ ...baseRequest, reason: 'ngắn' } as any)).rejects.toThrow('Lý do chấm dứt hợp đồng phải có ít nhất 10 ký tự');
  });

  it('validate định dạng staffId', async () => {
    await expect(useCase.execute({ ...baseRequest, staffId: 'INVALID' } as any)).rejects.toThrow('ID nhân viên không hợp lệ');
  });
});
