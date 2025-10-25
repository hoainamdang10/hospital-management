import {
  GetExpiringCredentialsRequest,
  GetExpiringCredentialsUseCase
} from '../../../../src/application/use-cases/GetExpiringCredentialsUseCase';
import { DepartmentAssignment } from '../../../../src/domain/entities/DepartmentAssignment';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('GetExpiringCredentialsUseCase', () => {
  const now = new Date('2025-01-01T00:00:00.000Z');

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: GetExpiringCredentialsUseCase;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new GetExpiringCredentialsUseCase(repository, logger);
    jest.clearAllMocks();
  });

  const buildRequest = (overrides: Partial<GetExpiringCredentialsRequest> = {}): GetExpiringCredentialsRequest => ({
    daysThreshold: 30,
    requestedBy: 'admin-user',
    requestedByRole: 'admin',
    ...overrides
  });

  const createStaffWithCredential = (expiryDate: Date, overrides: { departmentId?: string } = {}) => {
    const staff = createTestStaff({
      aggregateId: `staff-${Math.random().toString(36).substring(2, 8)}`
    });

    const credential = StaffCredential.create({
      credentialNumber: `VN-LIC-${Math.floor(Math.random() * 900) + 100}`,
      credentialType: 'professional_license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date('2023-01-01'),
      expiryDate
    });
    staff.addCredential(credential);

    if (overrides.departmentId) {
      const assignment = DepartmentAssignment.create({
        departmentId: overrides.departmentId,
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Khoa Tim mạch',
        role: 'Doctor',
        isPrimary: true,
        startDate: new Date('2024-01-01'),
        isActive: true
      });
      staff.assignToDepartment(assignment);
    }

    return { staff, credential };
  };

  it('trả về danh sách chứng chỉ sắp hết hạn theo phòng ban', async () => {
    const { staff: staffWithMatch, credential } = createStaffWithCredential(
      new Date('2025-01-15T00:00:00.000Z'),
      { departmentId: 'DEPT-CARD' }
    );

    const { staff: staffOtherDept } = createStaffWithCredential(
      new Date('2025-02-20T00:00:00.000Z'),
      { departmentId: 'DEPT-ORTH' }
    );

    repository.findAll.mockResolvedValue([staffWithMatch, staffOtherDept]);

    const result = await useCase.execute(
      buildRequest({
        departmentId: 'DEPT-CARD',
        staffType: 'doctor'
      })
    );

    expect(repository.findAll).toHaveBeenCalledWith({
      isActive: true,
      staffType: 'doctor'
    });
    expect(result.success).toBe(true);
    expect(result.data?.totalCount).toBe(1);
    expect(result.data?.expiringCredentials[0].staffId).toBe(staffWithMatch.id);
    expect(result.data?.expiringCredentials[0].credentialId).toBe(credential.id);
    expect(result.data?.expiringCredentials[0].daysUntilExpiry).toBe(14);
    expect(result.data?.expiredCount).toBe(0);
    expect(result.data?.expiringSoonCount).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Expiring credentials retrieved successfully',
      expect.objectContaining({
        totalCount: 1,
        daysThreshold: 30
      })
    );
  });

  it('trả về lỗi khi daysThreshold không hợp lệ', async () => {
    const result = await useCase.execute(
      buildRequest({
        daysThreshold: 0
      })
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Yêu cầu không hợp lệ');
    expect(result.errors).toContain('Ngưỡng số ngày phải từ 1 đến 365');
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('xử lý lỗi hệ thống khi repository ném lỗi', async () => {
    repository.findAll.mockRejectedValue(new Error('Database unavailable'));

    const result = await useCase.execute(buildRequest());

    expect(result.success).toBe(false);
    expect(result.message).toBe('Database unavailable');
    expect(result.errors).toContain('GET_EXPIRING_CREDENTIALS_FAILED');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get expiring credentials',
      expect.objectContaining({ error: 'Database unavailable' })
    );
  });
});
