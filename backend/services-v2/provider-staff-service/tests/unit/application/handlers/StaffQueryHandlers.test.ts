/**
 * StaffQueryHandlers Unit Tests (v2 alignment)
 */

import { StaffQueryHandlers } from '../../../../src/application/handlers/StaffQueryHandlers';
import { GetStaffProfileUseCase } from '../../../../src/application/use-cases/GetStaffProfileUseCase';
import { SearchStaffUseCase } from '../../../../src/application/use-cases/SearchStaffUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { createTestStaff } from '../../../helpers/mockFactories';

const now = new Date();

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    log: jest.fn()
  } as unknown as jest.Mocked<ILogger>;
}

describe('StaffQueryHandlers', () => {
  let mockProfileUseCase: jest.Mocked<GetStaffProfileUseCase>;
  let mockSearchUseCase: jest.Mocked<SearchStaffUseCase>;
  let mockRepository: jest.Mocked<IProviderStaffRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let handlers: StaffQueryHandlers;

  beforeEach(() => {
    mockProfileUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<GetStaffProfileUseCase>;

    mockSearchUseCase = {
      execute: jest.fn()
    } as unknown as jest.Mocked<SearchStaffUseCase>;

    mockRepository = {
      findAll: jest.fn()
    } as unknown as jest.Mocked<IProviderStaffRepository>;

    mockLogger = createMockLogger();

    handlers = new StaffQueryHandlers(
      mockProfileUseCase,
      mockSearchUseCase,
      mockRepository,
      mockLogger
    );
  });

  describe('handleGetStaffProfile', () => {
    it('delegates to GetStaffProfileUseCase for valid query', async () => {
      const query = {
        queryId: 'query-001',
        queryType: 'GetStaffProfile' as const,
        timestamp: now,
        requestedBy: 'admin-001',
        data: {
          staffId: 'DOC-CARD-202501-001',
          requestedBy: 'admin-001',
          requestedByRole: 'ADMIN'
        }
      };

      const response = { success: true, message: 'ok' };
      mockProfileUseCase.execute.mockResolvedValue(response as any);

      const result = await handlers.handleGetStaffProfile(query);

      expect(result).toBe(response);
      expect(mockProfileUseCase.execute).toHaveBeenCalledWith(query.data);
    });

    it('returns validation failure when identifiers missing', async () => {
      const query = {
        queryId: 'query-002',
        queryType: 'GetStaffProfile' as const,
        timestamp: now,
        requestedBy: 'admin-001',
        data: {
          requestedBy: 'admin-001',
          requestedByRole: 'ADMIN'
        }
      };

      const result = await handlers.handleGetStaffProfile(query as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không hợp lệ');
      expect(mockProfileUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleGetStaffList', () => {
    it('rejects unauthorized roles', async () => {
      const query = {
        queryId: 'query-003',
        queryType: 'GetStaffList' as const,
        timestamp: now,
        requestedBy: 'user-001',
        data: {
          requestedBy: 'user-001',
          requestedByRole: 'patient',
          pagination: { page: 1, limit: 10 }
        }
      };

      const result = await handlers.handleGetStaffList(query as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('returns paginated staff list for authorized role', async () => {
      const staff = createTestStaff({ staffId: 'DOC-CARD-202501-002' });
      mockRepository.findAll.mockResolvedValue([staff]);

      const query = {
        queryId: 'query-004',
        queryType: 'GetStaffList' as const,
        timestamp: now,
        requestedBy: 'admin-001',
        data: {
          requestedBy: 'admin-001',
          requestedByRole: 'admin',
          pagination: { page: 1, limit: 10 }
        }
      };

      const result = await handlers.handleGetStaffList(query as any);

      expect(result.success).toBe(true);
      expect(result.data?.staff).toHaveLength(1);
      expect(result.data?.staff[0]).toMatchObject({
        staffId: 'DOC-CARD-202501-002',
        staffType: 'doctor'
      });
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('handleGetStaffStatistics', () => {
    it('rejects unauthorized roles', async () => {
      const query = {
        queryId: 'query-005',
        queryType: 'GetStaffStatistics' as const,
        timestamp: now,
        requestedBy: 'user-001',
        data: {
          requestedBy: 'user-001',
          requestedByRole: 'doctor'
        }
      };

      const result = await handlers.handleGetStaffStatistics(query as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
    });

    it('returns aggregated statistics for authorized role', async () => {
      const staffA = createTestStaff({ staffId: 'DOC-CARD-202501-010', staffType: 'doctor' });
      const staffB = createTestStaff({ staffId: 'NUR-EMRG-202501-011', staffType: 'nurse' });
      (staffB as any).props.status = 'inactive';
      (staffB as any).props.isActive = false;

      mockRepository.findAll.mockResolvedValue([staffA, staffB]);

      const query = {
        queryId: 'query-006',
        queryType: 'GetStaffStatistics' as const,
        timestamp: now,
        requestedBy: 'admin-001',
        data: {
          requestedBy: 'admin-001',
          requestedByRole: 'admin',
          groupBy: 'staffType' as const
        }
      };

      const result = await handlers.handleGetStaffStatistics(query as any);

      expect(result.success).toBe(true);
      expect(result.data?.statistics.totalStaff).toBe(2);
      expect(result.data?.statistics.activeStaff).toBeGreaterThan(0);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('handleQuery', () => {
    it('logs warning for unsupported query type', async () => {
      const result = await handlers.handleQuery({
        queryId: 'query-unknown',
        queryType: 'UnknownQuery' as any,
        timestamp: now,
        requestedBy: 'user-001',
        data: {}
      } as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('không được hỗ trợ');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unknown query type',
        expect.objectContaining({ queryType: 'UnknownQuery' })
      );
    });
  });
});
