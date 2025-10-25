import {
  VerifyStaffCredentialRequest,
  VerifyStaffCredentialUseCase
} from '../../../../src/application/use-cases/VerifyStaffCredentialUseCase';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';
import { StaffCredential } from '../../../../src/domain/entities/StaffCredential';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('VerifyStaffCredentialUseCase', () => {
  const baseRequest: VerifyStaffCredentialRequest = {
    staffId: 'DOC-CARD-202501-001',
    credentialId: 'credential-1',
    verifiedBy: 'admin-user',
    verifiedByRole: 'ADMIN'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let auditService: jest.Mocked<IAuditService>;
  let useCase: VerifyStaffCredentialUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    auditService = {
      logDataAccess: jest.fn().mockResolvedValue(undefined),
      logDataModification: jest.fn().mockResolvedValue(undefined),
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
      logAction: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<IAuditService>;
    useCase = new VerifyStaffCredentialUseCase(repository, logger, auditService);
    jest.clearAllMocks();
  });

  const createStaffWithCredential = (overrides: { isValid?: boolean; expiryDate?: Date; id?: string } = {}) => {
    const staff = createTestStaff({
      aggregateId: `staff-verify-${Math.random().toString(36).substring(2, 8)}`
    });
    const credential = StaffCredential.create({
      credentialNumber: 'VN-LIC-001',
      credentialType: 'medical_license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date('2020-01-01'),
      expiryDate: overrides.expiryDate ?? new Date('2026-01-01')
    });

    if (overrides.id) {
      (credential as any)._id = overrides.id;
    }

    if (overrides.isValid === false) {
      credential.revoke();
    }

    staff.addCredential(credential);
    return { staff, credential };
  };

  it('xác thực chứng chỉ thành công', async () => {
    const { staff, credential } = createStaffWithCredential({
      isValid: false,
      id: 'credential-1'
    });

    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue(undefined);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe(staff.id);
    expect(result.data?.credentialId).toBe(credential.id);
    expect(repository.update).toHaveBeenCalledWith(staff);
    expect(credential.isValid).toBe(true);
    expect(auditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'VERIFY_STAFF_CREDENTIAL',
        entityId: staff.id,
        metadata: expect.objectContaining({
          credentialId: credential.id
        })
      })
    );
  });

  it('trả về lỗi khi chứng chỉ đã được xác thực trước đó', async () => {
    const { staff } = createStaffWithCredential({
      id: 'credential-1'
    });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Chứng chỉ đã được xác thực trước đó');
    expect(result.errors).toContain('CREDENTIAL_ALREADY_VERIFIED');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi chứng chỉ đã hết hạn', async () => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { staff, credential } = createStaffWithCredential({
      isValid: false,
      expiryDate: expiredDate,
      id: 'credential-1'
    });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Chứng chỉ đã hết hạn, không thể xác thực');
    expect(result.errors).toContain('CREDENTIAL_EXPIRED');
    expect(repository.update).not.toHaveBeenCalled();
    expect(credential.isValid).toBe(false);
  });

  it('trả về lỗi khi yêu cầu không hợp lệ', async () => {
    const result = await useCase.execute({
      staffId: '',
      credentialId: '',
      verifiedBy: '',
      verifiedByRole: 'DOCTOR'
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Dữ liệu xác thực chứng chỉ không hợp lệ');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Staff ID không được để trống',
        'Credential ID không được để trống',
        'Người xác thực không được để trống',
        'Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xác thực chứng chỉ'
      ])
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('trả về lỗi khi không tìm thấy nhân viên hoặc chứng chỉ', async () => {
    repository.findById.mockResolvedValue(null);

    const staffNotFoundResult = await useCase.execute(baseRequest);
    expect(staffNotFoundResult.success).toBe(false);
    expect(staffNotFoundResult.message).toBe('Không tìm thấy nhân viên');

    const { staff } = createStaffWithCredential({
      isValid: false,
      id: 'credential-2'
    });
    repository.findById.mockResolvedValue(staff);

    const credentialNotFound = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(credentialNotFound.success).toBe(false);
    expect(credentialNotFound.message).toBe('Không tìm thấy chứng chỉ');
  });
});
