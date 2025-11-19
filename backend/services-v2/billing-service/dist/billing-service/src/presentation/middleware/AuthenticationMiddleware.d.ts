/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 */
import { Request, Response, NextFunction } from "express";
import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface AuthenticatedUser {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
    patientId?: string;
}
export interface AuthenticatedRequest extends Request {
    authenticatedUser?: AuthenticatedUser;
    correlationId?: string;
}
export interface AuthenticationMiddlewareConfig {
    identityServiceUrl: string;
    logger: ILogger;
    skipPaths?: string[];
}
export declare class AuthenticationMiddleware {
    private readonly identityServiceUrl;
    private readonly logger;
    private readonly skipPaths;
    private readonly bypassAuth;
    constructor(config: AuthenticationMiddlewareConfig);
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    private shouldSkipAuth;
    private extractGatewayUser;
    private getHeaderValue;
    private parseHeaderArray;
}
//# sourceMappingURL=AuthenticationMiddleware.d.ts.map