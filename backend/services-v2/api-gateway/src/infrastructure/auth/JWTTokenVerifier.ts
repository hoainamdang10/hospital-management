import jwt from "jsonwebtoken";
import {
  ITokenVerifier,
  TokenVerificationResult,
} from "@domain/services/ITokenVerifier";
import { JWTToken } from "@domain/value-objects/JWTToken";
import { AuthenticatedUser } from "@domain/entities/AuthenticatedUser";
import { UserId } from "@domain/value-objects/UserId";
import { ILogger } from "@application/services/ILogger";

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  patientId?: string;
  providerId?: string;
  iat: number;
  exp: number;
}

export interface JWTTokenVerifierConfig {
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
}

export class JWTTokenVerifier implements ITokenVerifier {
  constructor(
    private config: JWTTokenVerifierConfig,
    private logger: ILogger,
  ) {}

  async verify(token: JWTToken): Promise<TokenVerificationResult> {
    try {
      const decoded = jwt.verify(token.value, this.config.jwtSecret, {
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
      }) as JWTPayload;

      if (
        !decoded.userId ||
        !decoded.email ||
        !decoded.roles ||
        !decoded.permissions
      ) {
        this.logger.warn("Invalid JWT payload - missing required fields", {
          hasUserId: !!decoded.userId,
          hasEmail: !!decoded.email,
          hasRoles: !!decoded.roles,
          hasPermissions: !!decoded.permissions,
        });

        return {
          success: false,
          error: "Invalid token payload - missing required fields",
        };
      }

      const userId = UserId.create(decoded.userId);

      const user = AuthenticatedUser.create({
        userId,
        email: decoded.email,
        roles: decoded.roles,
        permissions: decoded.permissions,
        sessionId: decoded.sessionId,
        patientId: decoded.patientId,
        providerId: decoded.providerId,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
      });

      this.logger.debug("Token verified successfully", {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
        expiresAt: user.expiresAt.toISOString(),
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn("Token expired", {
          expiredAt: error.expiredAt,
        });

        return {
          success: false,
          error: "Token expired",
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn("Invalid token", {
          error: error.message,
        });

        return {
          success: false,
          error: `Invalid token: ${error.message}`,
        };
      }

      this.logger.error("Token verification error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: "Token verification failed",
      };
    }
  }

  async verifyAndDecode(tokenString: string): Promise<TokenVerificationResult> {
    try {
      const token = JWTToken.create(tokenString);
      return await this.verify(token);
    } catch (error) {
      this.logger.warn("Invalid token format", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: "Invalid token format",
      };
    }
  }
}
