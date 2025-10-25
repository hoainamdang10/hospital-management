"use strict";
/**
 * IdentityUserDeletedEventHandler
 * Handles identity.user.deleted events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityUserDeletedEventHandler = void 0;
/**
 * Identity User Deleted Event Handler
 * Processes user deletion events from Identity Service
 */
class IdentityUserDeletedEventHandler {
    constructor(logger, patientRepository) {
        this.logger = logger;
        this.patientRepository = patientRepository;
    }
    /**
     * Handle identity.user.deleted event
     */
    async handle(eventData) {
        try {
            this.logger.info('Processing identity.user.deleted event', {
                userId: eventData.userId,
                role: eventData.role
            });
            // Only process if user role is PATIENT
            if (eventData.role !== 'PATIENT') {
                this.logger.debug('Skipping non-patient user deletion', {
                    userId: eventData.userId,
                    role: eventData.role
                });
                return;
            }
            // Find patient by user ID
            const patient = await this.patientRepository.findByUserId(eventData.userId);
            if (!patient) {
                this.logger.warn('No patient found for deleted user', {
                    userId: eventData.userId
                });
                return;
            }
            // Deactivate patient (soft delete)
            // Note: We don't hard delete patient records for compliance/audit reasons
            if (patient.isActive()) {
                patient.deactivate('User account deleted', eventData.deletedBy);
                await this.patientRepository.save(patient);
                this.logger.info('Patient deactivated due to user deletion', {
                    userId: eventData.userId,
                    patientId: patient.id
                });
            }
            else {
                this.logger.debug('Patient already inactive', {
                    userId: eventData.userId,
                    patientId: patient.id
                });
            }
        }
        catch (error) {
            this.logger.error('Error handling identity.user.deleted event', {
                userId: eventData.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.IdentityUserDeletedEventHandler = IdentityUserDeletedEventHandler;
//# sourceMappingURL=IdentityUserDeletedEventHandler.js.map