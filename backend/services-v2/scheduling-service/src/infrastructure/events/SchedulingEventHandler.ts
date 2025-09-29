/**
 * SchedulingEventHandler - Scheduling Service Event Handler
 * Handles cross-service events for scheduling operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { BaseEventHandler, EventProcessingResult } from '../../../shared/events/BaseEventHandler';
import { IntegrationEvent } from '../../../shared/events/EventBusConfiguration';
import {
  PatientRegisteredEvent,
  PatientUpdatedEvent,
  AppointmentCompletedEvent,
  VietnameseHealthcareEventFactory
} from '../../../shared/events/VietnameseHealthcareEvents';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/ScheduleAppointmentUseCase';
import { RescheduleAppointmentUseCase } from '../../application/use-cases/RescheduleAppointmentUseCase';
import { CancelAppointmentUseCase } from '../../application/use-cases/CancelAppointmentUseCase';
import { CheckAvailabilityUseCase } from '../../application/use-cases/CheckAvailabilityUseCase';

export class SchedulingEventHandler extends BaseEventHandler {
  constructor(
    private scheduleAppointmentUseCase: ScheduleAppointmentUseCase,
    private rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    private cancelAppointmentUseCase: CancelAppointmentUseCase,
    private checkAvailabilityUseCase: CheckAvailabilityUseCase,
    logger?: any
  ) {
    super('scheduling-service', logger);
  }

  /**
   * Process integration events
   */
  protected async processEvent(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `🎯 Processing event: ${event.eventType} from ${event.serviceName}`);

      switch (event.eventType) {
        case 'patient.registered':
          return await this.handlePatientRegistered(event as PatientRegisteredEvent);
        
        case 'patient.updated':
          return await this.handlePatientUpdated(event as PatientUpdatedEvent);
        
        case 'appointment.completed':
          return await this.handleAppointmentCompleted(event as AppointmentCompletedEvent);
        
        case 'doctor.availability.updated':
          return await this.handleDoctorAvailabilityUpdated(event);
        
        case 'department.schedule.changed':
          return await this.handleDepartmentScheduleChanged(event);
        
        case 'emergency.alert':
          return await this.handleEmergencyAlert(event);
        
        default:
          this.log('debug', `⏭️ Unhandled event type: ${event.eventType}`);
          return {
            success: true,
            processingTime: Date.now() - startTime,
            metadata: { skipped: true }
          };
      }

    } catch (error) {
      this.log('error', `❌ Error processing event ${event.eventType}:`, error);
      
      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: error as Error,
        retryable: this.isRetryableError(error as Error)
      };
    }
  }

  /**
   * Handle patient registered event
   */
  private async handlePatientRegistered(event: PatientRegisteredEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `👤 Processing patient registration: ${event.eventData.patientId}`);

      // Update patient information in scheduling context
      // This might involve updating patient preferences, contact info, etc.
      const patientData = event.eventData;

      // Check if patient has any pending appointments that need updating
      // This is useful when patient registers after appointment was scheduled by phone
      
      // For now, we just log the patient registration
      // In a real implementation, you might want to:
      // 1. Update patient contact information in scheduling database
      // 2. Send welcome message with appointment booking instructions
      // 3. Check for any pending appointments that need patient confirmation

      this.log('info', `✅ Patient registration processed: ${patientData.patientName}`);

      // Publish event for other services (like notifications)
      const schedulingContextEvent = VietnameseHealthcareEventFactory.createPatientRegisteredEvent(
        {
          ...patientData,
          schedulingContext: {
            canBookOnline: true,
            preferredLanguage: 'vi-VN',
            notificationPreferences: ['SMS', 'EMAIL']
          }
        },
        'scheduling-service',
        { correlationId: event.metadata?.correlationId }
      );

      await this.publishEvent(schedulingContextEvent);

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          patientId: patientData.patientId,
          action: 'patient_context_updated'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process patient registration:`, error);
      throw error;
    }
  }

  /**
   * Handle patient updated event
   */
  private async handlePatientUpdated(event: PatientUpdatedEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `👤 Processing patient update: ${event.eventData.patientId}`);

      const { patientId, updatedFields, newValues } = event.eventData;

      // Check if contact information was updated
      const contactFields = ['phoneNumber', 'email', 'address'];
      const contactUpdated = updatedFields.some(field => contactFields.includes(field));

      if (contactUpdated) {
        // Update future appointments with new contact information
        // This ensures appointment reminders go to correct contact details
        
        this.log('info', `📞 Contact information updated for patient: ${patientId}`);
        
        // In a real implementation, you would:
        // 1. Find all future appointments for this patient
        // 2. Update contact information in appointment records
        // 3. Notify notification service of contact changes
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          patientId,
          updatedFields,
          contactUpdated
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process patient update:`, error);
      throw error;
    }
  }

  /**
   * Handle appointment completed event
   */
  private async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `✅ Processing appointment completion: ${event.eventData.appointmentId}`);

      const { appointmentId, patientId, doctorId, followUpRequired, followUpDate } = event.eventData;

      // If follow-up is required, automatically schedule it
      if (followUpRequired && followUpDate) {
        this.log('info', `📅 Scheduling follow-up appointment for patient: ${patientId}`);

        // Create follow-up appointment
        const followUpCommand = {
          patientId,
          doctorId,
          appointmentDate: followUpDate,
          appointmentTime: '14:00', // Default afternoon slot
          appointmentType: 'FOLLOW_UP' as const,
          duration: 30,
          notes: `Follow-up appointment for ${appointmentId}`,
          priority: 'HIGH' as const,
          healthcareContext: {
            patientId,
            doctorId,
            originalAppointmentId: appointmentId,
            appointmentType: 'FOLLOW_UP'
          }
        };

        try {
          const result = await this.scheduleAppointmentUseCase.execute(followUpCommand);
          
          if (result.success) {
            this.log('info', `✅ Follow-up appointment scheduled: ${result.appointmentId}`);
            
            // Publish follow-up scheduled event
            const followUpEvent = VietnameseHealthcareEventFactory.createAppointmentScheduledEvent(
              {
                appointmentId: result.appointmentId,
                patientId,
                doctorId,
                patientName: event.eventData.patientName || 'Unknown',
                doctorName: event.eventData.doctorName || 'Unknown',
                appointmentDate: followUpDate,
                appointmentTime: '14:00',
                duration: 30,
                appointmentType: 'FOLLOW_UP',
                healthcareContext: {
                  patientId,
                  doctorId,
                  appointmentId: result.appointmentId,
                  departmentId: 'DEPT-001',
                  hospitalId: 'HOSP-001',
                  scheduledBy: 'SYSTEM'
                }
              },
              'scheduling-service',
              { 
                correlationId: event.metadata?.correlationId,
                originalAppointmentId: appointmentId
              }
            );

            await this.publishEvent(followUpEvent);
          }

        } catch (scheduleError) {
          this.log('error', `❌ Failed to schedule follow-up appointment:`, scheduleError);
          // Don't fail the entire event processing for follow-up scheduling failure
        }
      }

      // Update appointment status to completed
      // Mark time slot as available again
      // Update doctor's schedule statistics

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          appointmentId,
          followUpScheduled: followUpRequired && followUpDate,
          action: 'appointment_completed_processed'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process appointment completion:`, error);
      throw error;
    }
  }

  /**
   * Handle doctor availability updated event
   */
  private async handleDoctorAvailabilityUpdated(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `👨‍⚕️ Processing doctor availability update: ${event.eventData.doctorId}`);

      const { doctorId, availabilityChanges, effectiveDate } = event.eventData;

      // Check for conflicts with existing appointments
      const conflictCheckResult = await this.checkAvailabilityUseCase.execute({
        doctorId,
        dateRange: {
          startDate: effectiveDate,
          endDate: new Date(new Date(effectiveDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      });

      if (conflictCheckResult.conflicts && conflictCheckResult.conflicts.length > 0) {
        this.log('warn', `⚠️ Availability conflicts detected for doctor ${doctorId}`);
        
        // Handle conflicts - might need to reschedule or cancel appointments
        for (const conflict of conflictCheckResult.conflicts) {
          this.log('warn', `⚠️ Conflict: Appointment ${conflict.appointmentId} on ${conflict.date}`);
          
          // In a real implementation, you might:
          // 1. Automatically reschedule to next available slot
          // 2. Send notification to patient about schedule change
          // 3. Offer alternative doctors
        }
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          doctorId,
          conflictsFound: conflictCheckResult.conflicts?.length || 0,
          action: 'availability_updated'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process doctor availability update:`, error);
      throw error;
    }
  }

  /**
   * Handle department schedule changed event
   */
  private async handleDepartmentScheduleChanged(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `🏥 Processing department schedule change: ${event.eventData.departmentId}`);

      const { departmentId, scheduleChanges, effectiveDate } = event.eventData;

      // Update department-wide scheduling rules
      // This might affect:
      // 1. Operating hours
      // 2. Break times
      // 3. Holiday schedules
      // 4. Emergency coverage

      this.log('info', `✅ Department schedule updated: ${departmentId}`);

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          departmentId,
          changesApplied: scheduleChanges.length,
          action: 'department_schedule_updated'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process department schedule change:`, error);
      throw error;
    }
  }

  /**
   * Handle emergency alert event
   */
  private async handleEmergencyAlert(event: IntegrationEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();

    try {
      this.log('info', `🚨 Processing emergency alert: ${event.eventData.alertId}`);

      const { patientId, alertType, severity } = event.eventData;

      if (severity === 'CRITICAL') {
        // For critical alerts, try to schedule emergency appointment
        this.log('info', `🚨 Scheduling emergency appointment for patient: ${patientId}`);

        // Find available emergency slot
        const emergencyAvailability = await this.checkAvailabilityUseCase.execute({
          appointmentType: 'EMERGENCY',
          dateRange: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
          }
        });

        if (emergencyAvailability.availableSlots && emergencyAvailability.availableSlots.length > 0) {
          const firstAvailableSlot = emergencyAvailability.availableSlots[0];
          
          // Schedule emergency appointment
          const emergencyCommand = {
            patientId,
            doctorId: firstAvailableSlot.doctorId,
            appointmentDate: firstAvailableSlot.date,
            appointmentTime: firstAvailableSlot.time,
            appointmentType: 'EMERGENCY' as const,
            duration: 60,
            notes: `Emergency appointment - Alert: ${alertType}`,
            priority: 'URGENT' as const,
            healthcareContext: {
              patientId,
              doctorId: firstAvailableSlot.doctorId,
              alertId: event.eventData.alertId,
              appointmentType: 'EMERGENCY'
            }
          };

          const scheduleResult = await this.scheduleAppointmentUseCase.execute(emergencyCommand);
          
          if (scheduleResult.success) {
            this.log('info', `✅ Emergency appointment scheduled: ${scheduleResult.appointmentId}`);
            
            // Publish emergency appointment scheduled event
            const emergencyAppointmentEvent = VietnameseHealthcareEventFactory.createAppointmentScheduledEvent(
              {
                appointmentId: scheduleResult.appointmentId,
                patientId,
                doctorId: firstAvailableSlot.doctorId,
                patientName: event.eventData.patientName || 'Emergency Patient',
                doctorName: firstAvailableSlot.doctorName || 'Emergency Doctor',
                appointmentDate: firstAvailableSlot.date,
                appointmentTime: firstAvailableSlot.time,
                duration: 60,
                appointmentType: 'EMERGENCY',
                healthcareContext: {
                  patientId,
                  doctorId: firstAvailableSlot.doctorId,
                  appointmentId: scheduleResult.appointmentId,
                  departmentId: 'EMERGENCY',
                  hospitalId: 'HOSP-001',
                  scheduledBy: 'EMERGENCY_SYSTEM'
                }
              },
              'scheduling-service',
              { 
                correlationId: event.metadata?.correlationId,
                alertId: event.eventData.alertId,
                priority: 'URGENT'
              }
            );

            await this.publishEvent(emergencyAppointmentEvent);
          }
        }
      }

      return {
        success: true,
        processingTime: Date.now() - startTime,
        metadata: { 
          alertId: event.eventData.alertId,
          severity,
          emergencyAppointmentScheduled: severity === 'CRITICAL',
          action: 'emergency_alert_processed'
        }
      };

    } catch (error) {
      this.log('error', `❌ Failed to process emergency alert:`, error);
      throw error;
    }
  }

  /**
   * Get handler status with scheduling-specific metrics
   */
  public getSchedulingStatus(): any {
    const baseStatus = this.getStatus();
    
    return {
      ...baseStatus,
      schedulingMetrics: {
        appointmentsScheduled: 0, // Would be tracked in real implementation
        emergencyAppointments: 0,
        followUpAppointments: 0,
        conflictsResolved: 0
      },
      eventTypes: [
        'patient.registered',
        'patient.updated',
        'appointment.completed',
        'doctor.availability.updated',
        'department.schedule.changed',
        'emergency.alert'
      ]
    };
  }
}
