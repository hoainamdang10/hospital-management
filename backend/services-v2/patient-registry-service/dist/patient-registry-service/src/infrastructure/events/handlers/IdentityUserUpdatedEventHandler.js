"use strict";
/**
 * IdentityUserUpdatedEventHandler
 * Handles identity.user.updated events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityUserUpdatedEventHandler = void 0;
/**
 * Identity User Updated Event Handler
 * Processes user update events from Identity Service
 */
class IdentityUserUpdatedEventHandler {
    constructor(logger, patientRepository) {
        this.logger = logger;
        this.patientRepository = patientRepository;
    }
    /**
     * Handle identity.user.updated event
     */
    async handle(eventData) {
        try {
            this.logger.info('Processing identity.user.updated event', {
                userId: eventData.userId
            });
            // Find patient by user ID
            const patient = await this.patientRepository.findByUserId(eventData.userId);
            if (!patient) {
                this.logger.debug('No patient found for updated user', {
                    userId: eventData.userId
                });
                return;
            }
            // Log the update - actual patient data sync can be implemented later
            // For now, we just track that the user was updated
            this.logger.info('User updated - patient record exists', {
                userId: eventData.userId,
                patientId: patient.id,
                hasEmailUpdate: !!eventData.email,
                hasPhoneUpdate: !!eventData.phoneNumber
            });
            // TODO: Implement patient data sync if needed
            // For example, update contact information if changed in Identity Service
        }
        catch (error) {
            this.logger.error('Error handling identity.user.updated event', {
                userId: eventData.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.IdentityUserUpdatedEventHandler = IdentityUserUpdatedEventHandler;
//# sourceMappingURL=IdentityUserUpdatedEventHandler.js.map