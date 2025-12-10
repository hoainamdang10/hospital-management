/**
 * TEST-ONLY Routes for Development & E2E Testing
 *  SECURITY: These endpoints MUST be disabled in production
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';

export function createTestRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps;

  //  TEMPORARILY DISABLED: Auto-verify email endpoint
  // TODO: Re-enable after adding pendingRegistrationRepository to RouteDependencies
  // or refactor to use VerifyEmailUseCase directly with token from request body
  /*
  router.post('/auto-verify-email', async (req, res) => {
    // Security check: Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is disabled in production'
      });
    }

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      logger.warn('TEST-ONLY: Auto-verifying email', { email });

      // Get pending registration
      const pendingRepo = deps.pendingRegistrationRepository;
      const pendingRegistration = await pendingRepo.findByEmail(email);

      if (!pendingRegistration) {
        return res.status(404).json({
          success: false,
          error: 'No pending registration found for this email'
        });
      }

      // Use the verification token to verify
      const result = await deps.verifyEmailUseCase.execute({
        token: pendingRegistration.verificationToken.value
      });

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Auto-verify email failed', { error });
      return res.status(500).json({
        success: false,
        error: 'Auto-verification failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  */

  logger.info('Test routes initialized (auto-verify-email temporarily disabled)');

  return router;
}