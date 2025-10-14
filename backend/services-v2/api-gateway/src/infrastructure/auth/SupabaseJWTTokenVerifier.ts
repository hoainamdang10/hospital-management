/**
 * Supabase JWT Token Verifier
 * Validates JWT tokens issued by Supabase Auth
 * 
 * IMPORTANT: This is the ONLY place where JWT validation happens in API Gateway
 * Downstream services trust the headers set by this gateway
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ITokenVerifier, TokenVerificationResult } from '@domain/services/ITokenVerifier';
import { JWTToken } from '@domain/value-objects/JWTToken';
import { AuthenticatedUser } from '@domain/entities/AuthenticatedUser';
import { UserId } from '@domain/value-objects/UserId';
import { ILogger } from '@application/services/ILogger';

export interface SupabaseJWTTokenVerifierConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  jwtSecret: string;
}

export class SupabaseJWTTokenVerifier implements ITokenVerifier {
  private supabaseClient: SupabaseClient;

  constructor(
    private config: SupabaseJWTTokenVerifierConfig,
    private logger: ILogger
  ) {
    this.supabaseClient = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.supabaseUrl) {
      throw new Error('SUPABASE_URL is required for JWT verification');
    }

    if (!this.config.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for JWT verification');
    }

    if (!this.config.jwtSecret) {
      throw new Error('JWT_SECRET is required for JWT verification');
    }

    if (process.env.SUPABASE_JWT_SECRET && this.config.jwtSecret !== process.env.SUPABASE_JWT_SECRET) {
      this.logger.warn('JWT_SECRET does not match SUPABASE_JWT_SECRET', {
        jwtSecretLength: this.config.jwtSecret.length,
        supabaseJwtSecretLength: process.env.SUPABASE_JWT_SECRET.length
      });
    }
  }

  async verify(token: JWTToken): Promise<TokenVerificationResult> {
    try {
      const { data: { user }, error } = await this.supabaseClient.auth.getUser(token.value);

      if (error || !user) {
        this.logger.warn('JWT validation failed', {
          error: error?.message,
          hasUser: !!user
        });

        return {
          success: false,
          error: error?.message || 'Invalid or expired token'
        };
      }

      const userId = UserId.create(user.id);
      const email = user.email;

      if (!email) {
        this.logger.warn('User email not found in token', {
          userId: user.id
        });

        return {
          success: false,
          error: 'User email not found'
        };
      }

      const roles = user.user_metadata?.roles || user.app_metadata?.roles || ['patient'];
      const permissions = user.user_metadata?.permissions || user.app_metadata?.permissions || [];

      const issuedAt = user.created_at ? new Date(user.created_at) : new Date();
      const expiresAt = user.user_metadata?.exp 
        ? new Date(user.user_metadata.exp * 1000)
        : new Date(Date.now() + 3600000);

      const authenticatedUser = AuthenticatedUser.create({
        userId,
        email,
        roles: Array.isArray(roles) ? roles : [roles],
        permissions: Array.isArray(permissions) ? permissions : [],
        sessionId: user.user_metadata?.session_id,
        issuedAt,
        expiresAt
      });

      this.logger.debug('JWT validated successfully via Supabase', {
        userId: user.id,
        email,
        roles: authenticatedUser.roles,
        expiresAt: authenticatedUser.expiresAt.toISOString()
      });

      return {
        success: true,
        user: authenticatedUser
      };

    } catch (error) {
      this.logger.error('JWT verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  }

  async verifyAndDecode(tokenString: string): Promise<TokenVerificationResult> {
    try {
      const token = JWTToken.create(tokenString);
      return await this.verify(token);
    } catch (error) {
      this.logger.warn('Invalid token format', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: 'Invalid token format'
      };
    }
  }
}

