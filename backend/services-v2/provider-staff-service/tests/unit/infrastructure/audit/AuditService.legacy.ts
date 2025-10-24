/**
 * AuditService Tests
 * @version 2.0.0
 */

import { AuditService } from '../../../../src/infrastructure/audit/AuditService';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { AuditLogEntry } from '../../../../src/application/interfaces/IAuditService';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn()
  }))
}));

describe('AuditService', () => {
  let auditService: AuditService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as any;

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn()
    };

    auditService = new AuditService({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      logger: mockLogger,
      serviceName: 'test-service'
    });
  });

  describe('logDataAccess', () => {
    it('should log data access event', async () => {
      const entry: AuditLogEntry = {
        action: 'READ',
        resourceType: 'Staff',
        resourceId: 'staff-123',
        userId: 'user-123',
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      };

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await auditService.logDataAccess(entry);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Audit log written successfully',
        expect.any(Object)
      );
    });

    it('should handle database write failures gracefully', async () => {
      const entry: AuditLogEntry = {
        action: 'READ',
        resourceType: 'Staff',
        resourceId: 'staff-123',
        userId: 'user-123',
        timestamp: new Date()
      };

      mockSupabaseClient.insert.mockResolvedValue({ 
        error: { message: 'Database error' } 
      });

      await auditService.logDataAccess(entry);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to write audit log to database',
        expect.any(Object)
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AUDIT_LOG_FALLBACK',
        expect.any(Object)
      );
    });

    it('should log PHI access', async () => {
      const entry: AuditLogEntry = {
        action: 'READ',
        resourceType: 'Staff',
        resourceId: 'staff-123',
        userId: 'user-123',
        timestamp: new Date(),
        details: {
          containsPHI: true,
          complianceLevel: 'hipaa'
        }
      };

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await auditService.logDataAccess(entry);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should log fatal error on complete failure', async () => {
      const entry: AuditLogEntry = {
        action: 'READ',
        resourceType: 'Staff',
        resourceId: 'staff-123',
        userId: 'user-123',
        timestamp: new Date()
      };

      mockSupabaseClient.insert.mockRejectedValue(new Error('Complete failure'));

      await auditService.logDataAccess(entry);

      expect(mockLogger.fatal).toHaveBeenCalledWith(
        'AUDIT_LOG_FAILURE',
        expect.any(Object)
      );
    });
  });

  describe('logDataModification', () => {
    it('should log data modification with MODIFY prefix', async () => {
      const entry: AuditLogEntry = {
        action: 'UPDATE',
        resourceType: 'Staff',
        resourceId: 'staff-123',
        userId: 'user-123',
        timestamp: new Date()
      };

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await auditService.logDataModification(entry);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with SECURITY prefix', async () => {
      const entry: AuditLogEntry = {
        action: 'LOGIN_FAILED',
        resourceType: 'Auth',
        resourceId: 'user-123',
        userId: 'user-123',
        timestamp: new Date()
      };

      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await auditService.logSecurityEvent(entry);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs with filters', async () => {
      const mockData = [{
        action: 'READ',
        resource_type: 'Staff',
        resource_id: 'staff-123',
        user_id: 'user-123',
        timestamp: new Date().toISOString(),
        details: {},
        ip_address: '127.0.0.1',
        user_agent: 'Test',
        session_id: 'session-123'
      }];

      mockSupabaseClient.limit.mockResolvedValue({ 
        data: mockData, 
        error: null 
      });

      const result = await auditService.queryAuditLogs({
        userId: 'user-123',
        resourceType: 'Staff'
      });

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('READ');
    });

    it('should return empty array on query error', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: null, 
        error: { message: 'Query failed' } 
      });

      const result = await auditService.queryAuditLogs({});

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      const mockData = [
        { action: 'READ', resource_type: 'Staff', details: {} },
        { action: 'READ', resource_type: 'Staff', details: { containsPHI: true } },
        { action: 'SECURITY_LOGIN', resource_type: 'Auth', details: {} }
      ];

      mockSupabaseClient.lte.mockResolvedValue({ 
        data: mockData, 
        error: null 
      });

      const stats = await auditService.getAuditStatistics({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      expect(stats.totalEvents).toBe(3);
      expect(stats.securityEvents).toBe(1);
      expect(stats.phiAccessEvents).toBe(1);
      expect(stats.eventsByAction['READ']).toBe(2);
    });

    it('should return zeros on error', async () => {
      mockSupabaseClient.lte.mockResolvedValue({ 
        data: null, 
        error: { message: 'Error' } 
      });

      const stats = await auditService.getAuditStatistics({});

      expect(stats.totalEvents).toBe(0);
      expect(stats.securityEvents).toBe(0);
    });
  });

  describe('isHealthy', () => {
    it('should return true when healthy', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: [{ id: '1' }], 
        error: null 
      });

      const healthy = await auditService.isHealthy();

      expect(healthy).toBe(true);
    });

    it('should return false on database error', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection failed' } 
      });

      const healthy = await auditService.isHealthy();

      expect(healthy).toBe(false);
    });
  });
});
