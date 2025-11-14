/**
 * Unit Tests for ReschedulingService
 * Tests conflict resolution workflow and business logic
 */

import { ReschedulingService } from '../../../application/services/ReschedulingService';
import { IReschedulingQueueRepository } from '../../../domain/interfaces/IReschedulingQueueRepository';
import { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository';
import { IReminderService } from '../../../application/services/IReminderService';
import { IEventPublisher } from '../../../application/services/IEventPublisher';
import { Appointment } from '../../../domain/aggregates/Appointment.aggregate';
import { ReschedulingStatus, PatientResponse, ReschedulingPriority } from '../../../domain/interfaces/IReschedulingQueueRepository';

// Mock implementations
const mockReschedulingQueueRepository: jest.Mocked<IReschedulingQueueRepository> = {
  addToQueue: jest.fn(),
  findById: jest.fn(),
  findByAppointmentId: jest.fn(),
  findByDoctorId: jest.fn(),
  findPendingEntries: jest.fn(),
  findExpiredEntries: jest.fn(),
  updatePatientResponse: jest.fn(),
  updateStatus: jest.fn(),
  markNotificationSent: jest.fn(),
  completeRescheduling: jest.fn(),
  removeFromQueue: jest.fn(),
  getQueueStatistics: jest.fn()
};

const mockAppointmentRepository: jest.Mocked<IAppointmentRepository> = {
  findByAppointmentId: jest.fn(),
  updateStatus: jest.fn(),
  // Add other required methods as needed
} as any;

const mockReminderService: jest.Mocked<IReminderService> = {
  sendConflictNotification: jest.fn(),
  sendRescheduleNotification: jest.fn(),
  // Add other required methods as needed
} as any;

const mockEventPublisher: jest.Mocked<IEventPublisher> = {
  publish: jest.fn(),
  // Add other required methods as needed
} as any;

describe('ReschedulingService', () => {
  let reschedulingService: ReschedulingService;
  let mockAppointment: jest.Mocked<Appointment>;

  beforeEach(() => {
    reschedulingService = new ReschedulingService(
      mockReschedulingQueueRepository,
      mockAppointmentRepository,
      mockReminderService,
      mockEventPublisher
    );

    // Reset all mocks
    jest.clearAllMocks();

    // Create mock appointment
    mockAppointment = {
      getAppointmentId: jest.fn().mockReturnValue({ getValue: () => 'APT-123' }),
      getPatientId: jest.fn().mockReturnValue('PAT-456'),
      getDoctorId: jest.fn().mockReturnValue('DOC-789'),
      getTimeSlot: jest.fn().mockReturnValue({
        getAppointmentDate: () => new Date('2024-01-15'),
        getAppointmentTime: () => '14:30'
      }),
      getDepartmentId: jest.fn().mockReturnValue('DEPT-001'),
      getDurationMinutes: jest.fn().mockReturnValue(30)
    } as any;
  });

  describe('handleConflictDetected', () => {
    it('should create rescheduling queue entry and send notifications', async () => {
      // Arrange
      const conflictRequest = {
        appointment: mockAppointment,
        conflictReason: 'staff_unavailable',
        priority: ReschedulingPriority.URGENT
      };

      const expectedQueueEntry = {
        id: 'queue-entry-123',
        appointmentId: 'APT-123',
        conflictReason: 'staff_unavailable',
        status: ReschedulingStatus.PENDING_RESCHEDULE,
        priority: ReschedulingPriority.URGENT,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReschedulingQueueRepository.addToQueue.mockResolvedValue(expectedQueueEntry as any);

      // Act
      const result = await reschedulingService.handleConflictDetected(conflictRequest);

      // Assert
      expect(mockReschedulingQueueRepository.addToQueue).toHaveBeenCalledWith({
        appointmentId: 'APT-123',
        conflictReason: 'staff_unavailable',
        conflictDetails: expect.objectContaining({
          originalTimeSlot: expect.any(Object),
          departmentId: 'DEPT-001',
          detectedAt: expect.any(String)
        }),
        priority: ReschedulingPriority.URGENT,
        createdBy: 'system'
      });

      expect(mockReminderService.sendConflictNotification).toHaveBeenCalledWith(
        'APT-123',
        'PAT-456',
        expect.objectContaining({
          conflictType: 'staff_unavailable',
          appointmentDetails: expect.objectContaining({
            date: new Date('2024-01-15'),
            time: '14:30'
          })
        })
      );

      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        eventType: 'AppointmentConflictDetectedEvent',
        aggregateId: 'APT-123',
        aggregateType: 'Appointment',
        eventData: expect.objectContaining({
          appointmentId: 'APT-123',
          conflictReason: 'staff_unavailable',
          queueEntryId: 'queue-entry-123'
        }),
        metadata: expect.objectContaining({
          correlationId: 'queue-entry-123'
        })
      });

      expect(result).toEqual(expectedQueueEntry);
    });

    it('should determine priority from conflict reason when not specified', async () => {
      // Arrange
      const conflictRequest = {
        appointment: mockAppointment,
        conflictReason: 'emergency_case'
      };

      mockReschedulingQueueRepository.addToQueue.mockResolvedValue({
        id: 'queue-123',
        status: ReschedulingStatus.PENDING_RESCHEDULE,
        priority: ReschedulingPriority.EMERGENCY
      } as any);

      // Act
      await reschedulingService.handleConflictDetected(conflictRequest);

      // Assert
      expect(mockReschedulingQueueRepository.addToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: ReschedulingPriority.EMERGENCY
        })
      );
    });
  });

  describe('processPatientResponse', () => {
    it('should handle patient acceptance correctly', async () => {
      // Arrange
      const existingQueueEntry = {
        id: 'queue-123',
        appointmentId: 'APT-123',
        status: ReschedulingStatus.NOTIFIED,
        patientResponse: undefined
      };

      const updatedQueueEntry = {
        ...existingQueueEntry,
        patientResponse: PatientResponse.ACCEPTED,
        status: ReschedulingStatus.ACCEPTED
      };

      mockReschedulingQueueRepository.findById.mockResolvedValue(existingQueueEntry as any);
      mockReschedulingQueueRepository.updatePatientResponse.mockResolvedValue(updatedQueueEntry as any);
      mockReschedulingQueueRepository.updateStatus.mockResolvedValue(updatedQueueEntry as any);

      const response = {
        queueEntryId: 'queue-123',
        patientResponse: PatientResponse.ACCEPTED,
        respondedBy: 'patient-portal'
      };

      // Act
      const result = await reschedulingService.processPatientResponse(response);

      // Assert
      expect(mockReschedulingQueueRepository.updatePatientResponse).toHaveBeenCalledWith({
        entryId: 'queue-123',
        patientResponse: PatientResponse.ACCEPTED,
        respondedBy: 'patient-portal'
      });

      expect(mockReschedulingQueueRepository.updateStatus).toHaveBeenCalledWith(
        'queue-123',
        ReschedulingStatus.ACCEPTED,
        'patient'
      );

      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        eventType: 'PatientReschedulingResponseEvent',
        aggregateId: 'APT-123',
        eventData: expect.objectContaining({
          queueEntryId: 'queue-123',
          patientResponse: PatientResponse.ACCEPTED
        })
      });
    });

    it('should handle patient rejection correctly', async () => {
      // Arrange
      const existingQueueEntry = {
        id: 'queue-123',
        appointmentId: 'APT-123',
        status: ReschedulingStatus.NOTIFIED
      };

      const updatedQueueEntry = {
        ...existingQueueEntry,
        patientResponse: PatientResponse.REJECTED,
        status: ReschedulingStatus.REJECTED
      };

      mockReschedulingQueueRepository.findById.mockResolvedValue(existingQueueEntry as any);
      mockReschedulingQueueRepository.updatePatientResponse.mockResolvedValue(updatedQueueEntry as any);
      mockReschedulingQueueRepository.updateStatus.mockResolvedValue(updatedQueueEntry as any);

      const response = {
        queueEntryId: 'queue-123',
        patientResponse: PatientResponse.REJECTED,
        notes: 'Patient cannot make new time'
      };

      // Act
      await reschedulingService.processPatientResponse(response);

      // Assert
      expect(mockReschedulingQueueRepository.updateStatus).toHaveBeenCalledWith(
        'queue-123',
        ReschedulingStatus.REJECTED,
        'patient'
      );
    });

    it('should throw error when queue entry not found', async () => {
      // Arrange
      mockReschedulingQueueRepository.findById.mockResolvedValue(null);

      const response = {
        queueEntryId: 'non-existent',
        patientResponse: PatientResponse.ACCEPTED
      };

      // Act & Assert
      await expect(reschedulingService.processPatientResponse(response))
        .rejects.toThrow('Rescheduling queue entry not found: non-existent');
    });
  });

  describe('completeRescheduling', () => {
    it('should complete rescheduling and send confirmation', async () => {
      // Arrange
      const completedEntry = {
        id: 'queue-123',
        appointmentId: 'APT-123',
        rescheduledAppointmentId: 'APT-456',
        status: ReschedulingStatus.COMPLETED,
        resolvedAt: new Date()
      };

      mockReschedulingQueueRepository.completeRescheduling.mockResolvedValue(completedEntry as any);
      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      // Act
      const result = await reschedulingService.completeRescheduling(
        'queue-123',
        'APT-456',
        'admin-user'
      );

      // Assert
      expect(mockReschedulingQueueRepository.completeRescheduling).toHaveBeenCalledWith(
        'queue-123',
        'APT-456',
        'admin-user'
      );

      expect(mockReminderService.sendRescheduleNotification).toHaveBeenCalledWith(
        'APT-123',
        'PAT-456',
        new Date('2024-01-15'),
        'Rescheduling completed successfully'
      );

      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        eventType: 'AppointmentReschedulingCompletedEvent',
        eventData: expect.objectContaining({
          originalAppointmentId: 'APT-123',
          newAppointmentId: 'APT-456'
        })
      });

      expect(result).toEqual(completedEntry);
    });
  });

  describe('processExpiredEntries', () => {
    it('should process expired entries and cancel appointments', async () => {
      // Arrange
      const expiredEntries = [
        {
          id: 'queue-123',
          appointmentId: 'APT-123',
          status: ReschedulingStatus.PENDING_RESCHEDULE
        },
        {
          id: 'queue-456',
          appointmentId: 'APT-456',
          status: ReschedulingStatus.NOTIFIED
        }
      ];

      mockReschedulingQueueRepository.findExpiredEntries.mockResolvedValue(expiredEntries as any);
      mockReschedulingQueueRepository.updateStatus.mockResolvedValue({} as any);

      // Act
      await reschedulingService.processExpiredEntries();

      // Assert
      expect(mockReschedulingQueueRepository.findExpiredEntries).toHaveBeenCalled();

      // Check that each expired entry is updated
      expect(mockReschedulingQueueRepository.updateStatus).toHaveBeenCalledWith(
        'queue-123',
        ReschedulingStatus.EXPIRED,
        'system'
      );
      expect(mockReschedulingQueueRepository.updateStatus).toHaveBeenCalledWith(
        'queue-456',
        ReschedulingStatus.EXPIRED,
        'system'
      );

      // Check that appointments are cancelled
      expect(mockAppointmentRepository.updateStatus).toHaveBeenCalledWith('APT-123', 'CANCELLED');
      expect(mockAppointmentRepository.updateStatus).toHaveBeenCalledWith('APT-456', 'CANCELLED');

      // Check that expiration events are published
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
    });
  });

  describe('getQueueStatistics', () => {
    it('should return queue statistics', async () => {
      // Arrange
      const expectedStats = {
        totalEntries: 100,
        pendingReschedules: 25,
        searchingAlternatives: 15,
        notified: 20,
        completed: 30,
        expired: 10,
        averageResolutionTimeHours: 4.5
      };

      mockReschedulingQueueRepository.getQueueStatistics.mockResolvedValue(expectedStats);

      // Act
      const result = await reschedulingService.getQueueStatistics();

      // Assert
      expect(result).toEqual(expectedStats);
      expect(mockReschedulingQueueRepository.getQueueStatistics).toHaveBeenCalled();
    });
  });
});
