import {
  AddStaffSpecializationRequest,
  AddStaffSpecializationUseCase
} from '../../../../src/application/use-cases/AddStaffSpecializationUseCase';
import type { Specialization } from '../../../../src/domain/entities/Specialization';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('AddStaffSpecializationUseCase', () => {
  const baseRequest: AddStaffSpecializationRequest = {
    staffId: 'DOC-CARD-202501-001',
    code: 'NEURO',
    name: 'Thần kinh',
    description: 'Chuyên khoa thần kinh',
    isActive: true,
    addedBy: 'admin-user',
    addedByRole: 'ADMIN'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: AddStaffSpecializationUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new AddStaffSpecializationUseCase(repository, logger);
    jest.clearAllMocks();
  });

  it('thêm chuyên khoa mới thành công', async () => {
    const staff = createTestStaff();
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Thêm chuyên khoa thành công');
    expect(result.data?.code).toBe(baseRequest.code);
    expect(repository.save).toHaveBeenCalledWith(staff);
    expect(
      staff.getActiveSpecializations().some((spec: Specialization) => spec.code === baseRequest.code)
    ).toBe(true);
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: StaffId.generate('doctor').value
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi dữ liệu không hợp lệ', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      staffId: '',
      code: '',
      name: '',
      addedBy: '',
      addedByRole: ''
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Dữ liệu đầu vào không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Staff ID không được để trống',
        'Mã chuyên khoa không được để trống',
        'Tên chuyên khoa không được để trống',
        'Người thêm không được để trống',
        'Vai trò người thêm không được để trống'
      ])
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi chuyên khoa đã tồn tại', async () => {
    const staff = createTestStaff();
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue,
      code: staff.getActiveSpecializations()[0].code,
      name: staff.getActiveSpecializations()[0].name
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Chuyên khoa này đã tồn tại');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
