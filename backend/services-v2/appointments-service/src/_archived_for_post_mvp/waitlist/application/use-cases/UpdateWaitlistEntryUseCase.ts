/**
 * UpdateWaitlistEntryUseCase - Application Layer
 * Updates waitlist entry preferences
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
import { WaitlistPriority, WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';

/**
 * Command DTO
 */
export interface UpdateWaitlistEntryCommand {
  waitlistId: string;
  preferredDate?: Date;
  preferredTimeSlot?: string;
  preferredDoctorId?: string;
  priority?: WaitlistPriority;
  notes?: string;
  status?: WaitlistStatus;
  isFlexibleDate?: boolean;
  isFlexibleTime?: boolean;
  isFlexibleDoctor?: boolean;
}

/**
 * Result DTO
 */
export interface UpdateWaitlistEntryResult {
  success: boolean;
  error?: string;
}

/**
 * Use case for updating waitlist entry
 */
export class UpdateWaitlistEntryUseCase {
  constructor(
    private readonly waitlistRepository: IAppointmentWaitlistRepository
  ) {}

  async execute(command: UpdateWaitlistEntryCommand): Promise<UpdateWaitlistEntryResult> {
    try {
      // Find waitlist entry
      const waitlist = await this.waitlistRepository.findById(command.waitlistId);
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      // Validate can update
      if (waitlist.status !== WaitlistStatus.WAITING) {
        throw new Error('Can only update WAITING entries');
      }

      // Validate command
      this.validateCommand(command);

      // Update preferences
      waitlist.updatePreferences({
        preferredDate: command.preferredDate,
        preferredTimeSlot: command.preferredTimeSlot,
        preferredDoctorId: command.preferredDoctorId,
        priority: command.priority,
        notes: command.notes,
        isFlexibleDate: command.isFlexibleDate,
        isFlexibleTime: command.isFlexibleTime,
        isFlexibleDoctor: command.isFlexibleDoctor
      });

      // Save changes
      await this.waitlistRepository.update(waitlist);

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update waitlist entry'
      };
    }
  }

  /**
   * Validate command
   */
  private validateCommand(command: UpdateWaitlistEntryCommand): void {
    // Validate preferred time slot format if provided
    if (command.preferredTimeSlot) {
      const validSlots = ['morning', 'afternoon', 'evening'];
      const timeRangePattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      
      if (!validSlots.includes(command.preferredTimeSlot) && !timeRangePattern.test(command.preferredTimeSlot)) {
        throw new Error('Invalid preferred time slot format');
      }
    }

    // Validate preferred date is in the future
    if (command.preferredDate && command.preferredDate < new Date()) {
      throw new Error('Preferred date must be in the future');
    }
  }
}

