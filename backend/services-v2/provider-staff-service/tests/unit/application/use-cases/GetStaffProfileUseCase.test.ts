import {
  GetStaffProfileRequest,
  GetStaffProfileUseCase
} from '../../../../src/application/use-cases/GetStaffProfileUseCase';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('GetStaffProfileUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: GetStaffProfileUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new GetStaffProfileUseCase(repository, logger);
    jest.clearAllMocks();
  });

  const buildRequest = (overrides: Partial<GetStaffProfileRequest> = {}): GetStaffProfileRequest => ({
    staffId: 'DOC-CARD-202501-001',
    requestedBy: 'admin-user',
    requestedByRole: 'admin',
    includeFullSchedule: true,
    includeSensitiveInfo: true,
    ...overrides
  });

  it('trả về đầy đủ thông tin khi ADMIN truy cập', async () => {
    const staff = createTestStaff({
      aggregateId: 'staff-profile-1',
      hireDate: '2015-01-01'
    });
    const credential = StaffCredential.create({
      credentialNumber: 'VN-MED-001',
      credentialType: 'medical_license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2026-01-01')
    });
    staff.addCredential(credential);

    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(
      buildRequest({
        staffId: staff.staffIdValue,
        requestedBy: 'admin-user',
        requestedByRole: 'admin',
        includeSensitiveInfo: true,
        includeFullSchedule: true
      })
    );

    expect(result.success).toBe(true);
    expect(result.data?.staff.personalInfo.fullName).toBe(staff.personalInfo.fullName);
    expect(result.data?.staff.personalInfo.dateOfBirth).toBe('1980-01-01');
    expect(result.data?.staff.personalInfo.email).toBe(staff.personalInfo.email);
    expect(result.data?.staff.workSchedule).toBeDefined();
    expect(result.data?.staff.credentials?.[0]?.credentialNumber?.startsWith('VN-M')).toBe(true);
    expect(result.data?.staff.employmentInfo.status).toBe(staff.status);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff profile retrieved successfully',
      expect.objectContaining({
        staffId: staff.id,
        requestedBy: 'admin-user'
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'HIPAA Audit: Staff profile access',
      expect.objectContaining({
        staffId: staff.id,
        accessLevel: 'full'
      })
    );
  });

  it('trả về lỗi khi người dùng không có quyền truy cập', async () => {
    const staff = createTestStaff({
      aggregateId: 'staff-profile-2'
    });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(
      buildRequest({
        staffId: staff.staffIdValue,
        requestedByRole: 'patient'
      })
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không có quyền truy cập thông tin nhân viên này');
    expect(logger.warn).toHaveBeenCalledWith(
      'Unauthorized staff profile access attempt',
      expect.objectContaining({
        staffId: staff.id,
        requestedByRole: 'patient'
      })
    );
  });

  it('trả về lỗi khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute(
      buildRequest({
        staffId: undefined,
        requestedBy: '',
        requestedByRole: ''
      })
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Yêu cầu không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Phải cung cấp ID nhân viên hoặc ID người dùng',
        'Thông tin người yêu cầu không được để trống',
        'Vai trò người yêu cầu không được để trống'
      ])
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi không tìm thấy nhân viên', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(buildRequest());

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không tìm thấy thông tin nhân viên');
    expect(logger.info).not.toHaveBeenCalledWith('Staff profile retrieved successfully', expect.anything());
  });
});

