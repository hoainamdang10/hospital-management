"use strict";
/**
 * RemoveFromWaitlistUseCase - Application Layer
 * Removes patient from waitlist (cancellation)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveFromWaitlistUseCase = void 0;
const AppointmentWaitlist_entity_1 = require("../../domain/entities/AppointmentWaitlist.entity");
/**
 * Use case for removing patient from waitlist
 */
class RemoveFromWaitlistUseCase {
    constructor(waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }
    async execute(command) {
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
            if (waitlist.status === AppointmentWaitlist_entity_1.WaitlistStatus.CANCELLED) {
                throw new Error('Waitlist entry already cancelled');
            }
            if (waitlist.status === AppointmentWaitlist_entity_1.WaitlistStatus.CONVERTED) {
                throw new Error('Cannot cancel converted waitlist entry');
            }
            // Cancel the entry
            waitlist.cancel(command.cancelledBy, command.reason);
            // Save changes
            await this.waitlistRepository.update(waitlist);
            return {
                success: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to remove from waitlist'
            };
        }
    }
}
exports.RemoveFromWaitlistUseCase = RemoveFromWaitlistUseCase;
//# sourceMappingURL=RemoveFromWaitlistUseCase.js.map