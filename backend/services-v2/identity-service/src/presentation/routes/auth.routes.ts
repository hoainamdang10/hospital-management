/**
 * Authentication Routes
 * Handles login, registration, password reset, MFA, and token management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { RouteDependencies } from './types';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function createAuthRoutes(deps: RouteDependencies): Router {
  const router = Router();
  const { logger } = deps; // Get logger from dependencies

  // Login endpoint (PUBLIC)
  router.post('/login', async (req, res) => {
    try {
      const request = {
        email: req.body.email,
        password: req.body.password,
        mfaCode: req.body.mfaCode,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        deviceInfo: {
          platform: req.body.platform,
          browser: req.body.browser,
          version: req.body.version
        }
      };

      const result = await deps.authenticateUserUseCase.execute(request);
      
      // Set HTTP-only session cookie for enhanced security
      if (result.success && result.accessToken) {
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        res.cookie('session_token', result.accessToken, {
          httpOnly: true,           // Cannot be accessed by JavaScript
          secure: false,            // Must be false for localhost (no HTTPS)
          sameSite: 'lax',          // CSRF protection (works with Next.js API proxy)
          maxAge: maxAge,
          path: '/'
        });

        logger.info('Session cookie set successfully', {
          userId: result.userId,
          expiresIn: '30 days'
        });
      }
      
      const statusCode = result.success ? 200 : 401;
      // Still return tokens in response for backward compatibility
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Authentication endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Patient Self-Registration endpoint (PUBLIC)
  // Security: Only allows patient registration, staff accounts must be created by admin
  router.post('/register', async (req, res) => {
    try {
      const request = {
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.fullName,
        roleType: 'PATIENT', // ✅ SECURITY: Force patient role, prevent privilege escalation
        phoneNumber: req.body.phoneNumber,
        citizenId: req.body.citizenId,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address
      };

      const result = await deps.registerUserUseCase.execute(request);
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Registration endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Forgot Password endpoint (PUBLIC)
  router.post('/forgot-password', async (req, res) => {
    try {
      const request = {
        email: req.body.email
      };

      const result = await deps.forgotPasswordUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Forgot password endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Reset Password endpoint (PUBLIC)
  router.post('/reset-password', async (req, res) => {
    try {
      const request = {
        accessToken: req.body.accessToken,
        refreshToken: req.body.refreshToken,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
      };

      const result = await deps.resetPasswordUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Reset password endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Verify Email endpoint - GET (PUBLIC)
  // Used when user clicks verification link in email
  router.get('/verify-email', async (req, res) => {
    try {
      // Get token from query parameter
      const token = req.query.token as string;

      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã xác thực không hợp lệ',
          error: 'INVALID_TOKEN'
        });
      }

      const request = {
        token: token.trim()
      };

      const result = await deps.verifyEmailUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Verify email GET endpoint error', { error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Verify Email endpoint - POST (PUBLIC)
  // Used for programmatic verification with email + token
  router.post('/verify-email', async (req, res) => {
    try {
      // Validate email first (before token validation)
      const email = req.body.email;
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        });
      }

      // Validate token
      const token = req.body.token;
      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Mã xác thực không hợp lệ',
          error: 'INVALID_TOKEN'
        });
      }

      const request = {
        token: token.trim()
      };

      const result = await deps.verifyEmailUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Verify email POST endpoint error', { error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Resend Verification Email endpoint (PUBLIC)
  router.post('/resend-verification', async (req, res) => {
    try {
      const email = req.body.email;

      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        });
      }

      const request = {
        email: email.trim()
      };

      const result = await deps.resendVerificationEmailUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Resend verification email endpoint error', { error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Validate Staff Invitation Token endpoint (PUBLIC)
  // Frontend calls this to check if token is valid before showing activation form
  router.get('/validate-invitation', async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return res.status(400).json({
          success: false,
          isValid: false,
          error: 'Token không hợp lệ',
          errorCode: 'MISSING_TOKEN'
        });
      }

      const request = {
        invitationToken: token
      };

      const result = await deps.validateStaffInvitationUseCase.execute(request);
      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Validate staff invitation endpoint error', { error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        isValid: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau',
        errorCode: 'SYSTEM_ERROR'
      });
    }
  });

  // Accept Staff Invitation endpoint (PUBLIC)
  // Staff clicks link from invitation email and sets password
  router.post('/activate-staff', async (req, res) => {
    try {
      const request = {
        invitationToken: req.body.invitationToken,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        fullName: req.body.fullName,
        phoneNumber: req.body.phoneNumber
      };

      const result = await deps.acceptStaffInvitationUseCase.execute(request);
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Accept staff invitation endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Logout endpoint (PROTECTED)
  router.post('/logout',
    deps.authMiddleware.authenticate(),
    async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

      const request = {
        userId: req.user.userId,
        accessToken,
        sessionId: typeof req.body.sessionId === 'string' ? req.body.sessionId : undefined
      };

      const result = await deps.logoutUserUseCase.execute(request);
      
      // Clear session cookie
      res.clearCookie('session_token', {
        httpOnly: true,
        path: '/'
      });
      
      logger.info('Session cookie cleared successfully', {
        userId: req.user.userId
      });
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Logout endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Get current user from session (PROTECTED)
  router.get('/me',
    deps.authMiddleware.authenticate(),
    async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Return user info from authenticated session
      logger.info('Get current user', {
        userId: req.user.userId,
        email: req.user.email
      });

      return res.status(200).json({
        success: true,
        user: {
          id: req.user.userId,
          userId: req.user.userId,
          email: req.user.email,
          username: req.user.email?.split('@')[0] || 'user',
          fullName: req.user.fullName || req.user.email?.split('@')[0] || 'User',
          role: req.user.roles?.[0]?.toUpperCase() || 'PATIENT',
          roles: req.user.roles || ['patient'],
          permissions: req.user.permissions || [],
          isActive: true,
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Get current user endpoint error', { error: getErrorMessage(error) });
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Token Refresh endpoint (PUBLIC)
  router.post('/refresh', async (req, res) => {
    try {
      const request = {
        refreshToken: req.body.refreshToken,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const result = await deps.refreshTokenUseCase.execute(request);
      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Refresh token endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Enable MFA endpoint (PROTECTED - User can only enable MFA for themselves)
  router.post('/mfa/enable',
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ['mfa:manage', '*'],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.body.userId
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const request = {
          userId: req.body.userId,
          method: req.body.method,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email
        };

        const result = await deps.enableMFAUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Enable MFA endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    }
  );

  // Verify MFA endpoint (PUBLIC)
  router.post('/mfa/verify', async (req, res) => {
    try {
      const request = {
        userId: req.body.userId,
        code: req.body.code,
        attemptType: req.body.attemptType || 'login',
        method: req.body.method || '2fa_app',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const result = await deps.verifyMFAUseCase.execute(request);
      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error('Verify MFA endpoint error', { error: getErrorMessage(error) });
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống, vui lòng thử lại sau'
      });
    }
  });

  // Disable MFA endpoint (PROTECTED - User can only disable MFA for themselves)
  router.post('/mfa/disable',
    deps.authMiddleware.authenticate(),
    deps.permissionMiddleware.requirePermission({
      permissions: ['mfa:manage', '*'],
      checkOwnership: true,
      getResourceOwnerId: (req: AuthenticatedRequest) => req.body.userId
    }),
    async (req: AuthenticatedRequest, res) => {
      try {
        const request = {
          userId: req.body.userId,
          verificationCode: req.body.verificationCode
        };

        const result = await deps.disableMFAUseCase.execute(request);
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(result);
      } catch (error) {
        logger.error('Disable MFA endpoint error', { error: getErrorMessage(error) });
        res.status(500).json({
          success: false,
          error: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
      }
    }
  );

  return router;
}

