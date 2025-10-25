import { createClient } from '@supabase/supabase-js';
import { AuditService } from '../../../../src/infrastructure/audit/AuditService';
import { AuditLogEntry } from '../../../../src/application/interfaces/IAuditService';
import { createMockLogger } from '../../../helpers/mockFactories';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const entry: AuditLogEntry = {
  action: 'READ_STAFF',
  resourceType: 'provider_staff',
  resourceId: 'STF-001',
  userId: 'admin-user',
  timestamp: new Date('2025-01-01T00:00:00.000Z'),
  details: { containsPHI: false }
};

const buildQueryBuilder = (result: any) => {
  const builder: any = {};
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.gte = jest.fn().mockReturnValue(builder);
  builder.lte = jest.fn().mockReturnValue(builder);
  builder.order = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn().mockReturnValue(builder);
  builder.then = (resolve: any, reject?: any) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
};

describe('AuditService', () => {
  const logger = createMockLogger();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createService = (overrides: any) => {
    mockedCreateClient.mockReturnValue(overrides);
    return new AuditService({
      supabaseUrl: 'https://supabase.test',
      supabaseKey: 'service-key',
      logger
    });
  };

  it('ghi log truy cập thành công vào Supabase', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const fromMock = jest.fn().mockReturnValue({
      insert: insertMock
    });

    const service = createService({ from: fromMock });
    await service.logDataAccess(entry);

    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload.service_name).toBe('provider-staff-service');
    expect(logger.debug).toHaveBeenCalledWith(
      'Audit log written successfully',
      expect.objectContaining({
        action: entry.action,
        resourceType: entry.resourceType
      })
    );
  });

  it('ghi nhận fallback khi Supabase trả về lỗi', async () => {
    const insertMock = jest
      .fn()
      .mockResolvedValue({ error: { message: 'db failure' } });
    const fromMock = jest.fn().mockReturnValue({
      insert: insertMock
    });

    const service = createService({ from: fromMock });
    await service.logDataAccess(entry);

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to write audit log to database',
      expect.objectContaining({
        action: entry.action,
        resourceType: entry.resourceType,
        error: 'db failure'
      })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'AUDIT_LOG_FALLBACK',
      expect.objectContaining({
        action: entry.action,
        service_name: 'provider-staff-service',
        fallback_reason: 'database_write_failed'
      })
    );
  });

  it('ghi nhận fatal khi logDataAccess ném exception', async () => {
    const insertMock = jest
      .fn()
      .mockRejectedValue(new Error('connection lost'));
    const fromMock = jest.fn().mockReturnValue({
      insert: insertMock
    });

    const service = createService({ from: fromMock });
    await service.logDataAccess(entry);

    expect(logger.error).toHaveBeenCalledWith(
      'Audit logging failed',
      expect.objectContaining({
        action: entry.action,
        resourceType: entry.resourceType,
        error: 'connection lost'
      })
    );
    expect(logger.fatal).toHaveBeenCalledWith(
      'AUDIT_LOG_FAILURE',
      expect.objectContaining({
        action: entry.action,
        resourceId: entry.resourceId,
        userId: entry.userId
      })
    );
  });

  it('trả về danh sách audit logs đã được map', async () => {
    const dataRow = {
      action: 'READ',
      resource_type: 'provider_staff',
      resource_id: 'STF-100',
      user_id: 'user-1',
      timestamp: '2025-01-02T00:00:00.000Z',
      details: { containsPHI: true },
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      session_id: 'session-1'
    };
    const selectBuilder = buildQueryBuilder({ data: [dataRow], error: null });
    const fromMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(selectBuilder)
    });

    const service = createService({ from: fromMock });
    const result = await service.queryAuditLogs({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      action: dataRow.action,
      resourceType: dataRow.resource_type,
      ipAddress: dataRow.ip_address,
      details: dataRow.details
    });
    expect(selectBuilder.order).toHaveBeenCalledWith('timestamp', {
      ascending: false
    });
  });

  it('tính toán thống kê audit chính xác', async () => {
    const dataRows = [
      {
        action: 'SECURITY_ALERT',
        resource_type: 'provider_staff',
        details: { containsPHI: true }
      },
      {
        action: 'MODIFY_STAFF',
        resource_type: 'provider_staff',
        details: { containsPHI: false }
      }
    ];
    const selectBuilder = buildQueryBuilder({ data: dataRows, error: null });
    const fromMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(selectBuilder)
    });

    const service = createService({ from: fromMock });
    const stats = await service.getAuditStatistics({});

    expect(stats.totalEvents).toBe(2);
    expect(stats.eventsByAction).toMatchObject({
      SECURITY_ALERT: 1,
      MODIFY_STAFF: 1
    });
    expect(stats.securityEvents).toBe(1);
    expect(stats.phiAccessEvents).toBe(1);
  });

  it('health check trả về false khi truy vấn lỗi', async () => {
    const builder = buildQueryBuilder({ error: { message: 'db-error' } });
    const fromMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue(builder)
    });

    const service = createService({ from: fromMock });
    const isHealthy = await service.isHealthy();

    expect(isHealthy).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
