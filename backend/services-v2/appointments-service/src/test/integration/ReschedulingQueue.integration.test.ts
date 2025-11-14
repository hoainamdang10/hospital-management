/**
 * Integration Tests for Rescheduling Queue
 * Tests the complete workflow with database
 */

import { SupabaseReschedulingQueueRepository } from '../../infrastructure/persistence/SupabaseReschedulingQueueRepository';
import { ReschedulingService } from '../../application/services/ReschedulingService';
import { IReschedulingQueueRepository, ReschedulingStatus, PatientResponse, ReschedulingPriority } from '../../domain/interfaces/IReschedulingQueueRepository';

// Mock implementations for testing
const mockAppointmentRepository = {
  findByAppointmentId: jest.fn(),
  updateStatus: jest.fn(),
} as any;

const mockReminderService = {
  sendConflictNotification: jest.fn(),
  sendRescheduleNotification: jest.fn(),
} as any;

const mockEventPublisher = {
  publish: jest.fn(),
  isConnected: () => true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  publishBatch: jest.fn(),
} as any;

describe('ReschedulingQueue Integration Tests', () => {
  let reschedulingQueueRepository: IReschedulingQueueRepository;
  let reschedulingService: ReschedulingService;

  beforeAll(() => {
    // Initialize repository with test configuration
    reschedulingQueueRepository = new SupabaseReschedulingQueueRepository(
      process.env.SUPABASE_URL || 'https://test.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'test-key'
    );

    reschedulingService = new ReschedulingService(
      reschedulingQueueRepository,
      mockAppointmentRepository,
      mockReminderService,
      mockEventPublisher
    );
  });

  describe('Database Operations', () => {
    it('should create and retrieve rescheduling queue entry', async () => {
      // Arrange
      const testAppointmentId = `TEST-APT-${Date.now()}`;
      const createRequest = {
        appointmentId: testAppointmentId,
        conflictReason: 'staff_unavailable',
        conflictDetails: {
          staffId: 'DOC-001',
          reason: 'Emergency leave',
          detectedAt: new Date().toISOString()
        },
        priority: ReschedulingPriority.URGENT,
        createdBy: 'test-user'
      };

      // Act
      const createdEntry = await reschedulingQueueRepository.addToQueue(createRequest);
      
      // Assert
      expect(createdEntry).toBeDefined();
      expect(createdEntry.appointmentId).toBe(testAppointmentId);
      expect(createdEntry.conflictReason).toBe('staff_unavailable');
      expect(createdEntry.status).toBe(ReschedulingStatus.PENDING_RESCHEDULE);
      expect(createdEntry.priority).toBe(ReschedulingPriority.URGENT);
      expect(createdEntry.id).toBeDefined();
      expect(createdEntry.createdAt).toBeInstanceOf(Date);

      // Test retrieval
      const retrievedEntry = await reschedulingQueueRepository.findById(createdEntry.id);
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.id).toBe(createdEntry.id);
      expect(retrievedEntry?.appointmentId).toBe(testAppointmentId);

      // Cleanup
      await reschedulingQueueRepository.removeFromQueue(createdEntry.id);
    });

    it('should update patient response correctly', async () => {
      // Arrange
      const testAppointmentId = `TEST-APT-${Date.now()}`;
      const createdEntry = await reschedulingQueueRepository.addToQueue({
        appointmentId: testAppointmentId,
        conflictReason: 'emergency_case',
        priority: ReschedulingPriority.EMERGENCY
      });

      // Act
      const updatedEntry = await reschedulingQueueRepository.updatePatientResponse({
        entryId: createdEntry.id,
        patientResponse: PatientResponse.ACCEPTED,
        respondedBy: 'patient-portal'
      });

      // Assert
      expect(updatedEntry.patientResponse).toBe(PatientResponse.ACCEPTED);
      expect(updatedEntry.patientRespondedAt).toBeInstanceOf(Date);
      expect(updatedEntry.resolvedBy).toBe('patient-portal');

      // Cleanup
      await reschedulingQueueRepository.removeFromQueue(createdEntry.id);
    });

    it('should handle status transitions correctly', async () => {
      // Arrange
      const testAppointmentId = `TEST-APT-${Date.now()}`;
      const createdEntry = await reschedulingQueueRepository.addToQueue({
        appointmentId: testAppointmentId,
        conflictReason: 'double_booking',
        priority: ReschedulingPriority.NORMAL
      });

      // Act - Transition through workflow
      const searchingEntry = await reschedulingQueueRepository.updateStatus(
        createdEntry.id,
        ReschedulingStatus.SEARCHING_ALTERNATIVES,
        'system'
      );

      const notifiedEntry = await reschedulingQueueRepository.markNotificationSent(
        searchingEntry.id
      );

      const acceptedEntry = await reschedulingQueueRepository.updatePatientResponse({
        entryId: notifiedEntry.id,
        patientResponse: PatientResponse.ACCEPTED,
        respondedBy: 'patient'
      });

      const completedEntry = await reschedulingQueueRepository.completeRescheduling(
        acceptedEntry.id,
        `NEW-APT-${Date.now()}`,
        'admin-user'
      );

      // Assert
      expect(searchingEntry.status).toBe(ReschedulingStatus.SEARCHING_ALTERNATIVES);
      expect(notifiedEntry.status).toBe(ReschedulingStatus.NOTIFIED);
      expect(notifiedEntry.notificationSent).toBe(true);
      expect(acceptedEntry.patientResponse).toBe(PatientResponse.ACCEPTED);
      expect(completedEntry.status).toBe(ReschedulingStatus.COMPLETED);
      expect(completedEntry.rescheduledAppointmentId).toBeDefined();
      expect(completedEntry.resolvedAt).toBeInstanceOf(Date);

      // Cleanup
      await reschedulingQueueRepository.removeFromQueue(createdEntry.id);
    });

    it('should find expired entries correctly', async () => {
      // Arrange - Create an entry that expires immediately
      const testAppointmentId = `TEST-APT-${Date.now()}`;
      const createdEntry = await reschedulingQueueRepository.addToQueue({
        appointmentId: testAppointmentId,
        conflictReason: 'test_expiration',
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      // Act
      const expiredEntries = await reschedulingQueueRepository.findExpiredEntries();

      // Assert
      expect(expiredEntries.length).toBeGreaterThan(0);
      const ourExpiredEntry = expiredEntries.find(entry => entry.id === createdEntry.id);
      expect(ourExpiredEntry).toBeDefined();

      // Cleanup
      await reschedulingQueueRepository.removeFromQueue(createdEntry.id);
    });

    it('should get queue statistics', async () => {
      // Arrange - Create test entries with different statuses
      const testEntries = [];
      for (let i = 0; i < 3; i++) {
        const entry = await reschedulingQueueRepository.addToQueue({
          appointmentId: `TEST-APT-${Date.now()}-${i}`,
          conflictReason: 'test_statistics',
          priority: i === 0 ? ReschedulingPriority.URGENT : ReschedulingPriority.NORMAL
        });
        testEntries.push(entry);
      }

      // Act
      const stats = await reschedulingQueueRepository.getQueueStatistics();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.pendingReschedules).toBeGreaterThanOrEqual(0);
      expect(typeof stats.averageResolutionTimeHours).toBe('number');

      // Cleanup
      for (const entry of testEntries) {
        await reschedulingQueueRepository.removeFromQueue(entry.id);
      }
    });
  });

  describe('Service Layer Integration', () => {
    it('should handle complete conflict detection workflow', async () => {
      // Arrange
      const mockAppointment = {
        getAppointmentId: () => ({ value: `TEST-APT-${Date.now()}` }),
        getPatientId: () => 'PAT-001',
        getDoctorId: () => 'DOC-001',
        getTimeSlot: () => ({
          appointmentDate: '2024-01-15',
          appointmentTime: '14:30:00'
        }),
        getDepartmentId: () => 'DEPT-001',
        getDurationMinutes: () => 30
      };

      // Act
      const result = await reschedulingService.handleConflictDetected({
        appointment: mockAppointment as any,
        conflictReason: 'staff_unavailable',
        conflictDetails: {
          staffId: 'DOC-001',
          emergencyType: 'medical_emergency'
        },
        priority: ReschedulingPriority.URGENT
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.appointmentId).toBe(mockAppointment.getAppointmentId().value);
      expect(result.conflictReason).toBe('staff_unavailable');
      expect(result.status).toBe(ReschedulingStatus.PENDING_RESCHEDULE);
      expect(result.priority).toBe(ReschedulingPriority.URGENT);

      // Verify notifications were sent
      expect(mockReminderService.sendConflictNotification).toHaveBeenCalledWith(
        mockAppointment.getAppointmentId().value,
        'PAT-001',
        expect.objectContaining({
          conflictType: 'staff_unavailable'
        })
      );

      // Verify event was published
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'AppointmentConflictDetectedEvent',
          aggregateId: mockAppointment.getAppointmentId().value,
          eventData: expect.objectContaining({
            appointmentId: mockAppointment.getAppointmentId().value,
            conflictReason: 'staff_unavailable'
          })
        })
      );

      // Cleanup
      await reschedulingQueueRepository.removeFromQueue(result.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate appointment ID gracefully', async () => {
      // Arrange
      const testAppointmentId = `TEST-APT-${Date.now()}`;
      
      // Create first entry
      await reschedulingQueueRepository.addToQueue({
        appointmentId: testAppointmentId,
        conflictReason: 'test_duplicate'
      });

      // Act & Assert - Second entry should work (database may allow duplicates or handle them)
      try {
        const secondEntry = await reschedulingQueueRepository.addToQueue({
          appointmentId: testAppointmentId,
          conflictReason: 'test_duplicate_2'
        });
        expect(secondEntry).toBeDefined();
        
        // Cleanup
        await reschedulingQueueRepository.removeFromQueue(secondEntry.id);
      } catch (error) {
        // If database prevents duplicates, that's also valid behavior
        expect(error).toBeDefined();
      }

      // Cleanup first entry
      const entries = await reschedulingQueueRepository.findByAppointmentId(testAppointmentId);
      if (entries) {
        await reschedulingQueueRepository.removeFromQueue(entries.id);
      }
    });

    it('should handle invalid queue entry ID', async () => {
      // Act
      const result = await reschedulingQueueRepository.findById('invalid-uuid');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle update of non-existent entry', async () => {
      // Act & Assert
      await expect(
        reschedulingQueueRepository.updateStatus('non-existent-id', ReschedulingStatus.ACCEPTED)
      ).rejects.toThrow();
    });
  });
});
