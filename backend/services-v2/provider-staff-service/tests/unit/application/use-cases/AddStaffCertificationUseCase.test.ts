import {
  AddStaffCertificationRequest,
  AddStaffCertificationUseCase
} from '../../../../src/application/use-cases/AddStaffCertificationUseCase';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import {
  createMockLogger,
  createMockStaffRepository,
  createTestStaff
} from '../../../helpers/mockFactories';

describe('AddStaffCertificationUseCase', () => {
  const baseRequest: AddStaffCertificationRequest = {
    staffId: 'DOC-CARD-202501-001',
    certification: {
      certificationNumber: 'CERT-001',
      certificationType: 'Vietnamese Medical License',
      issuingAuthority: 'Bộ Y tế',
      issueDate: '2024-01-01',
      expiryDate: '2026-01-01',
      isValid: true
    },
    addedBy: 'admin-user',
    addedByRole: 'ADMIN'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: AddStaffCertificationUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new AddStaffCertificationUseCase(repository, logger);
    jest.clearAllMocks();
  });

  it('thêm chứng chỉ thành công khi dữ liệu hợp lệ', async () => {
    const staff = createTestStaff();
    const request: AddStaffCertificationRequest = {
      ...baseRequest,
      staffId: staff.staffIdValue
    };

    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue(undefined);

    const result = await useCase.execute(request);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Thêm chứng chỉ thành công');
    expect(result.data?.staffId).toBe(staff.id);
    expect(result.data?.addedAt).toBeDefined();
    expect(staff.certifications.length).toBeGreaterThan(0);
    expect(staff.certifications[0].certificationName).toBe(
      request.certification.certificationType
    );
    expect(repository.save).toHaveBeenCalledWith(staff);
    expect(logger.info).toHaveBeenCalledWith(
      'Staff certification added successfully',
      expect.objectContaining({
        staffId: staff.id,
        addedBy: request.addedBy
      })
    );
  });

  it('trả về lỗi khi nhân viên không tồn tại', async () => {
    const missingStaffId = StaffId.generate('doctor').value;
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      ...baseRequest,
      staffId: missingStaffId
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không tìm thấy nhân viên');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('trả về lỗi validation khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      staffId: '',
      certification: {
        ...baseRequest.certification,
        certificationNumber: ''
      }
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('ID nhân viên không được để trống');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('trả về lỗi hệ thống khi lưu repository thất bại', async () => {
    const staff = createTestStaff();
    repository.findById.mockResolvedValue(staff);
    repository.save.mockRejectedValue(new Error('DB write failed'));

    const result = await useCase.execute({
      ...baseRequest,
      staffId: staff.staffIdValue
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Lỗi hệ thống khi thêm chứng chỉ');
    expect(logger.error).toHaveBeenCalledWith(
      'Error adding staff certification',
      expect.objectContaining({
        staffId: staff.staffIdValue,
        error: 'DB write failed'
      })
    );
  });
});
