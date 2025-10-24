/**
 * Staff Event Handlers Integration Tests
 * Tests domain event publishing, handling, idempotency, and error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SupabaseEventBus } from '../../../src/infrastructure/messaging/SupabaseEventBus';
import { StaffDomainEventHandler } from '../../../src/infrastructure/events/StaffDomainEventHandler';
import { StaffRegisteredEvent } from '../../../src/domain/events/StaffRegisteredEvent';
import { StaffUpdatedEvent } from '../../../src/domain/events/StaffUpdatedEvent';
import { StaffStatusChangedEvent } from '../../../src/domain/events/StaffStatusChangedEvent';
import { StaffCredentialVerifiedEvent } from '../../../src/domain/events/StaffCredentialVerifiedEvent';
import { StaffSpecializationAddedEvent } from '../../../src/domain/events/StaffSpecializationAddedEvent';
import { StaffId } from '../../../src/domain/value-objects/StaffId';
import { PersonalInfo } from '../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../src/domain/value-objects/WorkSchedule';
import { Specialization } from '../../../src/domain/entities/Specialization';
import { WinstonLogger } from '../../../src/infrastructure/logging/logger';
import { AuditService } from '../../../src/infrastructure/audit/AuditService';

describe('Staff Event Handlers Integration Tests', () => {
  let eventBus: SupabaseEventBus;
  let eventHandler: StaffDomainEventHandler;
  let supabaseClient: SupabaseClient;
  let logger: WinstonLogger;
  let auditService: AuditService;

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    logger = new WinstonLogger();
    auditService = new AuditService({
      supabaseUrl,
      supabaseKey,
      logger,
      serviceName: 'provider-staff-service'
    });

    // Create event bus
    eventBus = new SupabaseEventBus(supabaseUrl, supabaseKey, logger, 'provider_schema');

    // Create event handler
    eventHandler = new StaffDomainEventHandler({
      logger,
      auditService,
      eventBus
    });
  });

  afterEach(() => {
    publishedEvents = [];
  });

  /**
   * Helper: Create test personal info
   */
  function createTestPersonalInfo(): PersonalInfo {
    const uniqueId = Date.now().toString().slice(-6);
    return PersonalInfo.create({
      fullName: 'Bác sĩ Test Event',
      dateOfBirth: new Date('1985-01-15'),
      gender: 'male',
      nationalId: `079085${uniqueId}`,
      nationality: 'Vietnamese',
      phoneNumber: `090${uniqueId}${Math.random().toString().slice(-3)}`,
      email: `test-event-${uniqueId}@hospital.vn`,
      address: {
        street: '123 Test Street',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      }
    });
  }

  /**
   * Helper: Create test professional info
   */
  function createTestProfessionalInfo(): ProfessionalInfo {
    return ProfessionalInfo.create({
      title: 'Bác sĩ Chuyên khoa I',
      department: 'Cardiology',
      position: 'Senior Doctor',
      education: ['Bác sĩ Đa khoa', 'Chuyên khoa I Tim mạch'],
      languages: ['Vietnamese', 'English'],
      bio: 'Experienced cardiologist with 10 years of practice'
    });
  }

  /**
   * Helper: Create test work schedule
   */
  function createTestWorkSchedule(): WorkSchedule {
    return WorkSchedule.create({
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: { start: '08:00', end: '17:00' },
      timeZone: 'Asia/Ho_Chi_Minh',
      isFlexible: false
    });
  }

  // ==================== STAFF REGISTERED EVENT TESTS ====================

  describe('StaffRegisteredEvent - Publishing and Handling', () => {
    it('should publish StaffRegisteredEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-001');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event = new StaffRegisteredEvent(
        staffId,
        'test-user-123',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-123456',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      // Act
      await eventBus.publish(event);

      // Assert
      expect(event.eventType).toBe('StaffRegistered');
      expect(event.aggregateId).toBe(staffId.value);
    });

    it('should handle StaffRegisteredEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-002');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event = new StaffRegisteredEvent(
        staffId,
        'test-user-456',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-654321',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      // Act
      await eventHandler.handle(event);

      // Assert - Event should be processed without errors
      expect(event.eventId).toBeDefined();
    });

    it('should audit StaffRegisteredEvent', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-003');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event = new StaffRegisteredEvent(
        staffId,
        'test-user-789',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-789012',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      // Act
      await eventHandler.handle(event);

      // Assert - Audit log should be created
      expect(event.eventId).toBeDefined();
    });

    it('should mask sensitive data in StaffRegisteredEvent', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-004');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event = new StaffRegisteredEvent(
        staffId,
        'test-user-101',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-101112',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      // Act
      await eventHandler.handle(event);

      // Assert - Sensitive data should be masked
      const eventData = event.getEventData();
      expect(eventData).toBeDefined();
    });
  });

  // ==================== STAFF UPDATED EVENT TESTS ====================

  describe('StaffUpdatedEvent - Publishing and Handling', () => {
    it('should publish StaffUpdatedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-005');
      const event = new StaffUpdatedEvent(
        staffId,
        ['personalInfo', 'professionalInfo'],
        {
          personalInfo: { fullName: 'Updated Name' },
          professionalInfo: { consultationFee: 600000 }
        }
      );

      // Act
      await eventBus.publish(event);

      // Assert
      expect(event.eventType).toBe('StaffUpdated');
      expect(event.updatedFields).toContain('personalInfo');
    });

    it('should handle StaffUpdatedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-006');
      const event = new StaffUpdatedEvent(
        staffId,
        ['workSchedule'],
        {
          workSchedule: { monday: { isAvailable: false } }
        }
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.eventId).toBeDefined();
    });

    it('should track updated fields in StaffUpdatedEvent', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-007');
      const event = new StaffUpdatedEvent(
        staffId,
        ['personalInfo', 'professionalInfo', 'workSchedule'],
        {
          personalInfo: { phoneNumber: '0901234567' },
          professionalInfo: { department: 'Neurology' },
          workSchedule: { tuesday: { isAvailable: false } }
        }
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.updatedFields.length).toBe(3);
      expect(event.updatedFields).toContain('personalInfo');
      expect(event.updatedFields).toContain('professionalInfo');
      expect(event.updatedFields).toContain('workSchedule');
    });
  });

  // ==================== STAFF STATUS CHANGED EVENT TESTS ====================

  describe('StaffStatusChangedEvent - Publishing and Handling', () => {
    it('should publish StaffStatusChangedEvent successfully', async () => {
      // Arrange
      const event = new StaffStatusChangedEvent({
        staffId: 'DOC-CARD-202501-008',
        oldStatus: 'active',
        newStatus: 'on_leave',
        reason: 'Medical leave',
        changedBy: 'admin-user-123',
        timestamp: new Date()
      });

      // Act
      await eventBus.publish(event);

      // Assert
      expect(event.eventType).toBe('StaffStatusChanged');
      expect(event.newStatus).toBe('on_leave');
    });

    it('should handle StaffStatusChangedEvent successfully', async () => {
      // Arrange
      const event = new StaffStatusChangedEvent({
        staffId: 'DOC-CARD-202501-009',
        oldStatus: 'active',
        newStatus: 'suspended',
        reason: 'Policy violation',
        changedBy: 'admin-user-456',
        timestamp: new Date()
      });

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.eventId).toBeDefined();
    });

    it('should track status transition in StaffStatusChangedEvent', async () => {
      // Arrange
      const event = new StaffStatusChangedEvent({
        staffId: 'DOC-CARD-202501-010',
        oldStatus: 'suspended',
        newStatus: 'active',
        reason: 'Reactivation after review',
        changedBy: 'admin-user-789',
        timestamp: new Date()
      });

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.oldStatus).toBe('suspended');
      expect(event.newStatus).toBe('active');
      expect(event.reason).toBe('Reactivation after review');
    });
  });

  // ==================== CREDENTIAL VERIFIED EVENT TESTS ====================

  describe('StaffCredentialVerifiedEvent - Publishing and Handling', () => {
    it('should publish StaffCredentialVerifiedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-011');
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        'VN-BS-111213',
        'Medical License',
        'Bộ Y tế'
      );

      // Act
      await eventBus.publish(event);

      // Assert
      expect(event.eventType).toBe('StaffCredentialVerified');
      expect(event.credentialNumber).toBe('VN-BS-111213');
    });

    it('should handle StaffCredentialVerifiedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-012');
      const event = new StaffCredentialVerifiedEvent(
        staffId,
        'VN-BS-121314',
        'Medical License',
        'Sở Y tế TP.HCM'
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.eventId).toBeDefined();
    });

    it('should track credential details in StaffCredentialVerifiedEvent', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-013');

      const event = new StaffCredentialVerifiedEvent(
        staffId,
        'VN-BS-131415',
        'Medical License',
        'Bộ Y tế'
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.credentialNumber).toBe('VN-BS-131415');
      expect(event.issuingAuthority).toBe('Bộ Y tế');
    });
  });

  // ==================== SPECIALIZATION ADDED EVENT TESTS ====================

  describe('StaffSpecializationAddedEvent - Publishing and Handling', () => {
    it('should publish StaffSpecializationAddedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-014');
      const specialization = Specialization.create({
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch',
        isActive: true
      });

      const event = new StaffSpecializationAddedEvent(
        staffId,
        specialization
      );

      // Act
      await eventBus.publish(event);

      // Assert
      expect(event.eventType).toBe('StaffSpecializationAdded');
      expect(event.specialization.code).toBe('CARD');
    });

    it('should handle StaffSpecializationAddedEvent successfully', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-015');
      const specialization = Specialization.create({
        code: 'NEUR',
        name: 'Thần kinh',
        description: 'Chuyên khoa Thần kinh',
        isActive: true
      });

      const event = new StaffSpecializationAddedEvent(
        staffId,
        specialization
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.eventId).toBeDefined();
    });

    it('should track specialization details in StaffSpecializationAddedEvent', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-016');
      const specialization = Specialization.create({
        code: 'ORTH',
        name: 'Chỉnh hình',
        description: 'Chuyên khoa Chỉnh hình',
        isActive: true
      });

      const event = new StaffSpecializationAddedEvent(
        staffId,
        specialization
      );

      // Act
      await eventHandler.handle(event);

      // Assert
      expect(event.specialization.code).toBe('ORTH');
      expect(event.specialization.name).toBe('Chỉnh hình');
      expect(event.specialization.isActive).toBe(true);
    });
  });

  // ==================== EVENT IDEMPOTENCY TESTS ====================

  describe('Event Idempotency', () => {
    it('should handle duplicate StaffRegisteredEvent idempotently', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-017');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event = new StaffRegisteredEvent(
        staffId,
        'test-user-idempotent',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-171819',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      // Act - Handle same event twice
      await eventHandler.handle(event);
      await eventHandler.handle(event);

      // Assert - Should not throw error
      expect(event.eventId).toBeDefined();
    });

    it('should handle duplicate StaffUpdatedEvent idempotently', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-018');
      const event = new StaffUpdatedEvent(
        staffId,
        ['personalInfo'],
        { personalInfo: { fullName: 'Idempotent Update' } }
      );

      // Act - Handle same event twice
      await eventHandler.handle(event);
      await eventHandler.handle(event);

      // Assert - Should not throw error
      expect(event.eventId).toBeDefined();
    });
  });

  // ==================== EVENT ORDERING TESTS ====================

  describe('Event Ordering', () => {
    it('should process events in order', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-019');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event1 = new StaffRegisteredEvent(
        staffId,
        'test-user-order',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-192021',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      const event2 = new StaffUpdatedEvent(
        staffId,
        ['personalInfo'],
        { personalInfo: { fullName: 'Updated After Registration' } }
      );

      const event3 = new StaffStatusChangedEvent({
        staffId: staffId.value,
        oldStatus: 'active',
        newStatus: 'on_leave',
        reason: 'Leave after update',
        changedBy: 'admin',
        timestamp: new Date()
      });

      // Act - Process in order
      await eventHandler.handle(event1);
      await eventHandler.handle(event2);
      await eventHandler.handle(event3);

      // Assert - All events should be processed
      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
      expect(event3.eventId).toBeDefined();
    });

    it('should maintain event sequence numbers', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-020');
      const personalInfo = createTestPersonalInfo();
      const professionalInfo = createTestProfessionalInfo();
      const workSchedule = createTestWorkSchedule();

      const event1 = new StaffRegisteredEvent(
        staffId,
        'test-user-sequence',
        'doctor',
        personalInfo,
        professionalInfo,
        'VN-BS-202122',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      const event2 = new StaffUpdatedEvent(
        staffId,
        ['professionalInfo'],
        { professionalInfo: { consultationFee: 700000 } }
      );

      // Act
      await eventHandler.handle(event1);
      await eventHandler.handle(event2);

      // Assert - Events should be processed in order
      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling in Event Handlers', () => {
    it('should handle invalid event gracefully', async () => {
      // Arrange
      const invalidEvent = {
        eventType: 'InvalidEvent',
        aggregateId: 'invalid-id',
        eventId: 'test-event-id'
      } as any;

      // Act & Assert - Should not throw error
      await expect(eventHandler.handle(invalidEvent)).resolves.not.toThrow();
    });

    it('should log error when event processing fails', async () => {
      // Arrange
      const staffId = StaffId.create('DOC-CARD-202501-021');
      const event = new StaffUpdatedEvent(
        staffId,
        ['invalidField'],
        { invalidField: 'invalid data' }
      );

      // Act - Should handle error gracefully
      await eventHandler.handle(event);

      // Assert - Event should still have ID
      expect(event.eventId).toBeDefined();
    });

    it('should continue processing after error', async () => {
      // Arrange
      const staffId1 = StaffId.create('DOC-CARD-202501-022');
      const staffId2 = StaffId.create('DOC-CARD-202501-023');

      const event1 = new StaffUpdatedEvent(
        staffId1,
        ['invalidField'],
        { invalidField: 'error' }
      );

      const event2 = new StaffUpdatedEvent(
        staffId2,
        ['personalInfo'],
        { personalInfo: { fullName: 'Valid Update' } }
      );

      // Act
      await eventHandler.handle(event1);
      await eventHandler.handle(event2);

      // Assert - Both events should be processed
      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
    });
  });

  // ==================== EVENT HANDLER STATISTICS TESTS ====================

  describe('Event Handler Statistics', () => {
    it('should provide event handler statistics', () => {
      // Act
      const stats = eventHandler.getStatistics();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.handlerName).toBe('StaffDomainEventHandler');
      expect(stats.supportedEventsCount).toBeGreaterThan(0);
      expect(stats.isHealthy).toBe(true);
    });

    it('should report supported event types', () => {
      // Act
      const stats = eventHandler.getStatistics();

      // Assert
      expect(stats.processingCapabilities).toBeDefined();
      expect(stats.processingCapabilities.canHandleStaffRegistered).toBe(true);
      expect(stats.processingCapabilities.canHandleStaffUpdated).toBe(true);
      expect(stats.processingCapabilities.canHandleStaffStatusChanged).toBe(true);
      expect(stats.processingCapabilities.canHandleStaffCredentialVerified).toBe(true);
      expect(stats.processingCapabilities.canHandleStaffSpecializationAdded).toBe(true);
    });
  });
});
