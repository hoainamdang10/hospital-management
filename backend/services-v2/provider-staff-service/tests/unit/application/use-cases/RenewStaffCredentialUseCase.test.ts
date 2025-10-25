import {
  RenewStaffCredentialRequest,
  RenewStaffCredentialUseCase
} from '../../../../src/application/use-cases/RenewStaffCredentialUseCase';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('RenewStaffCredentialUseCase', () => {
  const baseRequest: RenewStaffCredentialRequest = {
    staffId: 'DOC-CARD-202501-001',
    credentialNumber: 'VN-LIC-001',
    newExpiryDate: '2026-01-01',
    requestedBy: 'admin-user',
    requestedByRole: 'admin'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: RenewStaffCredentialUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new RenewStaffCredentialUseCase(repository, logger);
    jest.clearAllMocks();
  });

  const createStaffWithCredential = () => {
    const staff = createTestStaff({
      aggregateId: 'staff-renew-1'
    });

    const credential = StaffCredential.create({
      credentialNumber: baseRequest.credentialNumber,
      credentialType: 'medical_license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2025-01-01')
    });

    staff.addCredential(credential);
    return { staff, credential };
  };

  it('gia hạn chứng chỉ thành công', async () => {
    const { staff } = createStaffWithCredential();
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue(undefined);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue,
      newExpiryDate: '2026-01-01'
    });

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe(staff.id);
    expect(result.data?.credentialNumber).toBe(baseRequest.credentialNumber);
    expect(result.data?.oldExpiryDate).toBeDefined();
    expect(result.data?.newExpiryDate).toBe(new Date('2026-01-01').toISOString());
    expect(repository.update).toHaveBeenCalledWith(staff);
    const renewedCredential = staff.credentials.find(
      (credential: StaffCredential) => credential.credentialNumber === baseRequest.credentialNumber
    );
    expect(renewedCredential?.expiryDate?.toISOString()).toBe(new Date('2026-01-01').toISOString());
    expect(logger.info).toHaveBeenCalledWith(
      'Staff credential renewed successfully',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        credentialNumber: baseRequest.credentialNumber
      })
    );
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không tìm thấy nhân viên');
    expect(result.errors).toContain('STAFF_NOT_FOUND');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi nhân viên không hoạt động', async () => {
    const { staff } = createStaffWithCredential();
    (staff as any).props.status = 'inactive';
    (staff as any).props.isActive = false;
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Nhân viên không hoạt động, không thể gia hạn chứng chỉ');
    expect(result.errors).toContain('STAFF_INACTIVE');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('trả về lỗi validation khi ngày hết hạn mới không hợp lệ', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      newExpiryDate: '2020-01-01',
      requestedBy: '',
      requestedByRole: ''
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Yêu cầu không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Ngày hết hạn mới phải trong tương lai',
        'Người yêu cầu không được để trống',
        'Vai trò người yêu cầu không được để trống'
      ])
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('trả về lỗi hệ thống khi cập nhật thất bại', async () => {
    const { staff } = createStaffWithCredential();
    repository.findById.mockResolvedValue(staff);
    repository.update.mockRejectedValue(new Error('Database unavailable'));

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Database unavailable');
    expect(result.errors).toContain('RENEW_CREDENTIAL_FAILED');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to renew staff credential',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        credentialNumber: baseRequest.credentialNumber,
        error: 'Database unavailable'
      })
    );
  });
});
