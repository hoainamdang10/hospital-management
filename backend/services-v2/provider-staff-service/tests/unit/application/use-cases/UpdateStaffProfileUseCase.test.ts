import { UpdateStaffProfileUseCase, UpdateStaffProfileRequest } from '../../../../src/application/use-cases/UpdateStaffProfileUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';

const baseRequest: UpdateStaffProfileRequest = {
  staffId: 'DOC-CARD-202501-001',
  updatedBy: 'admin-001',
  updatedByRole: 'admin',
  personalInfo: {
    fullName: 'Bác sĩ Nguyễn Văn B',
    phoneNumber: '0909998888'
  },
  professionalInfo: {
    position: 'Trưởng khoa'
  },
  consultationFee: 750000,
  vietnameseHealthcareLicense: 'VN-MOH-223344',
  mohRegistrationNumber: 'MOH-REG-2025-010'
};

describe('UpdateStaffProfileUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: UpdateStaffProfileUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new UpdateStaffProfileUseCase(repository, logger);
  });

  it('cập nhật personal và professional info thành công', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockResolvedValue();

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.data?.staffId).toBe('aggregate-staff-test');
    expect(result.data?.updatedFields).toEqual(
      expect.arrayContaining([
        'personal_info',
        'professional_info',
        'consultation_fee',
        'vietnamese_healthcare_license',
        'moh_registration_number'
      ])
    );
    expect(repository.save).toHaveBeenCalledWith(staff);
  });

  it('trả về lỗi khi không tìm thấy staff', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không tìm thấy thông tin nhân viên');
  });

  it('không cho phép staff tự cập nhật giấy phép hành nghề', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId, userId: baseRequest.updatedBy });
    repository.findById.mockResolvedValue(staff);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Không có quyền cập nhật thông tin nhân viên này');
  });

  it('trả về lỗi validation khi không có trường nào để cập nhật', async () => {
    const result = await useCase.execute({
      staffId: baseRequest.staffId,
      updatedBy: 'admin-001',
      updatedByRole: 'admin'
    } as UpdateStaffProfileRequest);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Phải cung cấp ít nhất một trường để cập nhật');
  });

  it('xử lý lỗi repository.save', async () => {
    const staff = createTestStaff({ staffId: baseRequest.staffId });
    repository.findById.mockResolvedValue(staff);
    repository.save.mockRejectedValue(new Error('Database error'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Lỗi hệ thống khi cập nhật thông tin nhân viên');
    expect(logger.error).toHaveBeenCalledWith(
      'Error updating staff profile',
      expect.objectContaining({
        staffId: baseRequest.staffId,
        error: 'Database error'
      })
    );
  });
});
