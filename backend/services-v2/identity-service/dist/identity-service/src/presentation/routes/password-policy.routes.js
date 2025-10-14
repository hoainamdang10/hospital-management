"use strict";
/**
 * Password Policy Routes
 * Handles password policy management and validation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPasswordPolicyRoutes = createPasswordPolicyRoutes;
const express_1 = require("express");
const Logger_1 = require("../../infrastructure/logging/Logger");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createPasswordPolicyRoutes(deps) {
    const router = (0, express_1.Router)();
    // Get current password policy (PUBLIC)
    router.get('/', async (_req, res) => {
        try {
            const result = await deps.getPasswordPolicyUseCase.execute();
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Get password policy error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to get password policy'
            });
        }
    });
    // Update password policy (PROTECTED - admin only)
    router.put('/', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.updatePasswordPolicyUseCase.execute({
                minLength: req.body.minLength,
                requireUppercase: req.body.requireUppercase,
                requireLowercase: req.body.requireLowercase,
                requireNumbers: req.body.requireNumbers,
                requireSpecialChars: req.body.requireSpecialChars,
                expirationDays: req.body.expirationDays,
                preventReuse: req.body.preventReuse,
                updatedBy: req.user.userId
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Update password policy error', { error: getErrorMessage(error) });
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update password policy'
            });
        }
    });
    // Validate password against current policy (PUBLIC)
    router.post('/validate', async (req, res) => {
        try {
            const result = await deps.validatePasswordUseCase.execute({
                password: req.body.password
            });
            res.json(result);
        }
        catch (error) {
            Logger_1.logger.error('Validate password error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to validate password'
            });
        }
    });
    return router;
}
//# sourceMappingURL=password-policy.routes.js.map