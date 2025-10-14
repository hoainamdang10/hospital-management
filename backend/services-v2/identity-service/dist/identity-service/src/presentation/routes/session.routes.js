"use strict";
/**
 * Session Management Routes
 * Handles listing, terminating sessions
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionRoutes = createSessionRoutes;
const express_1 = require("express");
const Logger_1 = require("../../infrastructure/logging/Logger");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createSessionRoutes(deps) {
    const router = (0, express_1.Router)();
    // List active sessions for current user (PROTECTED)
    router.get('/:userId/sessions', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['sessions:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            const result = await deps.listActiveSessionsUseCase.execute({
                userId: req.params.userId,
                currentSessionId: req.user.sessionId
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('List active sessions error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to list active sessions'
            });
        }
    });
    // Terminate a specific session (PROTECTED)
    router.delete('/:userId/sessions/:sessionId', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['sessions:delete', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            const result = await deps.terminateSessionUseCase.execute({
                userId: req.params.userId,
                sessionId: req.params.sessionId
            });
            return res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Terminate session error', { error: getErrorMessage(error) });
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }
                if (error.message.includes('Unauthorized')) {
                    return res.status(403).json({
                        success: false,
                        error: 'Unauthorized to terminate this session'
                    });
                }
            }
            return res.status(500).json({
                success: false,
                error: 'Failed to terminate session'
            });
        }
    });
    // Terminate all sessions except current (PROTECTED)
    router.delete('/:userId/sessions', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['sessions:delete', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            const result = await deps.terminateAllSessionsUseCase.execute({
                userId: req.params.userId,
                currentSessionId: req.user.sessionId
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Terminate all sessions error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to terminate all sessions'
            });
        }
    });
    return router;
}
//# sourceMappingURL=session.routes.js.map