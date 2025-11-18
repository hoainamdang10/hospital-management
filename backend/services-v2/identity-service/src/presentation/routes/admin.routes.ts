/**
 * Admin Routes
 * Handles admin-only operations: staff provisioning, cache invalidation, service recovery
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createAdminRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps;

  // All admin routes require authentication and admin role
  router.use(deps.authMiddleware.authenticate());
  router.use(deps.permissionMiddleware.requireAdmin());

  // Provision staff account (PROTECTED - admin only)
  router.post('/staff/register', async (req: AuthenticatedRequest, res) => {
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
    } catch (error) {
      logger.error('Provision staff endpoint error', { error: getErrorMessage(error) });
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
    } catch (error) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  // Invalidate user permission cache (PROTECTED - admin only)
  router.post('/permissions/invalidate/:userId', async (req, res) => {
    try {
      const userIdString = req.params.userId;
      const userId = UserId.fromString(userIdString);
      await deps.permissionService.invalidateCache(userId);
      res.json({
        success: true,
        message: `Permission cache invalidated for user ${userIdString}`
      });
    } catch (error) {
      logger.error('Invalidate cache error', { error: getErrorMessage(error) });
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
    } catch (error) {
      logger.error('Invalidate role cache error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to invalidate role cache'
      });
    }
  });

  // Unlock account (PROTECTED - admin only)
  router.post('/accounts/unlock', async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, reason } = req.body;
      const adminUserId = req.user?.userId || '';
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Reason is required'
        });
      }

      // Use UnlockAccountUseCase
      const result = await deps.unlockAccountUseCase.execute({
        userId,
        unlockedBy: adminUserId,
        reason
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      logger.info('Account unlocked successfully', { userId, adminUserId, reason });
      return res.json(result);
    } catch (error) {
      logger.error('Unlock account endpoint error', { userId: req.body.userId, error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  return router;
}

