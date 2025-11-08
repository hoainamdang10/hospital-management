import {
  ITokenVerifier,
  TokenVerificationResult,
} from "@domain/services/ITokenVerifier";
import { JWTToken } from "@domain/value-objects/JWTToken";
import { ILogger } from "../services/ILogger";

export interface AuthenticateRequestInput {
  authorizationHeader?: string;
  requestId: string;
  ip: string;
  path: string;
}

export interface AuthenticateRequestOutput {
  success: boolean;
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
    patientId?: string;
    providerId?: string;
    primaryRole?: string;
  };
  error?: string;
}

const ROLE_PRIORITY: string[] = [
  "super_admin",
  "admin",
  "doctor",
  "nurse",
  "patient",
];

export class AuthenticateRequestUseCase {
  constructor(
    private tokenVerifier: ITokenVerifier,
    private logger: ILogger,
  ) {}

  async execute(
    input: AuthenticateRequestInput,
  ): Promise<AuthenticateRequestOutput> {
    try {
      if (!input.authorizationHeader) {
        this.logger.warn("Missing authorization header", {
          requestId: input.requestId,
          ip: input.ip,
          path: input.path,
        });

        return {
          success: false,
          error: "Missing authorization header",
        };
      }

      if (!input.authorizationHeader.startsWith("Bearer ")) {
        this.logger.warn("Invalid authorization header format", {
          requestId: input.requestId,
          ip: input.ip,
          path: input.path,
        });

        return {
          success: false,
          error:
            'Invalid authorization header format - must be "Bearer <token>"',
        };
      }

      const tokenString = input.authorizationHeader.substring(7);

      let token: JWTToken;
      try {
        token = JWTToken.create(tokenString);
      } catch (error) {
        this.logger.warn("Invalid JWT token format", {
          requestId: input.requestId,
          ip: input.ip,
          path: input.path,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        return {
          success: false,
          error: "Invalid JWT token format",
        };
      }

      const verificationResult: TokenVerificationResult =
        await this.tokenVerifier.verify(token);

      if (!verificationResult.success || !verificationResult.user) {
        this.logger.warn("Token verification failed", {
          requestId: input.requestId,
          ip: input.ip,
          path: input.path,
          error: verificationResult.error,
        });

        return {
          success: false,
          error: verificationResult.error || "Token verification failed",
        };
      }

      const user = verificationResult.user;

      if (user.isExpired()) {
        this.logger.warn("Token expired", {
          requestId: input.requestId,
          ip: input.ip,
          path: input.path,
          userId: user.userId.value,
          expiresAt: user.expiresAt.toISOString(),
        });

        return {
          success: false,
          error: "Token expired",
        };
      }

      this.logger.info("Request authenticated successfully", {
        requestId: input.requestId,
        ip: input.ip,
        path: input.path,
        userId: user.userId.value,
        email: user.email,
        roles: user.roles,
      });

      const normalizedRoles = this.normalizeRoles(user.roles);
      const primaryRole = this.resolvePrimaryRole(normalizedRoles);

      return {
        success: true,
        user: {
          userId: user.userId.value,
          email: user.email,
          roles: normalizedRoles,
          permissions: user.permissions,
          sessionId: user.sessionId,
          patientId: user.patientId,
          providerId: user.providerId,
          primaryRole,
        },
      };
    } catch (error) {
      this.logger.error("Authentication error", {
        requestId: input.requestId,
        ip: input.ip,
        path: input.path,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: "Internal authentication error",
      };
    }
  }

  private normalizeRoles(roles: string[]): string[] {
    if (!roles || roles.length === 0) {
      return ["patient"];
    }
    return roles
      .map((role) => (typeof role === "string" ? role : String(role)))
      .map((role) => role.toLowerCase());
  }

  private resolvePrimaryRole(roles: string[]): string | undefined {
    if (!roles || roles.length === 0) {
      return undefined;
    }

    const sorted = [...roles].sort((a, b) => {
      const aPriority = ROLE_PRIORITY.indexOf(a);
      const bPriority = ROLE_PRIORITY.indexOf(b);
      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });

    return sorted[0];
  }
}
