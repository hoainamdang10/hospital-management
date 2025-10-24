import { createClient } from '@supabase/supabase-js';
import { ProviderStaffHealthCheck } from '@infrastructure/monitoring/HealthChecks';
import { createMockLogger } from '@tests/helpers/mockFactories';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('ProviderStaffHealthCheck', () => {
  const createClientMock = createClient as jest.Mock;

  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockLimit: jest.Mock;
  let healthCheck: ProviderStaffHealthCheck;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
    mockSelect = jest.fn().mockReturnValue({ limit: mockLimit });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    createClientMock.mockReturnValue({ from: mockFrom });

    logger = createMockLogger();
    healthCheck = new ProviderStaffHealthCheck(
      'https://example.supabase.co',
      'service-role-key',
      logger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checkHealth trả về HEALTHY khi database hoạt động bình thường', async () => {
    const result = await healthCheck.checkHealth();

    expect(result.overall).toBe('HEALTHY');
    expect(result.components.database.status).toBe('HEALTHY');
    expect(mockFrom).toHaveBeenCalledWith('staff_profiles');
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Health check completed'),
      expect.objectContaining({ overall: 'HEALTHY' })
    );
  });

  it('checkHealth trả về DEGRADED khi thời gian phản hồi database cao', async () => {
    const dateSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000) // checkHealth start
      .mockReturnValueOnce(1_000) // checkDatabase start
      .mockReturnValueOnce(2_400) // after query (response time = 1_400)
      .mockReturnValueOnce(2_600); // total duration

    const result = await healthCheck.checkHealth();

    expect(result.overall).toBe('DEGRADED');
    expect(result.components.database.status).toBe('DEGRADED');

    dateSpy.mockRestore();
  });

  it('checkHealth trả về UNHEALTHY khi database trả về lỗi', async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: 'timeout' }
    });

    const result = await healthCheck.checkHealth();

    expect(result.overall).toBe('UNHEALTHY');
    expect(result.components.database.status).toBe('UNHEALTHY');
    expect(logger.warn).toHaveBeenCalledWith(
      'Database health check failed',
      expect.objectContaining({ error: 'timeout' })
    );
  });

  it('quickCheck trả về false khi truy vấn lỗi', async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: 'query failed' }
    });

    const isHealthy = await healthCheck.quickCheck();

    expect(isHealthy).toBe(false);
  });
});
