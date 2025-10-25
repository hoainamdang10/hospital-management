"use strict";
/**
 * User Management Routes
 * Handles user CRUD operations, password changes, account locking, and role assignment
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRoutes = createUserRoutes;
const express_1 = require("express");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createUserRoutes(deps) {
    const router = (0, express_1.Router)();
    const { logger } = deps;
    // Get current user profile (PROTECTED)
    router.get('/me', deps.authMiddleware.authenticate(), async (req, res) => {
        try {
            res.json({
                success: true,
                user: req.user
            });
        }
        catch (error) {
            logger.error('Get user profile error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to get user profile'
            });
        }
    });
    // Get user by ID (PROTECTED - admin or self only)
    router.get('/:userId', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['users:read', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            const result = await deps.getUserUseCase.execute({
                userId: req.params.userId,
                requesterId: req.user.userId
            });
            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Get user error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to get user'
            });
        }
    });
    // List all users (PROTECTED - admin only)
    router.get('/', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.listUsersUseCase.execute({
                requesterId: req.user.userId,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                roleType: req.query.roleType,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                searchTerm: req.query.search
            });
            res.json(result);
        }
        catch (error) {
            logger.error('List users error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to list users'
            });
        }
    });
    // Update user (PROTECTED - admin or self only)
    router.patch('/:userId', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requirePermission({
        permissions: ['users:update', '*'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params.userId
    }), async (req, res) => {
        try {
            const result = await deps.updateUserUseCase.execute({
                userId: req.params.userId,
                requesterId: req.user.userId,
                updates: req.body
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Update user error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to update user'
            });
        }
    });
    // Delete user (PROTECTED - admin only)
    router.delete('/:userId', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.deleteUserUseCase.execute({
                userId: req.params.userId,
                requesterId: req.user.userId,
                hardDelete: req.query.hard === 'true',
                reason: req.body.reason
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Delete user error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Failed to delete user'
            });
        }
    });
    // Change password (PROTECTED - self or admin)
    router.post('/:userId/change-password', deps.authMiddleware.authenticate(), async (req, res, next) => {
        try {
            if (req.user && req.user.userId === req.params.userId) {
                return next();
            }
            const middleware = deps.permissionMiddleware.requirePermission({
                permissions: ['users:update', '*']
            });
            return middleware(req, res, next);
        }
        catch (error) {
            logger.error('Change password authorization error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Xác thực quyền thất bại'
            });
        }
    }, async (req, res) => {
        try {
            const result = await deps.changePasswordUseCase.execute({
                userId: req.params.userId,
                currentPassword: req.body.currentPassword,
                newPassword: req.body.newPassword,
                confirmPassword: req.body.confirmPassword
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Change password error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Đổi mật khẩu thất bại'
            });
        }
    });
    // Lock account (PROTECTED - admin only)
    router.post('/:userId/lock', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.lockAccountUseCase.execute({
                userId: req.params.userId,
                lockedBy: req.user.userId,
                reason: req.body.reason || 'Locked by administrator',
                terminateSessions: req.body.terminateSessions !== false
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Lock account error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Khóa tài khoản thất bại'
            });
        }
    });
    // Unlock account (PROTECTED - admin only)
    router.post('/:userId/unlock', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.unlockAccountUseCase.execute({
                userId: req.params.userId,
                unlockedBy: req.user.userId,
                reason: req.body.reason || 'Unlocked by administrator'
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Unlock account error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Mở khóa tài khoản thất bại'
            });
        }
    });
    // Assign role (PROTECTED - admin only)
    router.post('/:userId/assign-role', deps.authMiddleware.authenticate(), deps.permissionMiddleware.requireAdmin(), async (req, res) => {
        try {
            const result = await deps.assignRoleUseCase.execute({
                userId: req.params.userId,
                roleType: req.body.roleType,
                assignedBy: req.user.userId,
                reason: req.body.reason || 'Role assigned by administrator'
            });
            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error('Assign role error', { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: 'Gán vai trò thất bại'
            });
        }
    });
    return router;
}
//# sourceMappingURL=user.routes.js.map