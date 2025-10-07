/**
 * RefreshTokenUseCase
 * Refreshes access token using refresh token
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IAuthenticationService } from '../services/IAuthenticationService';
import { ILogger } from '../services/ILogger';

export interface RefreshTokenRequest {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  error?: string;
  errorCode?: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly authService: IAuthenticationService,
    private readonly logger: ILogger
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      this.logger.info('Refreshing access token', {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      // Validate refresh token
      if (!request.refreshToken || request.refreshToken.trim().length === 0) {
        this.logger.warn('Refresh token missing');
        return {
          success: false,
          error: 'Refresh token is required',
          errorCode: 'REFRESH_TOKEN_REQUIRED'
        };
      }

      // Call Supabase Auth Service to refresh session
      const result = await this.authService.refreshSession(request.refreshToken);

      // AuthResult has: accessToken, refreshToken, expiresIn, user (not session)
      if (!result.success || !result.accessToken) {
        this.logger.warn('Token refresh failed', {
          error: result.error
        });
        return {
          success: false,
          error: result.error || 'Failed to refresh token',
          errorCode: 'REFRESH_TOKEN_INVALID'
        };
      }

      // Extract data from AuthResult
      const { accessToken, refreshToken, expiresIn, user } = result;

      this.logger.info('Token refreshed successfully', {
        userId: user?.id,
        email: user?.email
      });

      // Get role from user.role (not user_metadata)
      const userRole = user?.role || 'PATIENT';

      return {
        success: true,
        accessToken,
        refreshToken: refreshToken || request.refreshToken, // Use new token if provided, else keep old
        expiresIn,
        user: user ? {
          userId: user.id,
          email: user.email,
          role: userRole
        } : undefined
      };
    } catch (error) {
      this.logger.error('Refresh token use case error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: 'An unexpected error occurred while refreshing token',
        errorCode: 'REFRESH_TOKEN_ERROR'
      };
    }
  }
}

