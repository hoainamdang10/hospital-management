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
const UserId_1 = require("../../domain/value-objects/UserId");
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
function createAdminRoutes(deps) {
    const router = (0, express_1.Router)();
    const { logger } = deps;
    // All admin routes require authentication and admin role
    router.use(deps.authMiddleware.authenticate());
    router.use(deps.permissionMiddleware.requireAdmin());
    // Provision staff account (PROTECTED - admin only)
    router.post("/staff/register", async (req, res) => {
        try {
            const request = {
                email: req.body.email,
                fullName: req.body.fullName,
                roleType: req.body.roleType,
                phoneNumber: req.body.phoneNumber,
                departmentCode: req.body.departmentCode || req.body.department,
                specializationCode: req.body.specializationCode || req.body.specialization,
                specialization: req.body.specialization,
                specializationName: req.body.specializationName,
                title: req.body.title,
                position: req.body.position,
                licenseNumber: req.body.licenseNumber,
                yearsOfExperience: req.body.yearsOfExperience,
                education: req.body.education,
                employmentType: req.body.employmentType,
                workSchedule: req.body.workSchedule,
                requesterId: req.user?.userId || "",
            };
            const result = await deps.provisionStaffUseCase.execute(request);
            const statusCode = result.success ? 201 : 400;
            res.status(statusCode).json(result);
        }
        catch (error) {
            logger.error("Provision staff endpoint error", {
                error: getErrorMessage(error),
            });
            res.status(500).json({
                success: false,
                error: "Lỗi hệ thống, vui lòng thử lại sau",
            });
        }
    });
    // Graceful degradation control (PROTECTED - admin only)
    router.post("/recovery", (_req, res) => {
        try {
            deps.degradationService.forceRecovery();
            res.json({ success: true, message: "Service recovery initiated" });
        }
        catch (error) {
            res.status(500).json({ error: getErrorMessage(error) });
        }
    });
    // Invalidate user permission cache (PROTECTED - admin only)
    router.post("/permissions/invalidate/:userId", async (req, res) => {
        try {
            const userIdString = req.params.userId;
            const userId = UserId_1.UserId.fromString(userIdString);
            await deps.permissionService.invalidateCache(userId);
            res.json({
                success: true,
                message: `Permission cache invalidated for user ${userIdString}`,
            });
        }
        catch (error) {
            logger.error("Invalidate cache error", { error: getErrorMessage(error) });
            res.status(500).json({
                success: false,
                error: "Failed to invalidate cache",
            });
        }
    });
    // Invalidate permission cache for all users with a role (PROTECTED - admin only)
    router.post("/permissions/invalidate-role/:roleType", async (req, res) => {
        try {
            const roleType = req.params.roleType;
            await deps.permissionService.invalidateCacheForRole(roleType);
            res.json({
                success: true,
                message: `Permission cache invalidated for all users with role ${roleType}`,
            });
        }
        catch (error) {
            logger.error("Invalidate role cache error", {
                error: getErrorMessage(error),
            });
            res.status(500).json({
                success: false,
                error: "Failed to invalidate role cache",
            });
        }
    });
    // Unlock account (PROTECTED - admin only)
    router.post("/accounts/unlock", async (req, res) => {
        try {
            const { userId, reason } = req.body;
            const adminUserId = req.user?.userId || "";
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                });
            }
            if (!reason) {
                return res.status(400).json({
                    success: false,
                    error: "Reason is required",
                });
            }
            // Use UnlockAccountUseCase
            const result = await deps.unlockAccountUseCase.execute({
                userId,
                unlockedBy: adminUserId,
                reason,
            });
            if (!result.success) {
                return res.status(400).json(result);
            }
            logger.info("Account unlocked successfully", {
                userId,
                adminUserId,
                reason,
            });
            return res.json(result);
        }
        catch (error) {
            logger.error("Unlock account endpoint error", {
                userId: req.body.userId,
                error: getErrorMessage(error),
            });
            return res.status(500).json({
                success: false,
                error: "Lỗi hệ thống, vui lòng thử lại sau",
            });
        }
    });
    return router;
}
//# sourceMappingURL=admin.routes.js.map