import { RegisterStaffUseCase, RegisterStaffRequest } from '../../../../src/application/use-cases/RegisterStaffUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('RegisterStaffUseCase', () => {
  const baseRequest: RegisterStaffRequest = {
    userId: 'user-123',
    staffType: 'doctor',
    personalInfo: {
      fullName: 'Bác sĩ Nguyễn Văn A',
      dateOfBirth: '1985-01-01',
      gender: 'male',
      nationalId: '012345678901',
      nationality: 'Vietnam',
      phoneNumber: '0901234567',
      email: 'doctor@example.com',
      address: {
        street: '123 Đường ABC',
        ward: 'Phường 1',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'Vietnam'
      }
    },
    professionalInfo: {
      title: 'Bác sĩ',
      department: 'Khoa Tim mạch',
      position: 'Trưởng khoa',
      education: ['Đại học Y Hà Nội'],
      languages: ['Vietnamese', 'English']
    },
    workSchedule: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: { start: '08:00', end: '17:00' },
      timeZone: 'Asia/Ho_Chi_Minh',
      isFlexible: false
    },
    licenseNumber: 'BYS-12345',
    employmentType: 'full_time',
    hireDate: '2024-01-01',
    yearsOfExperience: 12,
    specializations: [
      { code: 'CARD', name: 'Tim mạch', isActive: true }
    ],
    consultationFee: 500000,
    requestedBy: 'admin-001',
    vietnameseHealthcareLicense: 'VN-MOH-123456',
    mohRegistrationNumber: 'MOH-REG-2024-001'
  };

  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let eventBus: { publish: jest.Mock };
  let useCase: RegisterStaffUseCase;

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    eventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    useCase = new RegisterStaffUseCase(repository, eventBus as any, logger);
  });

  it('đăng ký bác sĩ thành công với dữ liệu hợp lệ', async () => {
    repository.findByUserId.mockResolvedValue(null);
    repository.findByLicenseNumber.mockResolvedValue(null);
    repository.save.mockResolvedValue(undefined);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.staffId).toMatch(/^(DOC)-[A-Z]{3,5}-\d{6}-\d{3}$/);
    expect(result.data?.staff.userId).toBe(baseRequest.userId);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('trả về lỗi khi người dùng đã có hồ sơ nhân viên', async () => {
    repository.findByUserId.mockResolvedValue({ id: { value: 'DOC-CARD-202401-001' } } as any);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Nhân viên đã được đăng ký');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('kiểm tra ràng buộc chuyên khoa cho bác sĩ', async () => {
    const requestWithoutSpecialization: RegisterStaffRequest = {
      ...baseRequest,
      specializations: []
    };

    const result = await useCase.execute(requestWithoutSpecialization);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain('Bác sĩ phải có ít nhất một chuyên khoa');
  });

  it('vẫn trả về thành công khi publish event thất bại nhưng ghi log cảnh báo', async () => {
    repository.findByUserId.mockResolvedValue(null);
    repository.findByLicenseNumber.mockResolvedValue(null);
    repository.save.mockResolvedValue(undefined);
    eventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Đăng ký nhân viên thành công');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'Không thể phát sự kiện đăng ký nhân viên, hệ thống sẽ thử lại sau.'
      ])
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to publish staff registration events'),
      expect.objectContaining({
        staffId: expect.any(String),
        userId: baseRequest.userId,
        error: 'Event bus unavailable'
      })
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
