"use strict";
/**
 * Account Recovery Routes
 * Handles password reset, recovery methods, and recovery history
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccountRecoveryRoutes = createAccountRecoveryRoutes;
const express_1 = require("express");
const Logger_1 = require("../../infrastructure/logging/Logger");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createAccountRecoveryRoutes(deps) {
    const router = (0, express_1.Router)();
    // Get recovery methods (PROTECTED)
    router.get('/methods', deps.authMiddleware.authenticate(), async (req, res) => {
        try {
            const result = await deps.getRecoveryMethodsUseCase.execute({
                userId: req.user.userId
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Get recovery methods error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to get recovery methods'
            });
        }
    });
    // Update recovery methods (PROTECTED)
    router.put('/methods', deps.authMiddleware.authenticate(), async (req, res) => {
        try {
            const result = await deps.updateRecoveryMethodsUseCase.execute({
                userId: req.user.userId,
                recoveryEmail: req.body.recoveryEmail
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Update recovery methods error', { error: getErrorMessage(error) });
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update recovery methods'
            });
        }
    });
    // Request password reset (PUBLIC)
    router.post('/request-reset', async (req, res) => {
        try {
            const result = await deps.requestPasswordResetUseCase.execute({
                email: req.body.email,
                method: req.body.method,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Request password reset error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to request password reset'
            });
        }
    });
    // Verify reset token (PUBLIC)
    router.post('/verify-token', async (req, res) => {
        try {
            const result = await deps.verifyResetTokenUseCase.execute({
                token: req.body.token,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Verify reset token error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to verify reset token'
            });
        }
    });
    // Reset password with token (PUBLIC)
    router.post('/reset-password', async (req, res) => {
        try {
            const result = await deps.resetPasswordWithTokenUseCase.execute({
                token: req.body.token,
                newPassword: req.body.newPassword,
                confirmPassword: req.body.confirmPassword,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Reset password with token error', { error: getErrorMessage(error) });
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reset password'
            });
        }
    });
    // Get recovery history (PROTECTED)
    router.get('/history', deps.authMiddleware.authenticate(), async (req, res) => {
        try {
            const result = await deps.getRecoveryHistoryUseCase.execute({
                userId: req.user.userId,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : undefined,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Get recovery history error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to get recovery history'
            });
        }
    });
    return router;
}
//# sourceMappingURL=account-recovery.routes.js.map