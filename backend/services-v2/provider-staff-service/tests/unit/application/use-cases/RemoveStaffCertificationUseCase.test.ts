import { RemoveStaffCertificationUseCase } from '../../../../src/application/use-cases/RemoveStaffCertificationUseCase';
import { StaffCertification } from '../../../../src/domain/entities/StaffCertification';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

describe('RemoveStaffCertificationUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: RemoveStaffCertificationUseCase;

  const baseRequest = {
    staffId: 'DOC-CARD-202501-040',
    certificationId: 'CERT-001',
    removedBy: 'admin-001',
    removedByRole: 'ADMIN',
    reason: 'Certification revoked'
  };

  const buildCertification = (id: string) =>
    StaffCertification.create({
      certificationName: `Certification ${id}`,
      issuingOrganization: 'Ministry of Health',
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2030-01-01')
    });

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new RemoveStaffCertificationUseCase(repository, logger);
  });

  it('xóa chứng nhận thành công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'active' });
    const cert1 = buildCertification('CERT-001');
    const cert2 = buildCertification('CERT-002');
    (cert1 as any)._id = 'CERT-001';
    (cert2 as any)._id = 'CERT-002';
    (staff as any).props.certifications = [cert1, cert2];
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.certificationId).toBe(baseRequest.certificationId);
    expect(staff.certifications.length).toBe(1);
    expect(repository.update).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('STAFF_NOT_FOUND');
  });

  it('cho phép xóa dù nhân viên đang inactive', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, status: 'inactive' });
    const inactiveCert = buildCertification('CERT-001');
    (inactiveCert as any)._id = 'CERT-001';
    const activeCert = buildCertification('CERT-002');
    (activeCert as any)._id = 'CERT-002';
    (staff as any).props.certifications = [inactiveCert, activeCert];
    (staff as any).props.isActive = false;
    repository.findById.mockResolvedValue(staff);
    repository.update.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(staff.certifications.length).toBe(1);
  });

  it('trả về lỗi khi không tìm thấy chứng chỉ', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    const missingCert = buildCertification('CERT-999');
    (missingCert as any)._id = 'CERT-999';
    (staff as any).props.certifications = [missingCert];
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy chứng chỉ');
  });

  it('validate quyền xóa chứng chỉ', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      removedByRole: 'DOCTOR'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xóa chứng chỉ');
  });
});
