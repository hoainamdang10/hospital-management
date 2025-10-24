import { SearchStaffUseCase, SearchStaffRequest } from '../../../../src/application/use-cases/SearchStaffUseCase';
import { createMockLogger, createMockStaffRepository, createTestStaff } from '../../../helpers/mockFactories';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';

describe('SearchStaffUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: SearchStaffUseCase;

  const baseRequest: SearchStaffRequest = {
    requestedBy: 'admin-001',
    requestedByRole: 'admin',
    page: 1,
    limit: 10
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new SearchStaffUseCase(repository, logger);
  });

  it('tìm kiếm nhân viên theo bộ lọc cơ bản', async () => {
    const staffList: ProviderStaff[] = [
      createTestStaff({ staffId: 'DOC-CARD-202501-001', staffType: 'doctor' }),
      createTestStaff({ staffId: 'NUR-EMRG-202501-002', staffType: 'nurse', department: 'Emergency Medicine' })
    ];
    repository.findAll.mockImplementation(async (filters: any) => {
      return staffList.filter(staff => !filters?.staffType || staff.staffType === filters.staffType);
    });

    const result = await useCase.execute({
      ...baseRequest,
      staffType: 'doctor',
      searchQuery: 'Dr. Test'
    });

    expect(result.success).toBe(true);
    expect(result.data?.staff).toHaveLength(1);
    expect(result.data?.staff[0].staffType).toBe('doctor');
  });

  it('lọc theo department và specialization', async () => {
    const staffList = [
      createTestStaff({
        staffId: 'DOC-CARD-202501-001',
        staffType: 'doctor',
        department: 'Cardiology Department'
      }),
      createTestStaff({
        staffId: 'NUR-ORTH-202501-002',
        staffType: 'nurse',
        department: 'Orthopedics'
      })
    ];
    repository.findAll.mockResolvedValue(staffList);

    const result = await useCase.execute({
      ...baseRequest,
      department: 'Cardiology'
    });

    expect(result.success).toBe(true);
    expect(result.data?.staff[0].department.toLowerCase()).toContain('cardio');
  });

  it('áp dụng phân trang', async () => {
    const staffList = Array.from({ length: 25 }, (_, i) =>
      createTestStaff({ staffId: `DOC-CARD-202501-${(i+1).toString().padStart(3, '0')}` })
    );
    repository.findAll.mockResolvedValue(staffList);

    const result = await useCase.execute({
      ...baseRequest,
      page: 2,
      limit: 10
    });

    expect(result.data?.pagination.page).toBe(2);
    expect(result.data?.staff).toHaveLength(10);
  });

  it('trả về lỗi validation khi thiếu thông tin người yêu cầu', async () => {
    const result = await useCase.execute({ requestedBy: '', requestedByRole: '' } as any);
    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(['Thông tin người yêu cầu không được để trống', 'Vai trò người yêu cầu không được để trống'])
    );
  });
});
