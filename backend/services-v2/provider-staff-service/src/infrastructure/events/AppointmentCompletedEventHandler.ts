/**
 * AppointmentCompletedEventHandler - Event Handler
 * Provider/Staff Service V2
 * 
 * Handles AppointmentCompleted events from Appointments Service
 * Logs completion for audit and performance tracking
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from '../../application/interfaces/ILogger';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface AppointmentCompletedEventData {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  completedAt: string;
  duration?: number;
}

/**
 * Handler for AppointmentCompleted events
 * Logs completion for staff performance tracking
 */
export class AppointmentCompletedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger
  ) {}

  async handle(eventData: AppointmentCompletedEventData): Promise<void> {
    try {
      this.logger.info('Handling AppointmentCompleted event', {
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId,
        completedAt: eventData.completedAt
      });

      // Find staff by doctorId
      const staffId = StaffId.fromString(eventData.doctorId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        this.logger.warn('Staff not found for completed appointment', {
          doctorId: eventData.doctorId,
          appointmentId: eventData.appointmentId
        });
        return;
      }

      // Log appointment completion for audit and performance tracking
      this.logger.info('Appointment completed by staff', {
        staffId: staff.id,
        staffName: staff.personalInfo.fullName,
        appointmentId: eventData.appointmentId,
        patientId: eventData.patientId,
        completedAt: eventData.completedAt,
        duration: eventData.duration
      });

      // Note: We don't update staff aggregate here. If we need to track
      // completed appointment count or performance metrics, we would:
      // 1. Add completedAppointmentCount to ProviderStaff aggregate
      // 2. Increment it here
      // 3. Save to repository

    } catch (error) {
      this.logger.error('Error handling AppointmentCompleted event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        appointmentId: eventData.appointmentId,
        doctorId: eventData.doctorId
      });
      throw error;
    }
  }
}

