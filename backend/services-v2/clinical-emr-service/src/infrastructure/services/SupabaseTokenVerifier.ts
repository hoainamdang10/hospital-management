/**
 * SupabaseTokenVerifier - JWT Token Verification Implementation
 * Verifies JWT tokens using Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Security
 */

import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { ITokenVerifier, TokenPayload } from '../../application/services/ITokenVerifier';
import { ILogger } from '../../application/services/ILogger';
import { TYPES } from '../di/types';

@injectable()
export class SupabaseTokenVerifier implements ITokenVerifier {
  private readonly jwtSecret: string;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {
    this.jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET or SUPABASE_JWT_SECRET must be configured');
    }
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      // Extract user information
      const payload: TokenPayload = {
        id: decoded.sub || decoded.user_id || decoded.id,
        email: decoded.email,
        role: decoded.role || decoded.user_role,
        sessionId: decoded.session_id || decoded.sid || decoded.sessionId,
        exp: decoded.exp,
        iat: decoded.iat
      };

      // Validate required fields
      if (!payload.id) {
        this.logger.warn('Token missing user ID', { decoded });
        return null;
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn('Token expired', { userId: payload.id });
        return null;
      }

      return payload;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Token expired', { error: error.message });
      } else if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid token', { error: error.message });
      } else {
        this.logger.error('Token verification failed', { error });
      }
      return null;
    }
  }
}
