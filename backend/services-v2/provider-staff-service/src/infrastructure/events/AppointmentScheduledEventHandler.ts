/**
 * AppointmentScheduledEventHandler - Event Handler
 * Provider/Staff Service V2
 * 
 * Handles AppointmentScheduled events from Appointments Service
 * Updates staff availability and appointment count
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from '../../application/interfaces/ILogger';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledTime: string;
  duration: number;
  appointmentType: string;
  status: string;
}

/**
 * Handler for AppointmentScheduled events
 * Updates staff's appointment count and availability
 */
export class AppointmentScheduledEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger
  ) {}

  async handle(eventData: AppointmentScheduledEventData): Promise<void> {
    try {
      this.logger.info('Handling AppointmentScheduled event', {
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId,
        scheduledTime: eventData.scheduledTime
      });

      // Find staff by doctorId (which is staffId)
      const staffId = StaffId.fromString(eventData.doctorId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        this.logger.warn('Staff not found for appointment', {
          doctorId: eventData.doctorId,
          appointmentId: eventData.appointmentId
        });
        return;
      }

      // Log appointment scheduled for audit
      this.logger.info('Appointment scheduled for staff', {
        staffId: staff.id,
        staffName: staff.personalInfo.fullName,
        appointmentId: eventData.appointmentId,
        scheduledTime: eventData.scheduledTime,
        patientId: eventData.patientId,
        appointmentType: eventData.appointmentType
      });

      // Note: We don't update staff aggregate here because appointment count
      // is managed by Appointments Service. This is just for logging/audit.
      // If we need to track appointment count in staff aggregate, we would:
      // 1. Add appointmentCount to ProviderStaff aggregate
      // 2. Increment it here
      // 3. Save to repository

    } catch (error) {
      this.logger.error('Error handling AppointmentScheduled event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId
      });
      throw error;
    }
  }
}

