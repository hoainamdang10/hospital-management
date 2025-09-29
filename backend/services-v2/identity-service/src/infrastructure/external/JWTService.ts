/**
 * JWTService - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * JWT token service with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Security Standards, Vietnamese Healthcare
 */

import * as jwt from 'jsonwebtoken';
import { IJWTService } from '../../domain/services/IJWTService';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface JWTServiceConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  issuer: string;
  audience: string;
  logger: ILogger;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * JWT Service
 * Implements JWT token generation and validation
 */
export class JWTService implements IJWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly logger: ILogger;

  constructor(config: JWTServiceConfig) {
    this.accessTokenSecret = config.accessTokenSecret;
    this.refreshTokenSecret = config.refreshTokenSecret;
    this.issuer = config.issuer || 'hospital-management-system';
    this.audience = config.audience || 'hospital-users';
    this.logger = config.logger;
  }

  /**
   * Generate access token
   */
  async generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>, expiresIn: string = '24h'): Promise<string> {
    try {
      this.logger.debug('Generating access token', {
        userId: payload.userId,
        role: payload.role,
        sessionId: payload.sessionId,
        expiresIn
      });

      const tokenPayload: TokenPayload = {
        ...payload,
        iss: this.issuer,
        aud: this.audience
      };

      const token = jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256'
      });

      this.logger.debug('Access token generated successfully', {
        userId: payload.userId,
        tokenLength: token.length
      });

      return token;

    } catch (error) {
      this.logger.error('Error generating access token', {
        userId: payload.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tạo access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>, expiresIn: string = '7d'): Promise<string> {
    try {
      this.logger.debug('Generating refresh token', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresIn
      });

      const tokenPayload: RefreshTokenPayload = {
        ...payload,
        iss: this.issuer,
        aud: this.audience
      };

      const token = jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256'
      });

      this.logger.debug('Refresh token generated successfully', {
        userId: payload.userId,
        tokenLength: token.length
      });

      return token;

    } catch (error) {
      this.logger.error('Error generating refresh token', {
        userId: payload.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tạo refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      this.logger.debug('Verifying access token', {
        tokenLength: token.length
      });

      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as TokenPayload;

      this.logger.debug('Access token verified successfully', {
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId
      });

      return decoded;

    } catch (error) {
      this.logger.warn('Access token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenLength: token.length
      });

      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token đã hết hạn');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Access token không hợp lệ');
      } else {
        throw new Error(`Lỗi xác thực access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      this.logger.debug('Verifying refresh token', {
        tokenLength: token.length
      });

      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as RefreshTokenPayload;

      this.logger.debug('Refresh token verified successfully', {
        userId: decoded.userId,
        sessionId: decoded.sessionId
      });

      return decoded;

    } catch (error) {
      this.logger.warn('Refresh token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenLength: token.length
      });

      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token đã hết hạn');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token không hợp lệ');
      } else {
        throw new Error(`Lỗi xác thực refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      this.logger.error('Error decoding token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;

    } catch (error) {
      this.logger.error('Error checking token expiration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);

    } catch (error) {
      this.logger.error('Error getting token expiration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Extract user ID from token without full verification
   */
  extractUserId(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.userId || null;

    } catch (error) {
      this.logger.error('Error extracting user ID from token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(
    userPayload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
    accessTokenExpiry: string = '24h',
    refreshTokenExpiry: string = '7d'
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(userPayload, accessTokenExpiry),
        this.generateRefreshToken({
          userId: userPayload.userId,
          sessionId: userPayload.sessionId
        }, refreshTokenExpiry)
      ]);

      return { accessToken, refreshToken };

    } catch (error) {
      this.logger.error('Error generating token pair', {
        userId: userPayload.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tạo cặp token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    try {
      // JWT should have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Each part should be base64 encoded
      for (const part of parts) {
        if (!this.isValidBase64(part)) {
          return false;
        }
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Check if string is valid base64
   */
  private isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): any {
    return {
      serviceName: 'JWTService',
      isHealthy: true,
      issuer: this.issuer,
      audience: this.audience,
      hasAccessTokenSecret: !!this.accessTokenSecret,
      hasRefreshTokenSecret: !!this.refreshTokenSecret,
      lastCheckedAt: new Date().toISOString()
    };
  }
}
