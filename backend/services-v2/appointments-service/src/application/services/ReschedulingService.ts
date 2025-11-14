/**
 * Rescheduling Service - Handles appointment conflict resolution
 * Follows medical compliance and proper audit trail requirements
 */

import { 
  IReschedulingQueueRepository,
  ReschedulingQueueEntry,
  CreateReschedulingEntryRequest,
  UpdatePatientResponseRequest,
  ReschedulingStatus,
  PatientResponse,
  ReschedulingPriority
} from '../../domain/interfaces/IReschedulingQueueRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService } from './IReminderService';
import { IEventPublisher } from './IEventPublisher';
import { Appointment, AppointmentStatus } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';

export interface ReschedulingRequest {
  appointment: Appointment;
  conflictReason: string;
  conflictDetails?: Record<string, any>;
  priority?: ReschedulingPriority;
}

export interface PatientReschedulingResponse {
  queueEntryId: string;
  patientResponse: PatientResponse;
  respondedBy?: string;
  notes?: string;
}

export class ReschedulingService {
  private eventPublisher?: IEventPublisher;

  constructor(
    private reschedulingQueueRepository: IReschedulingQueueRepository,
    private appointmentRepository: IAppointmentRepository,
    private reminderService: IReminderService,
    eventPublisher?: IEventPublisher
  ) {
    this.eventPublisher = eventPublisher;
  }

  public setEventPublisher(eventPublisher: IEventPublisher): void {
    this.eventPublisher = eventPublisher;
  }

  private getEventPublisher(): IEventPublisher {
    if (!this.eventPublisher) {
      throw new Error('ReschedulingService event publisher has not been configured');
    }
    return this.eventPublisher;
  }

  /**
   * Handle appointment conflict detection
   * Creates rescheduling queue entry and notifies relevant parties
   */
  async handleConflictDetected(request: ReschedulingRequest): Promise<ReschedulingQueueEntry> {
    try {
      console.log(`Handling conflict for appointment ${request.appointment.getAppointmentId().value}`);

      // Create rescheduling queue entry
      const queueEntry = await this.reschedulingQueueRepository.addToQueue({
        appointmentId: request.appointment.getAppointmentId().value,
        conflictReason: request.conflictReason,
        conflictDetails: request.conflictDetails || {
          originalTimeSlot: request.appointment.getTimeSlot(),
          departmentId: request.appointment.getDepartmentId(),
          detectedAt: new Date().toISOString()
        },
        priority: request.priority || this.determinePriorityFromReason(request.conflictReason),
        createdBy: 'system'
      });

      // Update appointment status to indicate conflict
      await this.updateAppointmentConflictStatus(
        request.appointment.getAppointmentId().value,
        request.conflictReason
      );

      // Send notification to patient about potential rescheduling
      const patientId = request.appointment.getPatientId();
      if (!patientId) {
        throw new Error('Patient ID is required for conflict notification');
      }
      
      await this.reminderService.sendConflictNotification(
        request.appointment.getAppointmentId().value,
        patientId,
        {
          conflictType: request.conflictReason,
          appointmentDetails: {
            date: request.appointment.getTimeSlot().appointmentDate,
            time: request.appointment.getTimeSlot().appointmentTime
          },
          timestamp: new Date()
        }
      );

      // Publish domain event
      await this.getEventPublisher().publish({
        eventType: 'AppointmentConflictDetectedEvent',
        aggregateId: request.appointment.getAppointmentId().value,
        aggregateType: 'Appointment',
        eventData: {
          appointmentId: request.appointment.getAppointmentId().value,
          conflictReason: request.conflictReason,
          queueEntryId: queueEntry.id,
          priority: queueEntry.priority,
          patientId: patientId,
          doctorId: request.appointment.getDoctorId()
        },
        metadata: {
          correlationId: queueEntry.id,
          timestamp: new Date()
        }
      });

      console.log(`✅ Conflict handled for appointment ${request.appointment.getAppointmentId().value}, queue entry: ${queueEntry.id}`);
      return queueEntry;
    } catch (error) {
      console.error('Failed to handle appointment conflict:', error);
      throw new Error(`Failed to handle appointment conflict: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process patient response to rescheduling notification
   */
  async processPatientResponse(response: PatientReschedulingResponse): Promise<ReschedulingQueueEntry> {
    try {
      console.log(`Processing patient response for queue entry ${response.queueEntryId}: ${response.patientResponse}`);

      // Get current queue entry
      const queueEntry = await this.reschedulingQueueRepository.findById(response.queueEntryId);
      if (!queueEntry) {
        throw new Error(`Rescheduling queue entry not found: ${response.queueEntryId}`);
      }

      // Update patient response
      const updatedEntry = await this.reschedulingQueueRepository.updatePatientResponse({
        entryId: response.queueEntryId,
        patientResponse: response.patientResponse,
        respondedBy: response.respondedBy || 'patient'
      });

      // Process response based on patient decision
      switch (response.patientResponse) {
        case PatientResponse.ACCEPTED:
          await this.handlePatientAcceptance(updatedEntry);
          break;
        case PatientResponse.REJECTED:
          await this.handlePatientRejection(updatedEntry, response.notes);
          break;
        case PatientResponse.PENDING:
          await this.handlePatientPending(updatedEntry);
          break;
        default:
          console.warn(`Unknown patient response: ${response.patientResponse}`);
      }

      // Publish domain event
      await this.getEventPublisher().publish({
        eventType: 'PatientReschedulingResponseEvent',
        aggregateId: updatedEntry.appointmentId,
        aggregateType: 'Appointment',
        eventData: {
          queueEntryId: updatedEntry.id,
          appointmentId: updatedEntry.appointmentId,
          patientResponse: updatedEntry.patientResponse,
          respondedAt: updatedEntry.patientRespondedAt,
          notes: response.notes
        },
        metadata: {
          correlationId: updatedEntry.id,
          timestamp: new Date()
        }
      });

      console.log(`✅ Patient response processed for queue entry ${response.queueEntryId}`);
      return updatedEntry;
    } catch (error) {
      console.error('Failed to process patient response:', error);
      throw new Error(`Failed to process patient response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find available time slots for rescheduling
   */
  async findAvailableSlotsForRescheduling(queueEntryId: string): Promise<any[]> {
    try {
      const queueEntry = await this.reschedulingQueueRepository.findById(queueEntryId);
      if (!queueEntry) {
        throw new Error(`Rescheduling queue entry not found: ${queueEntryId}`);
      }

      // Get original appointment details
      const appointment = await this.appointmentRepository.findByAppointmentId(queueEntry.appointmentId);
      if (!appointment) {
        throw new Error(`Appointment not found: ${queueEntry.appointmentId}`);
      }

      // Update status to searching alternatives
      await this.reschedulingQueueRepository.updateStatus(
        queueEntryId,
        ReschedulingStatus.SEARCHING_ALTERNATIVES,
        'system'
      );

      // Find available slots (this would integrate with ConflictResolutionService)
      // For now, return empty array - this should be implemented based on your scheduling logic
      const availableSlots = await this.searchAlternativeSlots(
        appointment.getDoctorId(),
        new Date(appointment.getTimeSlot().appointmentDate),
        appointment.getDurationMinutes()
      );

      console.log(`Found ${availableSlots.length} alternative slots for appointment ${queueEntry.appointmentId}`);
      return availableSlots;
    } catch (error) {
      console.error('Failed to find available slots for rescheduling:', error);
      throw new Error(`Failed to find available slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete rescheduling with new appointment
   */
  async completeRescheduling(queueEntryId: string, newAppointmentId: string, resolvedBy: string): Promise<ReschedulingQueueEntry> {
    try {
      console.log(`Completing rescheduling for queue entry ${queueEntryId} with new appointment ${newAppointmentId}`);

      const completedEntry = await this.reschedulingQueueRepository.completeRescheduling(
        queueEntryId,
        newAppointmentId,
        resolvedBy
      );

      // Send confirmation notification
      const originalAppointment = await this.appointmentRepository.findByAppointmentId(completedEntry.appointmentId);
      if (originalAppointment) {
        const patientId = originalAppointment.getPatientId();
        if (patientId) {
          await this.reminderService.sendRescheduleNotification(
            completedEntry.appointmentId,
            patientId,
            new Date(originalAppointment.getTimeSlot().appointmentDate),
            'Rescheduling completed successfully'
          );
        }
      }

      // Publish completion event
      await this.getEventPublisher().publish({
        eventType: 'AppointmentReschedulingCompletedEvent',
        aggregateId: completedEntry.appointmentId,
        aggregateType: 'Appointment',
        eventData: {
          originalAppointmentId: completedEntry.appointmentId,
          newAppointmentId,
          queueEntryId: completedEntry.id,
          resolvedBy,
          completedAt: completedEntry.resolvedAt
        },
        metadata: {
          correlationId: completedEntry.id,
          timestamp: new Date()
        }
      });

      console.log(`✅ Rescheduling completed for queue entry ${queueEntryId}`);
      return completedEntry;
    } catch (error) {
      console.error('Failed to complete rescheduling:', error);
      throw new Error(`Failed to complete rescheduling: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process expired rescheduling entries
   */
  async processExpiredEntries(): Promise<void> {
    try {
      const expiredEntries = await this.reschedulingQueueRepository.findExpiredEntries();
      console.log(`Processing ${expiredEntries.length} expired rescheduling entries`);

      for (const entry of expiredEntries) {
        // Update status to expired
        await this.reschedulingQueueRepository.updateStatus(
          entry.id,
          ReschedulingStatus.EXPIRED,
          'system'
        );

        // Cancel original appointment due to rescheduling expiration
        try {
          const appointmentId = AppointmentId.create(entry.appointmentId);
          const appointment = await this.appointmentRepository.findById(appointmentId);
          
          if (appointment) {
            // Use the aggregate's cancel method to properly handle state transitions
            appointment.cancel(
              'Rescheduling request expired - appointment cancelled',
              'system'
            );
            // Save the updated appointment
            await this.appointmentRepository.save(appointment);
            console.log(`✅ Cancelled appointment ${entry.appointmentId} due to rescheduling expiration`);
          }
        } catch (error) {
          console.warn(`Failed to cancel appointment ${entry.appointmentId}:`, error instanceof Error ? error.message : 'Unknown error');
          // Continue processing other entries even if one fails
        }

        // Publish expiration event
        await this.getEventPublisher().publish({
          eventType: 'ReschedulingExpiredEvent',
          aggregateId: entry.appointmentId,
          aggregateType: 'Appointment',
          eventData: {
            queueEntryId: entry.id,
            appointmentId: entry.appointmentId,
            expiredAt: new Date(),
            originalConflictReason: entry.conflictReason
          },
          metadata: {
            correlationId: entry.id,
            timestamp: new Date()
          }
        });
      }

      console.log(`✅ Processed ${expiredEntries.length} expired rescheduling entries`);
    } catch (error) {
      console.error('Failed to process expired entries:', error);
      throw new Error(`Failed to process expired entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get rescheduling queue statistics
   */
  async getQueueStatistics(): Promise<any> {
    try {
      return await this.reschedulingQueueRepository.getQueueStatistics();
    } catch (error) {
      console.error('Failed to get queue statistics:', error);
      throw new Error(`Failed to get queue statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private determinePriorityFromReason(conflictReason: string): ReschedulingPriority {
    const reason = conflictReason.toLowerCase();
    if (reason.includes('emergency') || reason.includes('urgent')) {
      return ReschedulingPriority.EMERGENCY;
    }
    if (reason.includes('staff') || reason.includes('doctor')) {
      return ReschedulingPriority.URGENT;
    }
    return ReschedulingPriority.NORMAL;
  }

  private async updateAppointmentConflictStatus(appointmentId: string, conflictReason: string): Promise<void> {
    // This would update the appointment status to indicate conflict
    // Implementation depends on your appointment repository
    console.log(`Updating appointment ${appointmentId} conflict status: ${conflictReason}`);
  }

  private async handlePatientAcceptance(queueEntry: ReschedulingQueueEntry): Promise<void> {
    // Update status to accepted
    await this.reschedulingQueueRepository.updateStatus(
      queueEntry.id,
      ReschedulingStatus.ACCEPTED,
      'patient'
    );

    console.log(`Patient accepted rescheduling for queue entry ${queueEntry.id}`);
  }

  private async handlePatientRejection(queueEntry: ReschedulingQueueEntry, notes?: string): Promise<void> {
    // Update status to rejected
    await this.reschedulingQueueRepository.updateStatus(
      queueEntry.id,
      ReschedulingStatus.REJECTED,
      'patient'
    );

    console.log(`Patient rejected rescheduling for queue entry ${queueEntry.id}, notes: ${notes}`);
  }

  private async handlePatientPending(queueEntry: ReschedulingQueueEntry): Promise<void> {
    // Keep status as notified, patient is still considering
    console.log(`Patient pending response for queue entry ${queueEntry.id}`);
  }

  private async searchAlternativeSlots(doctorId: string, preferredDate: Date, durationMinutes: number): Promise<any[]> {
    // This should integrate with your ConflictResolutionService
    // For now, return empty array
    console.log(`Searching alternative slots for doctor ${doctorId} on ${preferredDate.toISOString()}`);
    return [];
  }
}
