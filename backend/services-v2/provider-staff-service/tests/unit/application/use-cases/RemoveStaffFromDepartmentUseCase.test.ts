import { RemoveStaffFromDepartmentUseCase } from '../../../../src/application/use-cases/RemoveStaffFromDepartmentUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';
import { DepartmentAssignment } from '../../../../src/domain/entities/DepartmentAssignment';

describe('RemoveStaffFromDepartmentUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: RemoveStaffFromDepartmentUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-050',
    departmentId: 'DEPT-CARD',
    removedBy: 'admin-001',
    removedByRole: 'ADMIN',
    reason: 'Department restructuring'
  };

  const buildAssignment = () =>
    DepartmentAssignment.create({
      departmentId: 'DEPT-CARD',
      departmentCode: 'CARD',
      departmentNameEn: 'Cardiology',
      departmentNameVi: 'Khoa Tim mạch',
      role: 'Bác sĩ chính',
      isPrimary: true,
      startDate: new Date('2024-01-01'),
      isActive: true
    });

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new RemoveStaffFromDepartmentUseCase(repository, logger);
  });

  it('xóa phân công khoa thành công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    const assignment = buildAssignment();
    (staff as any).props.departmentAssignments = [assignment];
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.departmentId).toBe(baseRequest.departmentId);
    expect(staff.getCurrentDepartmentAssignments().length).toBe(0);
    expect(repository.update).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_NOT_FOUND');
  });

  it('trả về lỗi khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute({
      staffId: '',
      departmentId: '',
      removedBy: '',
      removedByRole: ''
    } as any);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Staff ID không được để trống',
        'Department ID không được để trống',
        'Người xóa phân công không được để trống',
        'Vai trò người xóa phân công không được để trống'
      ])
    );
  });

  it('báo lỗi khi không tìm thấy phân công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    (staff as any).props.departmentAssignments = [];
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('DEPARTMENT_ASSIGNMENT_NOT_FOUND');
  });

  it('validate endDate không được ở tương lai', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await useCase.execute({
      ...baseRequest,
      endDate: futureDate
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Ngày kết thúc không thể trong tương lai');
  });

  it('chỉ ADMIN hoặc SUPER_ADMIN được quyền xóa', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      removedByRole: 'DOCTOR'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xóa phân công nhân viên');
  });
});
