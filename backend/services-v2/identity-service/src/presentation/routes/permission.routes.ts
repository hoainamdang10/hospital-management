/**
 * Permission Routes
 * Handles permission checks and cache management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';
import { UserId } from '../../domain/value-objects/UserId';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createPermissionRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps;

  // Get user permissions (PROTECTED - self or admin)
  router.get('/:userId',
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ['permissions:read', '*'],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.params.userId
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userIdString = req.params.userId;
        const userId = UserId.fromString(userIdString);
        const permissions = await deps.permissionService.getEffectivePermissions(userId);

        res.json({
          success: true,
          data: {
            userId: userIdString,
            permissions,
            cached: true,
            cacheTTL: '5 minutes'
          }
        });
      } catch (error) {
        logger.error('Get permissions error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Failed to get permissions'
        });
      }
    }
  );

  // Check single permission (PUBLIC - for API Gateway)
  router.post('/check-permission', async (req, res) => {
    try {
      const result = await deps.checkPermissionUseCase.execute({
        userId: req.body.userId,
        permission: req.body.permission
      });
      res.json(result);
    } catch (error) {
      logger.error('Check permission error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        allowed: false,
        reason: 'Internal server error'
      });
    }
  });

  // Check multiple permissions (PUBLIC - for API Gateway)
  router.post('/check-permissions', async (req, res) => {
    try {
      const result = await deps.checkPermissionsUseCase.execute({
        userId: req.body.userId,
        permissions: req.body.permissions,
        requireAll: req.body.requireAll
      });
      res.json(result);
    } catch (error) {
      logger.error('Check permissions error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        allowed: false,
        reason: 'Internal server error'
      });
    }
  });

  // Check single role (PUBLIC - for API Gateway)
  router.post('/check-role', async (req, res) => {
    try {
      const result = await deps.checkRoleUseCase.execute({
        userId: req.body.userId,
        role: req.body.role
      });
      res.json(result);
    } catch (error) {
      logger.error('Check role error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        allowed: false,
        reason: 'Internal server error'
      });
    }
  });

  // Check multiple roles (PUBLIC - for API Gateway)
  router.post('/check-roles', async (req, res) => {
    try {
      const result = await deps.checkRolesUseCase.execute({
        userId: req.body.userId,
        roles: req.body.roles,
        requireAll: req.body.requireAll
      });
      res.json(result);
    } catch (error) {
      logger.error('Check roles error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        allowed: false,
        reason: 'Internal server error'
      });
    }
  });

  return router;
}

