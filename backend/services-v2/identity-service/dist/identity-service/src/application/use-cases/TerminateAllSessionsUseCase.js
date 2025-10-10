"use strict";
/**
 * TerminateAllSessionsUseCase
 * Use case for terminating all sessions except the current one
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminateAllSessionsUseCase = void 0;
class TerminateAllSessionsUseCase {
    constructor(sessionRepository) {
        this.sessionRepository = sessionRepository;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.userId) {
                throw new Error('User ID is required');
            }
            let terminatedCount;
            if (request.currentSessionId) {
                // Terminate all sessions except the current one
                terminatedCount = await this.sessionRepository.deactivateAllExcept(request.userId, request.currentSessionId);
            }
            else {
                // Terminate all sessions
                terminatedCount = await this.sessionRepository.deleteAllByUserId(request.userId);
            }
            return {
                success: true,
                message: `Successfully terminated ${terminatedCount} session(s)`,
                terminatedCount
            };
        }
        catch (error) {
            console.error('Error terminating all sessions:', error);
            throw new Error(`Failed to terminate all sessions: ${error.message}`);
        }
    }
}
exports.TerminateAllSessionsUseCase = TerminateAllSessionsUseCase;
//# sourceMappingURL=TerminateAllSessionsUseCase.js.map