import { RemoveStaffCredentialUseCase } from '../../../../src/application/use-cases/RemoveStaffCredentialUseCase';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('RemoveStaffCredentialUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: RemoveStaffCredentialUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-020',
    credentialNumber: 'CRED-001',
    requestedBy: 'admin-001',
    requestedByRole: 'admin',
    reason: 'Credential expired'
  };

  const buildCredential = (credentialNumber: string) =>
    StaffCredential.create({
      credentialNumber,
      credentialType: 'license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2030-01-01')
    });

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new RemoveStaffCredentialUseCase(repository, logger);
  });

  it('xóa chứng chỉ thành công khi nhân viên active và có nhiều chứng chỉ', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'active' });
    (staff as any).props.credentials = [
      buildCredential('CRED-001'),
      buildCredential('CRED-002')
    ];
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe('aggregate-staff-test');
    expect(repository.update).toHaveBeenCalledWith(staff);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff credential removed successfully',
      expect.objectContaining({ credentialNumber: baseRequest.credentialNumber })
    );
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy nhân viên');
  });

  it('không cho phép xóa khi nhân viên inactive', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'inactive' });
    (staff as any).props.credentials = [buildCredential('CRED-001'), buildCredential('CRED-002')];
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Nhân viên không hoạt động');
  });

  it('không cho phép xóa chứng chỉ duy nhất còn hiệu lực', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    (staff as any).props.credentials = [buildCredential('CRED-001')];
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không thể xóa chứng chỉ duy nhất còn hiệu lực');
    expect(result.errors).toContain('REMOVE_CREDENTIAL_FAILED');
  });

  it('trả về lỗi validation khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute({
      staffId: '',
      credentialNumber: '',
      requestedBy: '',
      requestedByRole: ''
    } as any);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'ID nhân viên không được để trống',
        'Số chứng chỉ không được để trống',
        'Người yêu cầu không được để trống',
        'Vai trò người yêu cầu không được để trống'
      ])
    );
  });
});
