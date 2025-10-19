"use strict";
/**
 * TerminateSessionUseCase
 * Use case for terminating a specific session
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminateSessionUseCase = void 0;
class TerminateSessionUseCase {
    constructor(sessionRepository, logger) {
        this.sessionRepository = sessionRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.userId) {
                throw new Error('User ID is required');
            }
            if (!request.sessionId) {
                throw new Error('Session ID is required');
            }
            // Find the session
            const session = await this.sessionRepository.findById(request.sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            // Verify that the session belongs to the user
            if (session.userId !== request.userId) {
                throw new Error('Unauthorized: Session does not belong to this user');
            }
            // Deactivate the session
            await this.sessionRepository.deactivate(request.sessionId);
            return {
                success: true,
                message: 'Session terminated successfully'
            };
        }
        catch (error) {
            this.logger.error('Error terminating session', {
                userId: request.userId,
                sessionId: request.sessionId,
                error: error.message
            });
            // Re-throw known errors
            if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
                throw error;
            }
            throw new Error(`Failed to terminate session: ${error.message}`);
        }
    }
}
exports.TerminateSessionUseCase = TerminateSessionUseCase;
//# sourceMappingURL=TerminateSessionUseCase.js.map