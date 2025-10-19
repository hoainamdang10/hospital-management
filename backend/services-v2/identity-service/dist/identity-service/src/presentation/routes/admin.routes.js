"use strict";
/**
 * Admin Routes
 * Handles admin-only operations: staff provisioning, cache invalidation, service recovery
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRoutes = createAdminRoutes;
const express_1 = require("express");
const Logger_1 = require("../../infrastructure/logging/Logger");
const UserId_1 = require("../../domain/value-objects/UserId");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createAdminRoutes(deps) {
    const router = (0, express_1.Router)();
    // All admin routes require authentication and admin role
    router.use(deps.authMiddleware.authenticate());
    router.use(deps.permissionMiddleware.requireAdmin());
    // Provision staff account (PROTECTED - admin only)
    router.post('/staff/register', async (req, res) => {
        try {
            const request = {
                email: req.body.email,
                fullName: req.body.fullName,
                roleType: req.body.roleType,
                phoneNumber: req.body.phoneNumber,
                requesterId: req.user?.userId || ''
            };
            const result = await deps.provisionStaffUseCase.execute(request);
            const statusCode = result.success ? 201 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            Logger_1.logger.error('Provision staff endpoint error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        }
    });
    // List staff invitations (PROTECTED - admin only)
    router.get('/staff/invitations', async (req, res) => {
        try {
            const request = {
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                status: req.query.status,
                role: req.query.role,
                email: req.query.email,
                requesterId: req.user?.userId || ''
            };
            const result = await deps.listStaffInvitationsUseCase.execute(request);
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            Logger_1.logger.error('List staff invitations endpoint error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        }
    });
    // Get staff invitation by ID (PROTECTED - admin only)
    router.get('/staff/invitations/:id', async (req, res) => {
        try {
            const request = {
                invitationId: req.params.id,
                requesterId: req.user?.userId || ''
            };
            const result = await deps.getStaffInvitationUseCase.execute(request);
            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);
        }
        catch (error) {
            Logger_1.logger.error('Get staff invitation endpoint error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        }
    });
    // Cancel staff invitation (PROTECTED - admin only)
    router.delete('/staff/invitations/:id', async (req, res) => {
        try {
            const request = {
                invitationId: req.params.id,
                requesterId: req.user?.userId || '',
                reason: req.body.reason
            };
            const result = await deps.cancelStaffInvitationUseCase.execute(request);
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            Logger_1.logger.error('Cancel staff invitation endpoint error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        }
    });
    // Resend staff invitation (PROTECTED - admin only)
    router.post('/staff/invitations/:id/resend', async (req, res) => {
        try {
            const request = {
                invitationId: req.params.id,
                requesterId: req.user?.userId || ''
            };
            const result = await deps.resendStaffInvitationUseCase.execute(request);
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            Logger_1.logger.error('Resend staff invitation endpoint error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Lỗi hệ thống, vui lòng thử lại sau'
            });
        }
    });
    // Graceful degradation control (PROTECTED - admin only)
    router.post('/recovery', (_req, res) => {
        try {
            deps.degradationService.forceRecovery();
            res.json({ success: true, message: 'Service recovery initiated' });
        }
        catch (error) {
            res.status(500).json({ error: getErrorMessage(error) });
        }
    });
    // Invalidate user permission cache (PROTECTED - admin only)
    router.post('/permissions/invalidate/:userId', async (req, res) => {
        try {
            const userIdString = req.params.userId;
            const userId = UserId_1.UserId.fromString(userIdString);
            await deps.permissionService.invalidateCache(userId);
            res.json({
                success: true,
                message: `Permission cache invalidated for user ${userIdString}`
            });
        }
        catch (error) {
            Logger_1.logger.error('Invalidate cache error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to invalidate cache'
            });
        }
    });
    // Invalidate permission cache for all users with a role (PROTECTED - admin only)
    router.post('/permissions/invalidate-role/:roleType', async (req, res) => {
        try {
            const roleType = req.params.roleType;
            await deps.permissionService.invalidateCacheForRole(roleType);
            res.json({
                success: true,
                message: `Permission cache invalidated for all users with role ${roleType}`
            });
        }
        catch (error) {
            Logger_1.logger.error('Invalidate role cache error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to invalidate role cache'
            });
        }
    });
    return router;
}
//# sourceMappingURL=admin.routes.js.map