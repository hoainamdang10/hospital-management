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
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createSessionRoutes(deps) {
    const router = (0, express_1.Router)();
    const { logger } = deps;
    // List active sessions for current user (PROTECTED)
    router.get('/:userId/sessions', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['sessions:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            // Extract session ID from JWT or find current session from database
            let currentSessionId = req.user.sessionId;
            console.log('[LIST_SESSIONS] Initial sessionId from JWT', {
                userId: req.params.userId,
                sessionId: currentSessionId,
                hasSessionId: !!currentSessionId
            });
            // If sessionId not in JWT, try to find it from the access token
            if (!currentSessionId) {
                const authHeader = req.headers.authorization;
                console.log('[LIST_SESSIONS] Attempting token lookup', {
                    userId: req.params.userId,
                    hasAuthHeader: !!authHeader,
                    authHeaderPrefix: authHeader?.substring(0, 10)
                });
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    console.log('[LIST_SESSIONS] Calling findByToken', {
                        userId: req.params.userId,
                        tokenLength: token.length,
                        tokenPrefix: token.substring(0, 20)
                    });
                    // Try to find session by token
                    try {
                        const session = await deps.sessionRepository.findByToken(token);
                        console.log('[LIST_SESSIONS] findByToken result', {
                            userId: req.params.userId,
                            foundSession: !!session,
                            sessionId: session?.id
                        });
                        if (session) {
                            currentSessionId = session.id;
                            console.log('[LIST_SESSIONS] Found session ID from token lookup', {
                                userId: req.params.userId,
                                sessionId: currentSessionId
                            });
                        }
                        else {
                            console.log('[LIST_SESSIONS] findByToken returned null', {
                                userId: req.params.userId,
                                tokenLength: token.length
                            });
                        }
                    }
                    catch (error) {
                        console.error('[LIST_SESSIONS] Failed to find session by token', {
                            userId: req.params.userId,
                            error: getErrorMessage(error)
                        });
                    }
                }
            }
            console.log('[LIST_SESSIONS] Final sessionId before use case', {
                userId: req.params.userId,
                currentSessionId,
                hasCurrentSessionId: !!currentSessionId
            });
            const result = await deps.listActiveSessionsUseCase.execute({
                userId: req.params.userId,
                currentSessionId
            });
            res.json(result);
        }
        catch (error) {
            logger.error('List active sessions error', { error: getErrorMessage(error) });
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
            logger.error('Terminate session error', { error: getErrorMessage(error) });
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
            // Extract session ID from JWT or find current session from database
            let currentSessionId = req.user.sessionId;
            console.log('[TERMINATE_ALL] Initial sessionId from JWT', {
                userId: req.params.userId,
                sessionId: currentSessionId,
                hasSessionId: !!currentSessionId
            });
            // If sessionId not in JWT, try to find it from the access token
            if (!currentSessionId) {
                const authHeader = req.headers.authorization;
                console.log('[TERMINATE_ALL] Attempting token lookup', {
                    userId: req.params.userId,
                    hasAuthHeader: !!authHeader,
                    authHeaderPrefix: authHeader?.substring(0, 10)
                });
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    console.log('[TERMINATE_ALL] Calling findByToken', {
                        userId: req.params.userId,
                        tokenLength: token.length,
                        tokenPrefix: token.substring(0, 20)
                    });
                    // Try to find session by token
                    try {
                        const session = await deps.sessionRepository.findByToken(token);
                        console.log('[TERMINATE_ALL] findByToken result', {
                            userId: req.params.userId,
                            foundSession: !!session,
                            sessionId: session?.id
                        });
                        if (session) {
                            currentSessionId = session.id;
                            console.log('[TERMINATE_ALL] Found session ID from token lookup', {
                                userId: req.params.userId,
                                sessionId: currentSessionId
                            });
                        }
                        else {
                            console.log('[TERMINATE_ALL] findByToken returned null', {
                                userId: req.params.userId,
                                tokenLength: token.length
                            });
                        }
                    }
                    catch (error) {
                        console.error('[TERMINATE_ALL] Failed to find session by token', {
                            userId: req.params.userId,
                            error: getErrorMessage(error)
                        });
                    }
                }
            }
            console.log('[TERMINATE_ALL] Final sessionId before use case', {
                userId: req.params.userId,
                currentSessionId,
                hasCurrentSessionId: !!currentSessionId
            });
            const result = await deps.terminateAllSessionsUseCase.execute({
                userId: req.params.userId,
                currentSessionId
            });
            res.json(result);
        }
        catch (error) {
            logger.error('Terminate all sessions error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to terminate all sessions'
            });
        }
    });
    return router;
}
//# sourceMappingURL=session.routes.js.map