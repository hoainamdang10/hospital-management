/**
 * RemoveFromWaitlistUseCase - Application Layer
 * Removes patient from waitlist (cancellation)
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
export interface RemoveFromWaitlistCommand {
  waitlistId: string;
  cancelledBy: string;
  reason?: string;
}

/**
 * Result DTO
 */
export interface RemoveFromWaitlistResult {
  success: boolean;
  error?: string;
}

/**
 * Use case for removing patient from waitlist
 */
export class RemoveFromWaitlistUseCase {
  constructor(
    private readonly waitlistRepository: IAppointmentWaitlistRepository
  ) {}

  async execute(command: RemoveFromWaitlistCommand): Promise<RemoveFromWaitlistResult> {
    try {
      // Validate command
      if (!command.waitlistId) {
        throw new Error('Waitlist ID is required');
      }
      if (!command.cancelledBy) {
        throw new Error('Cancelled by is required');
      }

      // Find waitlist entry
      const waitlist = await this.waitlistRepository.findById(command.waitlistId);
      if (!waitlist) {
        throw new Error('Waitlist entry not found');
      }

      // Check if already cancelled or converted
      if (waitlist.status === WaitlistStatus.CANCELLED) {
        throw new Error('Waitlist entry already cancelled');
      }
      if (waitlist.status === WaitlistStatus.CONVERTED) {
        throw new Error('Cannot cancel converted waitlist entry');
      }

      // Cancel the entry
      waitlist.cancel(command.cancelledBy, command.reason);

      // Save changes
      await this.waitlistRepository.update(waitlist);

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove from waitlist'
      };
    }
  }
}

