"use strict";
/**
 * UpdateWaitlistEntryUseCase - Application Layer
 * Updates waitlist entry preferences
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWaitlistEntryUseCase = void 0;
const AppointmentWaitlist_entity_1 = require("../../domain/entities/AppointmentWaitlist.entity");
/**
 * Use case for updating waitlist entry
 */
class UpdateWaitlistEntryUseCase {
    constructor(waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }
    async execute(command) {
        try {
            // Find waitlist entry
            const waitlist = await this.waitlistRepository.findById(command.waitlistId);
            if (!waitlist) {
                throw new Error('Waitlist entry not found');
            }
            // Validate can update
            if (waitlist.status !== AppointmentWaitlist_entity_1.WaitlistStatus.WAITING) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to update waitlist entry'
            };
        }
    }
    /**
     * Validate command
     */
    validateCommand(command) {
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
exports.UpdateWaitlistEntryUseCase = UpdateWaitlistEntryUseCase;
//# sourceMappingURL=UpdateWaitlistEntryUseCase.js.map