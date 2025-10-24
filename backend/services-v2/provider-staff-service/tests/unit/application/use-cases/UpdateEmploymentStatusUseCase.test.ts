import { UpdateEmploymentStatusUseCase } from '../../../../src/application/use-cases/UpdateEmploymentStatusUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('UpdateEmploymentStatusUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: UpdateEmploymentStatusUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-060',
    employmentType: 'contract',
    contractEndDate: '2030-12-31',
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  } as const;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new UpdateEmploymentStatusUseCase(repository, logger);
  });

  it('cập nhật loại hình làm việc thành công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.staffId).toBe(staff.staffIdValue);
    expect(result.employmentType).toBe('contract');
    expect(repository.update).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không tìm thấy nhân viên');
  });

  it('validate contractEndDate không hợp lệ', async () => {
    await expect(useCase.execute({
      ...baseRequest,
      contractEndDate: '2020-01-01'
    })).rejects.toThrow('Ngày kết thúc hợp đồng phải trong tương lai');
  });

  it('không cho phép cập nhật khi nhân viên đã bị terminate', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'terminated' });
    repository.findById.mockResolvedValue(staff);

    await expect(useCase.execute(baseRequest)).rejects.toThrow('Không thể cập nhật trạng thái làm việc của nhân viên đã bị chấm dứt hợp đồng');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('validate loại hình làm việc', async () => {
    await expect(useCase.execute({
      ...baseRequest,
      employmentType: 'freelance' as any
    })).rejects.toThrow('Loại hình làm việc không hợp lệ');
  });
});
