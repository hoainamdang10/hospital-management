import { RemoveStaffSpecializationUseCase } from '../../../../src/application/use-cases/RemoveStaffSpecializationUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';
import { Specialization } from '../../../../src/domain/entities/Specialization';

describe('RemoveStaffSpecializationUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: RemoveStaffSpecializationUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-030',
    specializationCode: 'CARD',
    removedBy: 'admin-001',
    removedByRole: 'admin'
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new RemoveStaffSpecializationUseCase(repository, logger);
  });

  const buildSpecialization = (code: string, name: string) => {
    const specialization = Specialization.create({
      code,
      name,
      description: `${name} description`,
      isActive: true
    });
    (specialization as any)._id = code;
    return specialization;
  };

  it('xóa chuyên khoa khỏi nhân viên', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    const primary = buildSpecialization('CARD', 'Cardiology');
    const secondary = buildSpecialization('ORTH', 'Orthopedics');
    (staff as any).props.specializations = [primary, secondary];
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Xóa chuyên khoa thành công');
    expect(repository.save).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy thông tin nhân viên');
  });

  it('trả về lỗi khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute({
      staffId: '',
      specializationCode: '',
      removedBy: '',
      removedByRole: ''
    } as any);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Staff ID không được để trống',
        'Mã chuyên khoa không được để trống',
        'Người xóa không được để trống',
        'Vai trò người xóa không được để trống'
      ])
    );
  });

  it('báo lỗi khi chuyên khoa không tồn tại', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    const spec = buildSpecialization('CARD', 'Cardiology');
    (staff as any).props.specializations = [spec];
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      specializationCode: 'ORTH'
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy chuyên khoa');
  });
});
