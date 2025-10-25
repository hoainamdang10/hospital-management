import axios from 'axios';
import { DepartmentServiceClient } from '../../../../src/infrastructure/clients/DepartmentServiceClient';
import { createMockLogger } from '../../../helpers/mockFactories';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DepartmentServiceClient', () => {
  const baseConfig = {
    baseUrl: 'https://department-service.test',
    timeout: 1000,
    retryAttempts: 3,
    retryDelay: 10
  };

  const buildAxiosInstance = () => {
    const requestUse = jest.fn();
    const responseUse = jest
      .fn()
      .mockImplementation((_success, _error) => undefined);

    return {
      get: jest.fn(),
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse }
      }
    };
  };

  let axiosInstance: ReturnType<typeof buildAxiosInstance>;
  const logger = createMockLogger();

  beforeEach(() => {
    jest.clearAllMocks();
    axiosInstance = buildAxiosInstance();
    mockedAxios.create.mockReturnValue(axiosInstance as any);
  });

  it('trả về dữ liệu phòng ban khi gọi getDepartmentById thành công', async () => {
    const department = {
      id: 'DEPT-001',
      name: 'Cardiology',
      isActive: true
    };

    axiosInstance.get.mockResolvedValue({
      data: { success: true, data: department }
    });

    const client = new DepartmentServiceClient(baseConfig, logger);
    const result = await client.getDepartmentById('DEPT-001');

    expect(result).toEqual(department);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/api/departments/DEPT-001'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('không gọi API khi circuit breaker đang mở', async () => {
    const client = new DepartmentServiceClient(baseConfig, logger);
    (client as any).circuitBreakerOpen = true;
    (client as any).circuitBreakerResetTime = Date.now() + 60_000;

    const result = await client.getDepartmentById('DEPT-002');

    expect(result).toBeNull();
    expect(axiosInstance.get).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Circuit breaker open - skipping Department Service call'
    );
  });

  it('tự động retry khi gặp lỗi tạm thời và thành công ở lần sau', async () => {
    const axiosError = Object.assign(new Error('timeout'), {
      isAxiosError: true
    });

    axiosInstance.get
      .mockRejectedValueOnce(axiosError)
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 'DEPT-003', isActive: true } }
      });

    const delaySpy = jest
      .spyOn(DepartmentServiceClient.prototype as any, 'delay')
      .mockResolvedValue(undefined);

    const client = new DepartmentServiceClient(baseConfig, logger);
    const result = await client.getDepartmentById('DEPT-003');

    expect(result?.id).toBe('DEPT-003');
    expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(
      'Retrying request (attempt 2/3)'
    );

    delaySpy.mockRestore();
  });

  it('trả về false khi healthCheck gặp lỗi', async () => {
    axiosInstance.get.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const client = new DepartmentServiceClient(baseConfig, logger);
    const result = await client.healthCheck();

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      'Department Service health check failed',
      expect.objectContaining({
        error: 'connect ECONNREFUSED'
      })
    );
  });
});

