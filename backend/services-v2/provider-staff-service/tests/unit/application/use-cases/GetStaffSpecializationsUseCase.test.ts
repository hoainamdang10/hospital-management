import {
  GetStaffSpecializationsRequest,
  GetStaffSpecializationsUseCase
} from '../../../../src/application/use-cases/GetStaffSpecializationsUseCase';
import { Specialization } from '../../../../src/domain/entities/Specialization';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('GetStaffSpecializationsUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: GetStaffSpecializationsUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new GetStaffSpecializationsUseCase(repository, logger);
    jest.clearAllMocks();
  });

  const buildRequest = (overrides: Partial<GetStaffSpecializationsRequest> = {}): GetStaffSpecializationsRequest => ({
    staffId: 'DOC-CARD-202501-001',
    requestedBy: 'admin-user',
    requestedByRole: 'admin',
    includeInactive: false,
    ...overrides
  });

  it('trả về danh sách chuyên khoa active', async () => {
    const staff = createTestStaff({
      aggregateId: 'staff-spec-1'
    });

    const inactiveSpecialization = Specialization.create({
      code: 'DERM',
      name: 'Da liễu',
      description: 'Chuyên khoa da liễu',
      isActive: true
    });
    inactiveSpecialization.deactivate();
    staff.addSpecialization(inactiveSpecialization);

    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(
      buildRequest({
        staffId: staff.staffIdValue
      })
    );

    expect(result.success).toBe(true);
    expect(result.data?.specializations).toHaveLength(1);
    expect(result.data?.specializations[0].code).toBe(staff.getActiveSpecializations()[0].code);
  });

  it('bao gồm chuyên khoa inactive khi includeInactive = true', async () => {
    const staff = createTestStaff({
      aggregateId: 'staff-spec-2'
    });

    const inactiveSpecialization = Specialization.create({
      code: 'ORTH',
      name: 'Chấn thương chỉnh hình',
      description: 'Chuyên khoa chỉnh hình',
      isActive: true
    });
    inactiveSpecialization.deactivate();
    staff.addSpecialization(inactiveSpecialization);

    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(
      buildRequest({
        staffId: staff.staffIdValue,
        includeInactive: true
      })
    );

    expect(result.success).toBe(true);
    expect(result.data?.specializations).toHaveLength(2);
    expect(result.data?.specializations.map(s => s.code)).toEqual(
      expect.arrayContaining(['CARD', 'ORTH'])
    );
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(buildRequest());

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
    expect(logger.info).not.toHaveBeenCalledWith('Staff specializations retrieved successfully', expect.anything());
  });

  it('trả về lỗi khi dữ liệu không hợp lệ', async () => {
    const result = await useCase.execute(
      buildRequest({
        staffId: '',
        requestedBy: '',
        requestedByRole: ''
      })
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Dữ liệu đầu vào không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Staff ID không được để trống',
        'Người yêu cầu không được để trống',
        'Vai trò người yêu cầu không được để trống'
      ])
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });
});

