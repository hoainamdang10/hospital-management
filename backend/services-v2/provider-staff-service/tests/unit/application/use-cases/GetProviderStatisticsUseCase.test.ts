/**
 * GetProviderStatisticsUseCase - Unit Tests
 * Tests statistics retrieval with authorization
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetProviderStatisticsUseCase, GetProviderStatisticsRequest } from '../../../../src/application/use-cases/GetProviderStatisticsUseCase';
import { createMockLogger, createMockStaffRepository } from '../../../helpers/mockFactories';

describe('GetProviderStatisticsUseCase', () => {
  let repository: ReturnType<typeof createMockStaffRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let useCase: GetProviderStatisticsUseCase;

  const baseRequest: GetProviderStatisticsRequest = {
    requestedBy: 'admin-001',
    requestedByRole: 'admin'
  };

  const mockStatistics = {
    total: 100,
    active: 80,
    inactive: 20,
    byType: {
      doctor: 40,
      nurse: 35,
      technician: 15,
      pharmacist: 5,
      admin: 3,
      receptionist: 2
    },
    byStatus: {
      active: 80,
      on_leave: 10,
      suspended: 5,
      terminated: 5
    }
  };

  beforeEach(() => {
    repository = createMockStaffRepository();
    logger = createMockLogger();
    useCase = new GetProviderStatisticsUseCase(repository, logger);
  });

  it('lấy thống kê thành công với quyền admin', async () => {
    repository.getStatistics.mockResolvedValue(mockStatistics);

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Lấy thống kê nhà cung cấp thành công');
    expect(result.data?.statistics).toBeDefined();
    expect(result.data?.statistics.totalProviders).toBe(100);
    expect(result.data?.statistics.activeProviders).toBe(80);
    expect(result.data?.statistics.inactiveProviders).toBe(20);
    expect(repository.getStatistics).toHaveBeenCalled();
  });

  it('lấy thống kê thành công với quyền department_head', async () => {
    repository.getStatistics.mockResolvedValue(mockStatistics);

    const result = await useCase.execute({
      ...baseRequest,
      requestedByRole: 'department_head'
    });

    expect(result.success).toBe(true);
    expect(result.data?.statistics).toBeDefined();
  });

  it('từ chối truy cập khi không có quyền', async () => {
    const result = await useCase.execute({
      ...baseRequest,
      requestedByRole: 'nurse'
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Không có quyền truy cập thống kê');
    expect(repository.getStatistics).not.toHaveBeenCalled();
  });

  it('trả về lỗi validation khi thiếu thông tin bắt buộc', async () => {
    const result = await useCase.execute({
      requestedBy: '',
      requestedByRole: ''
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Yêu cầu không hợp lệ');
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain('Thông tin người yêu cầu không được để trống');
  });

  it('xử lý lỗi repository gracefully', async () => {
    repository.getStatistics.mockRejectedValue(new Error('Database connection failed'));

    const result = await useCase.execute(baseRequest);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Lỗi hệ thống khi lấy thống kê');
    expect(logger.error).toHaveBeenCalledWith(
      'Error getting provider statistics',
      expect.objectContaining({
        requestedBy: baseRequest.requestedBy,
        error: 'Database connection failed'
      })
    );
  });

  it('map dữ liệu repository sang response format đúng', async () => {
    repository.getStatistics.mockResolvedValue(mockStatistics);

    const result = await useCase.execute(baseRequest);

    expect(result.data?.statistics.byType.doctors).toBe(40);
    expect(result.data?.statistics.byType.nurses).toBe(35);
    expect(result.data?.statistics.byType.technicians).toBe(15);
    expect(result.data?.statistics.byType.pharmacists).toBe(5);
    expect(result.data?.statistics.byType.admins).toBe(3);
    expect(result.data?.statistics.byStatus.active).toBe(80);
    expect(result.data?.statistics.byStatus.onLeave).toBe(10);
    expect(result.data?.statistics.byStatus.suspended).toBe(5);
    expect(result.data?.statistics.byStatus.terminated).toBe(5);
  });

  it('ghi log thành công khi lấy thống kê', async () => {
    repository.getStatistics.mockResolvedValue(mockStatistics);

    await useCase.execute(baseRequest);

    expect(logger.info).toHaveBeenCalledWith(
      'Getting provider statistics',
      expect.objectContaining({
        requestedBy: baseRequest.requestedBy,
        requestedByRole: baseRequest.requestedByRole
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Provider statistics retrieved successfully',
      expect.objectContaining({
        requestedBy: baseRequest.requestedBy,
        totalProviders: 100
      })
    );
  });
});

