"use strict";
/**
 * AddToWaitlistUseCase - Application Layer
 * Handles adding patient to appointment waitlist
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddToWaitlistUseCase = void 0;
const AppointmentWaitlist_entity_1 = require("../../domain/entities/AppointmentWaitlist.entity");
/**
 * Use case for adding patient to waitlist
 */
class AddToWaitlistUseCase {
    constructor(waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }
    async execute(command) {
        try {
            // Validate command
            this.validateCommand(command);
            // Create waitlist entry
            const waitlist = AppointmentWaitlist_entity_1.AppointmentWaitlist.create({
                patientId: command.patientId,
                preferredDoctorId: command.preferredDoctorId,
                preferredDepartmentId: command.preferredDepartmentId,
                preferredDate: command.preferredDate,
                preferredTimeSlot: command.preferredTimeSlot,
                appointmentType: command.appointmentType,
                priority: command.priority || AppointmentWaitlist_entity_1.WaitlistPriority.NORMAL,
                notes: command.notes,
                reason: command.reason,
                isFlexibleDate: command.isFlexibleDate ?? true,
                isFlexibleTime: command.isFlexibleTime ?? true,
                isFlexibleDoctor: command.isFlexibleDoctor ?? true,
                expiresAt: command.expiresAt,
                contactPhone: command.contactPhone,
                contactEmail: command.contactEmail,
                preferredContactMethod: command.preferredContactMethod || AppointmentWaitlist_entity_1.PreferredContactMethod.SMS,
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
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to add to waitlist'
            };
        }
    }
    /**
     * Validate command
     */
    validateCommand(command) {
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
exports.AddToWaitlistUseCase = AddToWaitlistUseCase;
//# sourceMappingURL=AddToWaitlistUseCase.js.map