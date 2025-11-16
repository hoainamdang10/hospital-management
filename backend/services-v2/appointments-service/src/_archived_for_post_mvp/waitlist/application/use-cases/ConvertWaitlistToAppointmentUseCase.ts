/**
 * ConvertWaitlistToAppointmentUseCase - Application Layer
 * Converts waitlist entry to actual appointment
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
import { WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';

/**
 * Command DTO
 */
export interface ConvertWaitlistToAppointmentCommand {
  waitlistId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm:ss
  doctorId: string;
  departmentId?: string;
  durationMinutes?: number;
  convertedBy: string;
}

/**
 * Result DTO
 */
export interface ConvertWaitlistToAppointmentResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

/**
 * Use case for converting waitlist to appointment
 * 
 * NOTE: This use case only marks the waitlist as MATCHED.
 * The actual appointment creation should be done by calling CreateAppointmentUseCase
 * after this use case succeeds.
 */
export class ConvertWaitlistToAppointmentUseCase {
  constructor(
    private readonly waitlistRepository: IAppointmentWaitlistRepository
  ) {}

  async execute(command: ConvertWaitlistToAppointmentCommand): Promise<ConvertWaitlistToAppointmentResult> {
    try {
      // Validate command
      this.validateCommand(command);

      // Find waitlist entry
      const waitlist = await this.waitlistRepository.findById(command.waitlistId);
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      // Check if can be matched
      if (!waitlist.canBeMatched()) {
        throw new Error('Waitlist entry cannot be matched (status or expired)');
      }

      // Generate appointment ID (temporary - will be replaced by actual appointment creation)
      const appointmentId = crypto.randomUUID();

      // Mark as matched
      waitlist.markAsMatched(appointmentId, command.convertedBy);

      // Save changes
      await this.waitlistRepository.update(waitlist);

      return {
        success: true,
        appointmentId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to convert waitlist to appointment'
      };
    }
  }

  /**
   * Validate command
   */
  private validateCommand(command: ConvertWaitlistToAppointmentCommand): void {
    if (!command.waitlistId) {
      throw new Error('Waitlist ID is required');
    }
    if (!command.appointmentDate) {
      throw new Error('Appointment date is required');
    }
    if (!command.appointmentTime) {
      throw new Error('Appointment time is required');
    }
    if (!command.doctorId) {
      throw new Error('Doctor ID is required');
    }
    if (!command.convertedBy) {
      throw new Error('Converted by is required');
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(command.appointmentDate)) {
      throw new Error('Invalid appointment date format (expected YYYY-MM-DD)');
    }

    // Validate time format (HH:mm:ss or HH:mm)
    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timePattern.test(command.appointmentTime)) {
      throw new Error('Invalid appointment time format (expected HH:mm:ss or HH:mm)');
    }

    // Validate appointment is in the future
    const appointmentDateTime = new Date(`${command.appointmentDate}T${command.appointmentTime}`);
    if (appointmentDateTime <= new Date()) {
      throw new Error('Appointment date/time must be in the future');
    }
  }
}

