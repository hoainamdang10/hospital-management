/**
 * AddToWaitlistUseCase - Application Layer
 * Handles adding patient to appointment waitlist
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */

import { 
  AppointmentWaitlist, 
  WaitlistPriority,
  PreferredContactMethod 
} from '../../domain/entities/AppointmentWaitlist.entity';
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';

/**
 * Command DTO
 */
export interface AddToWaitlistCommand {
  patientId: string;
  preferredDoctorId?: string;
  preferredDepartmentId?: string;
  preferredDate?: Date;
  preferredTimeSlot?: string;
  appointmentType: string;
  priority?: WaitlistPriority;
  notes?: string;
  reason?: string;
  isFlexibleDate?: boolean;
  isFlexibleTime?: boolean;
  isFlexibleDoctor?: boolean;
  expiresAt?: Date;
  contactPhone?: string;
  contactEmail?: string;
  preferredContactMethod?: PreferredContactMethod;
  createdBy?: string;
}

/**
 * Result DTO
 */
export interface AddToWaitlistResult {
  success: boolean;
  waitlistId?: string;
  position?: number;
  error?: string;
}

/**
 * Use case for adding patient to waitlist
 */
export class AddToWaitlistUseCase {
  constructor(
    private readonly waitlistRepository: IAppointmentWaitlistRepository
  ) {}

  async execute(command: AddToWaitlistCommand): Promise<AddToWaitlistResult> {
    try {
      // Validate command
      this.validateCommand(command);

      // Create waitlist entry
      const waitlist = AppointmentWaitlist.create({
        patientId: command.patientId,
        preferredDoctorId: command.preferredDoctorId,
        preferredDepartmentId: command.preferredDepartmentId,
        preferredDate: command.preferredDate,
        preferredTimeSlot: command.preferredTimeSlot,
        appointmentType: command.appointmentType,
        priority: command.priority || WaitlistPriority.NORMAL,
        notes: command.notes,
        reason: command.reason,
        isFlexibleDate: command.isFlexibleDate ?? true,
        isFlexibleTime: command.isFlexibleTime ?? true,
        isFlexibleDoctor: command.isFlexibleDoctor ?? true,
        expiresAt: command.expiresAt,
        contactPhone: command.contactPhone,
        contactEmail: command.contactEmail,
        preferredContactMethod: command.preferredContactMethod || PreferredContactMethod.SMS,
        createdBy: command.createdBy
      });

      // Save to repository
      await this.waitlistRepository.save(waitlist);

      // Get position in waitlist
      const position = await this.waitlistRepository.getWaitlistPosition(waitlist.waitlistId);

      return {
        success: true,
        waitlistId: waitlist.waitlistId,
        position
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add to waitlist'
      };
    }
  }

  /**
   * Validate command
   */
  private validateCommand(command: AddToWaitlistCommand): void {
    if (!command.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!command.appointmentType) {
      throw new Error('Appointment type is required');
    }

    // Validate preferred time slot format if provided
    if (command.preferredTimeSlot) {
      const validSlots = ['morning', 'afternoon', 'evening'];
      const timeRangePattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      
      if (!validSlots.includes(command.preferredTimeSlot) && !timeRangePattern.test(command.preferredTimeSlot)) {
        throw new Error('Invalid preferred time slot format');
      }
    }

    // Validate expiration date
    if (command.expiresAt && command.expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    // Validate contact information
    if (!command.contactPhone && !command.contactEmail) {
      throw new Error('At least one contact method (phone or email) is required');
    }

    // Validate preferred date is in the future
    if (command.preferredDate && command.preferredDate < new Date()) {
      throw new Error('Preferred date must be in the future');
    }
  }
}

