/**
 * Identity Event Handlers Integration Tests
 * Tests UserCreatedEventHandler, UserDeactivatedEventHandler, UserRoleChangedEventHandler
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserCreatedEventHandler } from '../../../src/infrastructure/events/UserCreatedEventHandler';
import { UserDeactivatedEventHandler } from '../../../src/infrastructure/events/UserDeactivatedEventHandler';
import { UserRoleChangedEventHandler } from '../../../src/infrastructure/events/UserRoleChangedEventHandler';
import { SupabaseProviderStaffRepository } from '../../../src/infrastructure/repositories/SupabaseProviderStaffRepository';
import { AuditService } from '../../../src/infrastructure/audit/AuditService';
import { ConsoleLogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { createClient } from '@supabase/supabase-js';
import { UserCreatedEvent, UserDeactivatedEvent, UserRoleChangedEvent } from '../../../../shared/domain/events/domain-events';
import { StaffId } from '../../../src/domain/value-objects/StaffId';

describe('Identity Event Handlers Integration Tests', () => {
  let userCreatedHandler: UserCreatedEventHandler;
  let userDeactivatedHandler: UserDeactivatedEventHandler;
  let userRoleChangedHandler: UserRoleChangedEventHandler;
  let staffRepository: SupabaseProviderStaffRepository;
  let auditService: AuditService;
  let logger: ConsoleLogger;
  let supabaseClient: any;

  beforeAll(() => {
    // Setup
    const supabaseUrl = process.env.SUPABASE_URL || 'https://ciasxktujslgsdgylimv.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    logger = new ConsoleLogger('IdentityEventHandlersTest');
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    auditService = new AuditService({
      supabaseUrl,
      supabaseKey,
      logger,
      serviceName: 'provider-staff-service'
    });
    staffRepository = new SupabaseProviderStaffRepository(
      supabaseUrl,
      supabaseKey,
      logger,
      auditService
    );

    userCreatedHandler = new UserCreatedEventHandler(staffRepository, logger, auditService);
    userDeactivatedHandler = new UserDeactivatedEventHandler(staffRepository, logger, auditService);
    userRoleChangedHandler = new UserRoleChangedEventHandler(staffRepository, logger, auditService);
  });

  describe('UserCreatedEventHandler', () => {
    it('should create staff profile for doctor role', async () => {
      const userId = `user_test_${Date.now()}`;
      const event = new UserCreatedEvent(
        userId,
        'doctor.test@hospital.com',
        'Bác sĩ Test',
        'doctor',
        '001234567890',
        '0901234567'
      );

      await userCreatedHandler.handle(event);

      // Verify staff was created
      const staff = await staffRepository.findByUserId(event.userId);
      expect(staff).toBeDefined();
      expect(staff?.userId).toBe(event.userId);
      expect(staff?.staffType).toBe('doctor');
      expect(staff?.personalInfo.fullName).toBe(event.fullName);
      expect(staff?.personalInfo.email).toBe(event.email);

      // Cleanup
      if (staff) {
        await staffRepository.delete(StaffId.fromString(staff.id));
      }
    }, 30000);

    it('should create staff profile for nurse role', async () => {
      const userId = `user_test_${Date.now()}`;
      const event = new UserCreatedEvent(
        userId,
        'nurse.test@hospital.com',
        'Y tá Test',
        'nurse',
        '001234567891',
        '0901234568'
      );

      await userCreatedHandler.handle(event);

      // Verify staff was created
      const staff = await staffRepository.findByUserId(event.userId);
      expect(staff).toBeDefined();
      expect(staff?.staffType).toBe('nurse');

      // Cleanup
      if (staff) {
        await staffRepository.delete(StaffId.fromString(staff.id));
      }
    }, 30000);

    it('should skip staff creation for patient role', async () => {
      const userId = `user_test_${Date.now()}`;
      const event = new UserCreatedEvent(
        userId,
        'patient.test@hospital.com',
        'Bệnh nhân Test',
        'patient',
        '001234567892',
        '0901234569'
      );

      await userCreatedHandler.handle(event);

      // Verify staff was NOT created
      const staff = await staffRepository.findByUserId(event.userId);
      expect(staff).toBeNull();
    }, 30000);

    it('should handle duplicate user creation (idempotency)', async () => {
      const userId = `user_test_${Date.now()}`;
      const event = new UserCreatedEvent(
        userId,
        'duplicate.test@hospital.com',
        'Bác sĩ Duplicate',
        'doctor',
        '001234567893',
        '0901234570'
      );

      // First creation
      await userCreatedHandler.handle(event);
      const staff1 = await staffRepository.findByUserId(event.userId);
      expect(staff1).toBeDefined();

      // Second creation (should be idempotent)
      await userCreatedHandler.handle(event);
      const staff2 = await staffRepository.findByUserId(event.userId);
      expect(staff2).toBeDefined();
      expect(staff2?.id).toBe(staff1?.id); // Same staff ID

      // Cleanup
      if (staff1) {
        await staffRepository.delete(StaffId.fromString(staff1.id));
      }
    }, 30000);
  });

  describe('UserDeactivatedEventHandler', () => {
    it('should terminate staff when user is deactivated', async () => {
      // Create staff first
      const userId = `user_test_${Date.now()}`;
      const createEvent = new UserCreatedEvent(
        userId,
        'deactivate.test@hospital.com',
        'Bác sĩ Deactivate Test',
        'doctor',
        '001234567890',
        '0901234567'
      );
      await userCreatedHandler.handle(createEvent);

      // Deactivate user
      const deactivateEvent = new UserDeactivatedEvent(
        userId,
        'deactivate.test@hospital.com',
        'Test deactivation',
        'admin-test'
      );
      await userDeactivatedHandler.handle(deactivateEvent);

      // Verify staff was terminated
      const staff = await staffRepository.findByUserId(userId);
      expect(staff).toBeDefined();
      expect(staff?.status).toBe('terminated');
      expect(staff?.isActive).toBe(false);

      // Cleanup
      if (staff) {
        await staffRepository.delete(StaffId.fromString(staff.id));
      }
    }, 30000);

    it('should handle deactivation of non-existent staff (idempotency)', async () => {
      const userId = `user_nonexistent_${Date.now()}`;
      const event = new UserDeactivatedEvent(
        userId,
        'nonexistent.test@hospital.com',
        'Test',
        'admin-test'
      );

      // Should not throw error
      await expect(userDeactivatedHandler.handle(event)).resolves.not.toThrow();
    }, 30000);
  });

  describe('UserRoleChangedEventHandler', () => {
    it('should update staff type when role changes from doctor to nurse', async () => {
      // Create doctor staff first
      const userId = `user_test_${Date.now()}`;
      const createEvent = new UserCreatedEvent(
        userId,
        'rolechange.test@hospital.com',
        'Bác sĩ Role Change Test',
        'doctor',
        '001234567890',
        '0901234567'
      );
      await userCreatedHandler.handle(createEvent);

      // Change role to nurse
      const roleChangeEvent = new UserRoleChangedEvent(
        userId,
        'doctor',
        'nurse',
        'admin-test'
      );
      await userRoleChangedHandler.handle(roleChangeEvent);

      // Verify staff type was updated
      const staff = await staffRepository.findByUserId(userId);
      expect(staff).toBeDefined();
      expect(staff?.staffType).toBe('nurse');

      // Cleanup
      if (staff) {
        await staffRepository.delete(StaffId.fromString(staff.id));
      }
    }, 30000);

    it('should terminate staff when role changes to patient', async () => {
      // Create doctor staff first
      const userId = `user_test_${Date.now()}`;
      const createEvent = new UserCreatedEvent(
        userId,
        'roletopatient.test@hospital.com',
        'Bác sĩ To Patient Test',
        'doctor',
        '001234567890',
        '0901234567'
      );
      await userCreatedHandler.handle(createEvent);

      // Change role to patient
      const roleChangeEvent = new UserRoleChangedEvent(
        userId,
        'doctor',
        'patient',
        'admin-test'
      );
      await userRoleChangedHandler.handle(roleChangeEvent);

      // Verify staff was terminated
      const staff = await staffRepository.findByUserId(userId);
      expect(staff).toBeDefined();
      expect(staff?.status).toBe('terminated');
      expect(staff?.isActive).toBe(false);

      // Cleanup
      if (staff) {
        await staffRepository.delete(StaffId.fromString(staff.id));
      }
    }, 30000);
  });
});
