/**
 * Account Recovery Routes
 * Handles password reset, recovery methods, and recovery history
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';
import { logger } from '../../infrastructure/logging/Logger';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createAccountRecoveryRoutes(deps: RouteDependencies): Router {
  const router = Router();

  // Get recovery methods (PROTECTED)
  router.get('/methods',
    deps.authMiddleware.authenticate(),
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await deps.getRecoveryMethodsUseCase.execute({
          userId: req.user!.userId
        });

        res.json(result);
      } catch (error) {
        logger.error('Get recovery methods error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Failed to get recovery methods'
        });
      }
    }
  );

  // Update recovery methods (PROTECTED)
  router.put('/methods',
    deps.authMiddleware.authenticate(),
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await deps.updateRecoveryMethodsUseCase.execute({
          userId: req.user!.userId,
          recoveryEmail: req.body.recoveryEmail
        });

        res.json(result);
      } catch (error) {
        logger.error('Update recovery methods error', { error: getErrorMessage(error) });
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update recovery methods'
        });
      }
    }
  );

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
    } catch (error) {
      logger.error('Request password reset error', { error: getErrorMessage(error) });
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
    } catch (error) {
      logger.error('Verify reset token error', { error: getErrorMessage(error) });
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
    } catch (error) {
      logger.error('Reset password with token error', { error: getErrorMessage(error) });
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      });
    }
  });

  // Get recovery history (PROTECTED)
  router.get('/history',
    deps.authMiddleware.authenticate(),
    async (req: AuthenticatedRequest, res) => {
      try {
        const result = await deps.getRecoveryHistoryUseCase.execute({
          userId: req.user!.userId,
          page: req.query.page ? parseInt(req.query.page as string) : undefined,
          pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
          startDate: req.query.startDate as string,
          endDate: req.query.endDate as string
        });

        res.json(result);
      } catch (error) {
        logger.error('Get recovery history error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Failed to get recovery history'
        });
      }
    }
  );

  return router;
}

