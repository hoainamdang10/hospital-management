/**
 * AppointmentCancelledEventHandler - Event Handler
 * Provider/Staff Service V2
 * 
 * Handles AppointmentCancelled events from Appointments Service
 * Logs cancellation for audit purposes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from '../../application/interfaces/ILogger';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface AppointmentCancelledEventData {
  appointmentId: string;
  doctorId: string;
  cancelledBy: string;
  cancellationReason?: string;
  cancelledAt: string;
}

/**
 * Handler for AppointmentCancelled events
 * Logs cancellation for staff audit trail
 */
export class AppointmentCancelledEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger
  ) {}

  async handle(eventData: AppointmentCancelledEventData): Promise<void> {
    try {
      this.logger.info('Handling AppointmentCancelled event', {
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId,
        cancelledBy: eventData.cancelledBy,
        cancellationReason: eventData.cancellationReason
      });

      // Find staff by doctorId
      const staffId = StaffId.fromString(eventData.doctorId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        this.logger.warn('Staff not found for cancelled appointment', {
          doctorId: eventData.doctorId,
          appointmentId: eventData.appointmentId
        });
        return;
      }

      // Log appointment cancellation for audit
      this.logger.info('Appointment cancelled for staff', {
        staffId: staff.id,
        staffName: staff.personalInfo.fullName,
        appointmentId: eventData.appointmentId,
        cancelledBy: eventData.cancelledBy,
        cancellationReason: eventData.cancellationReason,
        cancelledAt: eventData.cancelledAt
      });

      // Note: We don't update staff aggregate here because appointment management
      // is the responsibility of Appointments Service. This is just for audit logging.

    } catch (error) {
      this.logger.error('Error handling AppointmentCancelled event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId
      });
      throw error;
    }
  }
}

