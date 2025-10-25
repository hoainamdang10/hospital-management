/**
 * Integration Tests for Event Consumption Flow
 * Tests RabbitMQ → Handler → Database flow
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Integration Testing
 */

import { InboxService } from '@infrastructure/inbox/InboxService';
import { StaffCredentialEventHandler } from '@application/event-handlers/StaffCredentialEventHandler';
import { LockAccountUseCase } from '@application/use-cases/LockAccountUseCase';
import { UnlockAccountUseCase } from '@application/use-cases/UnlockAccountUseCase';
import { TerminateAllSessionsUseCase } from '@application/use-cases/TerminateAllSessionsUseCase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Event Consumption Flow Integration Tests', () => {
  let supabaseClient: SupabaseClient;
  let inboxService: InboxService;
  let staffCredentialHandler: StaffCredentialEventHandler;
  let lockAccountUseCase: LockAccountUseCase;
  let unlockAccountUseCase: UnlockAccountUseCase;
  let terminateAllSessionsUseCase: TerminateAllSessionsUseCase;
  let logger: any;

  beforeAll(() => {
    // Initialize Supabase client
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Initialize services (mocked use cases for integration test)
    inboxService = new InboxService(supabaseClient, logger);
    
    lockAccountUseCase = { execute: jest.fn() } as any;
    unlockAccountUseCase = { execute: jest.fn() } as any;
    terminateAllSessionsUseCase = { execute: jest.fn() } as any;

    staffCredentialHandler = new StaffCredentialEventHandler(
      lockAccountUseCase,
      unlockAccountUseCase,
      terminateAllSessionsUseCase,
      inboxService,
      supabaseClient,
      logger
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .delete()
      .like('event_id', 'test-evt-%');
  });

  describe('Event Processing Flow', () => {
    it('should process event and store in inbox', async () => {
      const testEvent = {
        eventId: 'test-evt-001',
        staffId: 'test-staff-001',
        credentialNumber: 'TEST-CRED-001',
        credentialType: 'MEDICAL_LICENSE',
        issuingAuthority: 'Test Authority',
        verifiedAt: new Date()
      };

      // Process event
      await staffCredentialHandler.handleStaffCredentialVerified(testEvent);

      // Verify event stored in inbox
      const { data, error } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', 'test-evt-001')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.event_type).toBe('StaffCredentialVerifiedEvent');
      expect(data.status).toBe('PROCESSED');
      expect(data.processed_at).not.toBeNull();
    });

    it('should enforce idempotency - duplicate event ignored', async () => {
      const testEvent = {
        eventId: 'test-evt-002',
        staffId: 'test-staff-002',
        credentialNumber: 'TEST-CRED-002',
        credentialType: 'MEDICAL_LICENSE',
        issuingAuthority: 'Test Authority',
        verifiedAt: new Date()
      };

      // Process event first time
      await staffCredentialHandler.handleStaffCredentialVerified(testEvent);

      // Process same event again
      await staffCredentialHandler.handleStaffCredentialVerified(testEvent);

      // Verify only one record in inbox
      const { data, error } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', 'test-evt-002');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].status).toBe('PROCESSED');
    });

    it('should mark event as failed on processing error', async () => {
      const testEvent = {
        eventId: 'test-evt-003',
        staffId: 'test-staff-003',
        credentialNumber: 'TEST-CRED-003',
        credentialType: 'MEDICAL_LICENSE',
        issuingAuthority: 'Test Authority',
        verifiedAt: new Date()
      };

      // Mock use case to throw error
      lockAccountUseCase.execute = jest.fn().mockRejectedValue(new Error('Test error'));

      // Create handler that will fail
      const failingHandler = new StaffCredentialEventHandler(
        lockAccountUseCase,
        unlockAccountUseCase,
        terminateAllSessionsUseCase,
        inboxService,
        supabaseClient,
        logger
      );

      const statusChangedEvent = {
        eventId: 'test-evt-003',
        staffId: 'test-staff-003',
        oldStatus: 'active',
        newStatus: 'suspended',
        reason: 'Test',
        changedBy: 'admin'
      };

      // Process event (should fail)
      try {
        await failingHandler.handleStaffStatusChanged(statusChangedEvent);
      } catch (error) {
        // Expected to fail
      }

      // Verify event marked as failed
      const { data, error } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', 'test-evt-003')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('FAILED');
      expect(data.error_message).toContain('Test error');
    });
  });

  describe('Event Metadata Tracking', () => {
    it('should track event metadata correctly', async () => {
      const testEvent = {
        eventId: 'test-evt-004',
        staffId: 'test-staff-004',
        credentialNumber: 'TEST-CRED-004',
        credentialType: 'MEDICAL_LICENSE',
        issuingAuthority: 'Test Authority',
        verifiedAt: new Date('2025-01-01T10:00:00Z')
      };

      await staffCredentialHandler.handleStaffCredentialVerified(testEvent);

      const { data } = await supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('*')
        .eq('event_id', 'test-evt-004')
        .single();

      expect(data.aggregate_id).toBe('test-staff-004');
      expect(data.aggregate_type).toBe('Staff');
      expect(data.source_service).toBe('provider-staff-service');
      expect(data.routing_key).toBe('staff.credential_verified');
      expect(data.payload_json).toMatchObject(testEvent);
    });
  });
});
