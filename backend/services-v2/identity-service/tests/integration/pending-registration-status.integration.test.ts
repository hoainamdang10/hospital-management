/**
 * Integration Tests for Pending Registration Status Management
 * Tests status transitions and cleanup functionality
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePendingRegistrationRepository } from '../../src/infrastructure/repositories/SupabasePendingRegistrationRepository';
import { PendingRegistration } from '../../src/domain/entities/PendingRegistration';
import { Email } from '../../src/domain/value-objects/Email';
import { ILogger } from '../../src/application/services/ILogger';
import { ICircuitBreaker } from '../../src/application/services/ICircuitBreaker';
import { createTestSupabaseClient } from '../helpers/integrationHelpers';

describe('Pending Registration Status Integration Tests', () => {
  let supabase: SupabaseClient;
  let repository: SupabasePendingRegistrationRepository;
  let logger: ILogger;
  let circuitBreaker: ICircuitBreaker;

  const testEmail = `test-status-${Date.now()}@example.com`;
  const testPasswordHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
  const testUserData = {
    fullName: 'Test Status User',
    phoneNumber: '0901234567',
    roleType: 'patient'
  };
  const testToken = `test-token-${Date.now()}`;

  beforeAll(() => {
    supabase = createTestSupabaseClient();

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as unknown as ILogger;

    circuitBreaker = {
      execute: jest.fn((fn) => fn()),
      isOpen: jest.fn(() => false),
      reset: jest.fn(),
      getState: jest.fn(() => 'CLOSED' as any),
      getMetrics: jest.fn(() => ({
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        stateChanges: []
      }))
    } as unknown as ICircuitBreaker;

    repository = new SupabasePendingRegistrationRepository({
      supabase,
      logger,
      circuitBreaker,
      tableName: 'pending_registrations'
    });
  });

  afterEach(async () => {
    // Cleanup test data
    try {
      await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .delete()
        .like('email', 'test-status-%');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Status Persistence', () => {
    it('should store pending registration with PENDING status', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);

      // Verify in database
      const { data, error } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('PENDING');
      expect(data.email).toBe(testEmail);
    });

    it('should retrieve pending registration with status', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);

      const retrieved = await repository.findByEmail(email);

      expect(retrieved).toBeDefined();
      expect(retrieved!.status).toBe('PENDING');
      expect(retrieved!.id).toBe(pending.id);
    });
  });

  describe('updateStatus', () => {
    it('should update status to EMAIL_SENT', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'EMAIL_SENT');

      // Verify in database
      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('status')
        .eq('id', pending.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.status).toBe('EMAIL_SENT');
    });

    it('should update status to FAILED', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'FAILED');

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('status')
        .eq('id', pending.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.status).toBe('FAILED');
    });

    it('should update status to VERIFIED', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'VERIFIED');

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('status')
        .eq('id', pending.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.status).toBe('VERIFIED');
    });

    it('should update status to EXPIRED', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'EXPIRED');

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('status')
        .eq('id', pending.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.status).toBe('EXPIRED');
    });

    it('should log audit event when updating status', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'EMAIL_SENT');

      // Check audit log
      const { data: auditLogs } = await supabase
        .schema('auth_schema')
        .from('audit_logs')
        .select('*')
        .eq('action', 'PENDING_REGISTRATION_STATUS_UPDATED')
        .eq('resource_id', pending.id)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(auditLogs).toBeDefined();
      expect(auditLogs!.length).toBeGreaterThan(0);
      expect(auditLogs![0].details.status).toBe('EMAIL_SENT');
    });
  });

  describe('markAsUsed with status', () => {
    it('should mark as used and set status to VERIFIED', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.markAsUsed(pending.id);

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id)
        .single();

      expect(data.is_used).toBe(true);
      expect(data.status).toBe('VERIFIED');
    });
  });

  describe('Unique Constraint with Status', () => {
    it('should allow same email with different statuses', async () => {
      const email = Email.create(testEmail);

      // Create first registration
      const pending1 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-1',
        24
      );
      await repository.store(pending1);

      // Mark as VERIFIED (no longer active)
      await repository.updateStatus(pending1.id, 'VERIFIED');

      // Should allow creating new registration with same email
      const pending2 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-2',
        24
      );

      await expect(repository.store(pending2)).resolves.not.toThrow();
    });

    it('should prevent duplicate active registrations (PENDING)', async () => {
      const email = Email.create(testEmail);

      const pending1 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-1',
        24
      );
      await repository.store(pending1);

      const pending2 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-2',
        24
      );

      await expect(repository.store(pending2)).rejects.toThrow();
    });

    it('should prevent duplicate active registrations (EMAIL_SENT)', async () => {
      const email = Email.create(testEmail);

      const pending1 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-1',
        24
      );
      await repository.store(pending1);
      await repository.updateStatus(pending1.id, 'EMAIL_SENT');

      const pending2 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-2',
        24
      );

      await expect(repository.store(pending2)).rejects.toThrow();
    });

    it('should allow new registration after marking as FAILED', async () => {
      const email = Email.create(testEmail);

      const pending1 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-1',
        24
      );
      await repository.store(pending1);
      await repository.updateStatus(pending1.id, 'FAILED');

      const pending2 = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken + '-2',
        24
      );

      await expect(repository.store(pending2)).resolves.not.toThrow();
    });
  });

  describe('Cleanup Function', () => {
    it('should delete VERIFIED records', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'VERIFIED');

      // Call cleanup function
      const { data: result } = await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      expect(result).toBeGreaterThan(0);

      // Verify record deleted
      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id);

      expect(data).toHaveLength(0);
    });

    it('should delete FAILED records', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'FAILED');

      const { data: result } = await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      expect(result).toBeGreaterThan(0);

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id);

      expect(data).toHaveLength(0);
    });

    it('should delete EXPIRED records', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'EXPIRED');

      const { data: result } = await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      expect(result).toBeGreaterThan(0);

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id);

      expect(data).toHaveLength(0);
    });

    it('should NOT delete PENDING records', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);

      await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id);

      expect(data).toHaveLength(1);
      expect(data).not.toBeNull();
      expect(data![0].status).toBe('PENDING');
    });

    it('should NOT delete EMAIL_SENT records that are not expired', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'EMAIL_SENT');

      await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('*')
        .eq('id', pending.id);

      expect(data).toHaveLength(1);
      expect(data).not.toBeNull();
      expect(data![0].status).toBe('EMAIL_SENT');
    });

    it('should log cleanup operation to audit logs', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);
      await repository.updateStatus(pending.id, 'VERIFIED');

      await supabase
        .schema('auth_schema')
        .rpc('cleanup_expired_pending_registrations');

      // Check audit log
      const { data: auditLogs } = await supabase
        .schema('auth_schema')
        .from('audit_logs')
        .select('*')
        .eq('action', 'CLEANUP_PENDING_REGISTRATIONS')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(auditLogs).toBeDefined();
      expect(auditLogs!.length).toBeGreaterThan(0);
      expect(auditLogs![0].details.deleted_count).toBeGreaterThan(0);
    });
  });

  describe('Mark as Failed Function', () => {
    it('should mark registration as failed using database function', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);

      // Call database function
      await supabase
        .schema('auth_schema')
        .rpc('mark_pending_registration_failed', { p_id: pending.id });

      const { data } = await supabase
        .schema('auth_schema')
        .from('pending_registrations')
        .select('status')
        .eq('id', pending.id)
        .single();

      expect(data).not.toBeNull();
      expect(data!.status).toBe('FAILED');
    });

    it('should log audit event when marking as failed', async () => {
      const email = Email.create(testEmail);
      const pending = PendingRegistration.create(
        email,
        testPasswordHash,
        testUserData,
        testToken,
        24
      );

      await repository.store(pending);

      await supabase
        .schema('auth_schema')
        .rpc('mark_pending_registration_failed', { p_id: pending.id });

      const { data: auditLogs } = await supabase
        .schema('auth_schema')
        .from('audit_logs')
        .select('*')
        .eq('action', 'PENDING_REGISTRATION_MARKED_FAILED')
        .eq('resource_id', pending.id)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(auditLogs).toBeDefined();
      expect(auditLogs!.length).toBeGreaterThan(0);
    });
  });
});
