import { createClient } from '@supabase/supabase-js';
import { SupabaseProviderStaffRepository } from '@infrastructure/repositories/SupabaseProviderStaffRepository';
import { CircuitBreakerFactory } from '@infrastructure/resilience/CircuitBreaker';
import { StaffId } from '@domain/value-objects/StaffId';
import { ProviderStaff } from '@domain/aggregates/ProviderStaff';
import { IAuditService } from '@application/interfaces/IAuditService';
import { createMockLogger, createTestStaff } from '@tests/helpers/mockFactories';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('SupabaseProviderStaffRepository', () => {
  const createClientMock = createClient as jest.Mock;

  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockInsert: jest.Mock;
  let mockInsertSelect: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockUpdateEq: jest.Mock;
  let mockUpdateSelect: jest.Mock;
  let repository: SupabaseProviderStaffRepository;
  let logger: ReturnType<typeof createMockLogger>;
  let auditService: jest.Mocked<IAuditService>;
  let breakerExecuteMock: jest.Mock;

  beforeEach(() => {
    mockSingle = jest.fn();

    const selectChainResult = {
      eq: (valueField: string, value: string) => mockEq(valueField, value),
      single: () => mockSingle()
    };

    mockEq = jest.fn().mockReturnValue({
      single: () => mockSingle(),
      select: () => selectChainResult
    });

    mockSelect = jest.fn().mockReturnValue({
      eq: (field: string, value: string) => mockEq(field, value),
      single: () => mockSingle()
    });

    mockInsertSelect = jest.fn().mockReturnValue({ single: () => mockSingle() });
    mockInsert = jest.fn().mockReturnValue({
      select: () => mockInsertSelect()
    });

    mockUpdateSelect = jest.fn().mockReturnValue({ single: () => mockSingle() });
    mockUpdateEq = jest.fn().mockReturnValue({
      select: () => mockUpdateSelect()
    });
    mockUpdate = jest.fn().mockReturnValue({
      eq: (field: string, value: string) => mockUpdateEq(field, value),
      select: () => mockUpdateSelect()
    });

    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    });

    const mockSupabaseClient = { from: mockFrom };
    createClientMock.mockReturnValue(mockSupabaseClient);

    breakerExecuteMock = jest.fn(async (operation: () => Promise<any>, fallback?: () => Promise<any>) => {
      try {
        return await operation();
      } catch (error) {
        if (fallback) {
          return await fallback();
        }
        throw error;
      }
    });

    jest
      .spyOn(CircuitBreakerFactory, 'getBreaker')
      .mockReturnValue({ execute: breakerExecuteMock } as any);

    logger = createMockLogger();
    auditService = {
      logDataAccess: jest.fn().mockResolvedValue(undefined),
      logDataModification: jest.fn().mockResolvedValue(undefined),
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
      logAction: jest.fn().mockResolvedValue(undefined)
    };

    repository = new SupabaseProviderStaffRepository(
      'https://example.supabase.co',
      'service-role-key',
      logger,
      auditService
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    CircuitBreakerFactory.resetAll();
  });

  it('findById trả về ProviderStaff khi dữ liệu tồn tại', async () => {
    const staff = createTestStaff({});
    const persistenceData = { id: 'uuid-1', staff_id: staff.staffIdValue };
    mockSingle.mockResolvedValue({ data: persistenceData, error: null });

    const fromPersistenceSpy = jest
      .spyOn(ProviderStaff, 'fromPersistenceData')
      .mockReturnValue(staff);

    const result = await repository.findById(StaffId.fromString(staff.staffIdValue));

    expect(result).toBe(staff);
    expect(mockFrom).toHaveBeenCalledWith('staff_profiles');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('staff_id', staff.staffIdValue);
    expect(auditService.logDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STAFF_READ',
        details: expect.objectContaining({ operation: 'findById' })
      })
    );
    expect(fromPersistenceSpy).toHaveBeenCalledWith(persistenceData);

    fromPersistenceSpy.mockRestore();
  });

  it('findById trả về null khi không tìm thấy bản ghi', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' }
    });

    const staffId = StaffId.fromString('DOC-CARD-202501-999');
    const result = await repository.findById(staffId);

    expect(result).toBeNull();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Staff not found'),
      expect.objectContaining({ staffId: staffId.value })
    );
    expect(auditService.logDataAccess).not.toHaveBeenCalled();
  });

  it('findById kích hoạt fallback circuit breaker khi Supabase lỗi', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'Database error' }
    });

    const staffId = StaffId.fromString('DOC-CARD-202501-120');
    const result = await repository.findById(staffId);

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error finding staff by business ID'),
      expect.objectContaining({ staffId: staffId.value })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Circuit breaker fallback for findById'),
      expect.objectContaining({ staffId: staffId.value })
    );
    expect(auditService.logDataAccess).not.toHaveBeenCalled();
    expect(breakerExecuteMock).toHaveBeenCalled();
  });

  it('findByUserId trả về ProviderStaff và ghi audit', async () => {
    const staff = createTestStaff({});
    const persistenceData = { id: 'uuid-2', staff_id: staff.staffIdValue };
    mockSingle.mockResolvedValue({ data: persistenceData, error: null });

    const fromPersistenceSpy = jest
      .spyOn(ProviderStaff, 'fromPersistenceData')
      .mockReturnValue(staff);

    const result = await repository.findByUserId('user-123');

    expect(result).toBe(staff);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(auditService.logDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STAFF_READ',
        details: expect.objectContaining({ operation: 'findByUserId' })
      })
    );

    fromPersistenceSpy.mockRestore();
  });

  it('save tạo mới nhân viên khi chưa tồn tại', async () => {
    const staff = createTestStaff({});
    const persistenceData = { id: 'uuid-3', staff_id: staff.staffIdValue };
    const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValueOnce(null);
    const toPersistenceSpy = jest
      .spyOn(ProviderStaff.prototype, 'toPersistence')
      .mockReturnValueOnce(persistenceData as any);
    mockSingle.mockResolvedValue({ data: persistenceData, error: null });

    await repository.save(staff);

    expect(mockInsert).toHaveBeenCalledWith(persistenceData);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(auditService.logDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STAFF_CREATE',
        details: expect.objectContaining({ operation: 'create' })
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Staff saved successfully'),
      expect.objectContaining({ operation: 'create' })
    );

    findByIdSpy.mockRestore();
    toPersistenceSpy.mockRestore();
  });

  it('save cập nhật nhân viên khi đã tồn tại', async () => {
    const staff = createTestStaff({});
    const persistenceData = { id: 'uuid-4', staff_id: staff.staffIdValue };
    const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValueOnce(staff);
    const toPersistenceSpy = jest
      .spyOn(ProviderStaff.prototype, 'toPersistence')
      .mockReturnValueOnce(persistenceData as any);
    mockSingle.mockResolvedValue({ data: persistenceData, error: null });

    await repository.save(staff);

    expect(mockUpdate).toHaveBeenCalledWith(persistenceData);
    expect(mockUpdateEq).toHaveBeenCalledWith('staff_id', staff.staffIdValue);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(auditService.logDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STAFF_UPDATE',
        details: expect.objectContaining({ operation: 'update' })
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Staff saved successfully'),
      expect.objectContaining({ operation: 'update' })
    );

    findByIdSpy.mockRestore();
    toPersistenceSpy.mockRestore();
  });
});
