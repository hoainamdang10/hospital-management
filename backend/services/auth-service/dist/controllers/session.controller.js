"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const session_service_1 = require("../services/session.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class SessionController {
    constructor() {
        this.getCurrentSession = async (req, res) => {
            try {
                const userId = req.user?.id;
                const authHeader = req.headers.authorization;
                const token = authHeader?.replace('Bearer ', '');
                if (!userId || !token) {
                    res.status(401).json({
                        success: false,
                        error: 'User not authenticated'
                    });
                    return;
                }
                const result = await this.sessionService.getCurrentSession(userId, token);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to get session info'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'Session info retrieved successfully',
                    session: result.session
                });
            }
            catch (error) {
                logger_1.default.error('Get current session error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to get session info'
                });
            }
        };
        this.getUserSessions = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'User not authenticated'
                    });
                    return;
                }
                const result = await this.sessionService.getUserSessions(userId);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to get user sessions'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'User sessions retrieved successfully',
                    sessions: result.sessions
                });
            }
            catch (error) {
                logger_1.default.error('Get user sessions error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to get user sessions'
                });
            }
        };
        this.revokeAllSessions = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'User not authenticated'
                    });
                    return;
                }
                const result = await this.sessionService.revokeAllUserSessions(userId);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to revoke sessions'
                    });
                    return;
                }
                logger_1.default.info('All sessions revoked for user', { userId });
                res.status(200).json({
                    success: true,
                    message: 'All sessions revoked successfully'
                });
            }
            catch (error) {
                logger_1.default.error('Revoke all sessions error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to revoke sessions'
                });
            }
        };
        this.getAllSessions = async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const userId = req.query.user_id;
                const result = await this.sessionService.getAllSessions({
                    page,
                    limit,
                    userId
                });
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to get all sessions'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: 'All sessions retrieved successfully',
                    sessions: result.sessions,
                    pagination: result.pagination
                });
            }
            catch (error) {
                logger_1.default.error('Get all sessions error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to get all sessions'
                });
            }
        };
        this.revokeUserSessions = async (req, res) => {
            try {
                const { userId } = req.params;
                const adminId = req.user?.id;
                const result = await this.sessionService.revokeAllUserSessions(userId);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: 'Failed to revoke user sessions'
                    });
                    return;
                }
                logger_1.default.info('User sessions revoked by admin', {
                    userId,
                    revokedBy: adminId
                });
                res.status(200).json({
                    success: true,
                    message: 'User sessions revoked successfully'
                });
            }
            catch (error) {
                logger_1.default.error('Revoke user sessions error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to revoke user sessions'
                });
            }
        };
        this.sessionService = new session_service_1.SessionService();
    }
}
exports.SessionController = SessionController;
//# sourceMappingURL=session.controller.js.map