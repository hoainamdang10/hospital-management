"use strict";
/**
 * UserActivatedEventHandler
 * Handles user.activated events from Identity Service
 * Creates patient records when users verify their email and get activated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivatedEventHandler = void 0;
/**
 * User Activated Event Handler
 * Processes user activation events from Identity Service
 * Creates patient records after email verification
 */
class UserActivatedEventHandler {
    constructor(logger, patientRepository) {
        this.logger = logger;
        this.patientRepository = patientRepository;
    }
    /**
     * Handle user.activated event
     */
    async handle(eventData) {
        try {
            this.logger.info('Processing user.activated event', {
                userId: eventData.userId,
                email: eventData.email,
                activatedAt: eventData.activatedAt
            });
            // Check if patient already exists for this user
            const existingPatient = await this.patientRepository.findByUserId(eventData.userId);
            if (existingPatient) {
                this.logger.warn('Patient already exists for activated user', {
                    userId: eventData.userId,
                    patientId: existingPatient.id,
                    note: 'This may indicate a duplicate activation event'
                });
                return;
            }
            // Create patient record from activated user information
            this.logger.info('Creating patient record for activated user', {
                userId: eventData.userId,
                email: eventData.email,
                fullName: eventData.fullName,
                activatedAt: eventData.activatedAt
            });
            // Create patient using repository - use fullName from event data
            const patient = await this.patientRepository.createFromUserEvent({
                userId: eventData.userId,
                email: eventData.email || '',
                fullName: eventData.fullName || (eventData.email ? eventData.email.split('@')[0] : `User-${eventData.userId.substring(0, 8)}`), // Use fullName from event, fallback to email
                phoneNumber: 'Chưa cập nhật', // Smart default
                address: 'Chưa cập nhật', // Smart default
                ward: 'Chưa cập nhật', // Smart default
                district: 'Chưa cập nhật', // Smart default
                city: 'Chưa cập nhật', // Smart default
                province: 'Chưa cập nhật', // Smart default
                dateOfBirth: new Date('2000-01-01'), // Smart default (Date object)
                gender: 'other', // Smart default
                citizenId: 'Chưa cập nhật' // Smart default
            });
            this.logger.info('Patient record created successfully from user activation', {
                userId: eventData.userId,
                patientId: patient.id,
                email: eventData.email,
                activatedAt: eventData.activatedAt
            });
        }
        catch (error) {
            this.logger.error('Error handling user.activated event', {
                userId: eventData.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.UserActivatedEventHandler = UserActivatedEventHandler;
//# sourceMappingURL=UserActivatedEventHandler.js.map