"use strict";
/**
 * IdentityUserCreatedEventHandler
 * Handles identity.user.created events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityUserCreatedEventHandler = void 0;
/**
 * Identity User Created Event Handler
 * Processes user creation events from Identity Service
 */
class IdentityUserCreatedEventHandler {
    constructor(logger, patientRepository) {
        this.logger = logger;
        this.patientRepository = patientRepository;
    }
    /**
     * Handle identity.user.created event
     */
    async handle(eventData) {
        try {
            this.logger.info('Processing identity.user.created event', {
                userId: eventData.userId,
                role: eventData.role
            });
            // Only process if user role is PATIENT
            if (eventData.role !== 'PATIENT') {
                this.logger.debug('Skipping non-patient user creation', {
                    userId: eventData.userId,
                    role: eventData.role
                });
                return;
            }
            // Check if patient already exists for this user
            const existingPatient = await this.patientRepository.findByUserId(eventData.userId);
            if (existingPatient) {
                this.logger.warn('Patient already exists for user', {
                    userId: eventData.userId,
                    patientId: existingPatient.id
                });
                return;
            }
            // Check if personalInfo is available
            if (!eventData.personalInfo) {
                this.logger.warn('Cannot create patient - missing personalInfo in event', {
                    userId: eventData.userId,
                    email: eventData.email
                });
                return;
            }
            // Auto-create patient record from user information
            this.logger.info('Auto-creating patient record from user creation event', {
                userId: eventData.userId,
                email: eventData.email,
                fullName: eventData.personalInfo.fullName
            });
            // Create patient using repository
            // Note: Patient entity will be created with the user information
            const patient = await this.patientRepository.createFromUserEvent({
                userId: eventData.userId,
                email: eventData.email,
                fullName: eventData.personalInfo.fullName,
                phoneNumber: eventData.personalInfo.phoneNumber,
                address: eventData.personalInfo.address,
                dateOfBirth: eventData.personalInfo.dateOfBirth,
                gender: eventData.personalInfo.gender,
                citizenId: eventData.personalInfo.citizenId
            });
            this.logger.info('Patient record created successfully', {
                userId: eventData.userId,
                patientId: patient.id,
                email: eventData.email
            });
        }
        catch (error) {
            this.logger.error('Error handling identity.user.created event', {
                userId: eventData.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.IdentityUserCreatedEventHandler = IdentityUserCreatedEventHandler;
//# sourceMappingURL=IdentityUserCreatedEventHandler.js.map