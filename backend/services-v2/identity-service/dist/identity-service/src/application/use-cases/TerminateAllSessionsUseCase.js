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
    constructor(sessionRepository, logger) {
        this.sessionRepository = sessionRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.userId) {
                throw new Error("User ID is required");
            }
            let resolvedCurrentSessionId = request.currentSessionId;
            if (!resolvedCurrentSessionId && request.accessToken) {
                const session = await this.sessionRepository.findByToken(request.accessToken);
                if (session && session.userId === request.userId) {
                    resolvedCurrentSessionId = session.id;
                }
                else {
                    this.logger.warn("Unable to resolve current session when terminating all sessions", {
                        userId: request.userId,
                        reason: session ? "token_user_mismatch" : "session_not_found",
                    });
                }
            }
            if (!resolvedCurrentSessionId) {
                // Safety check: do not terminate all sessions if we cannot identify current session
                this.logger.warn("Attempted to terminate all sessions without resolvable currentSessionId", {
                    userId: request.userId,
                });
                throw new Error("Cannot terminate all sessions: current session ID not resolved. " +
                    "This is a safety measure to prevent accidental deletion of all sessions.");
            }
            // Terminate all sessions except the current one
            this.logger.info("Terminating all sessions except current", {
                userId: request.userId,
                currentSessionId: resolvedCurrentSessionId,
            });
            const terminatedCount = await this.sessionRepository.deactivateAllExcept(request.userId, resolvedCurrentSessionId);
            this.logger.info("Sessions terminated successfully", {
                userId: request.userId,
                terminatedCount,
            });
            return {
                success: true,
                message: `Successfully terminated ${terminatedCount} session(s)`,
                terminatedCount,
            };
        }
        catch (error) {
            this.logger.error("Error terminating all sessions", {
                userId: request.userId,
                currentSessionId: request.currentSessionId,
                error: error.message,
            });
            throw new Error(`Failed to terminate all sessions: ${error.message}`);
        }
    }
}
exports.TerminateAllSessionsUseCase = TerminateAllSessionsUseCase;
//# sourceMappingURL=TerminateAllSessionsUseCase.js.map