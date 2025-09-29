import { Request, Response, NextFunction } from 'express';
/**
 * API Version configuration
 */
export interface ApiVersionConfig {
    version: string;
    deprecated?: boolean;
    deprecationDate?: Date;
    sunsetDate?: Date;
    supportedVersions: string[];
    defaultVersion: string;
}
/**
 * API versioning middleware
 */
export declare class ApiVersioning {
    private config;
    constructor(config: ApiVersionConfig);
    /**
     * Middleware to handle API versioning
     */
    versioningMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Extract version from request
     */
    private extractVersion;
    /**
     * Check if version is supported
     */
    private isVersionSupported;
    /**
     * Check if version is deprecated
     */
    private isVersionDeprecated;
}
/**
 * Version-specific route handler
 */
export declare function versionedRoute(versions: Record<string, (req: Request, res: Response, next: NextFunction) => void>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Response transformation based on API version
 */
export declare class ResponseTransformer {
    /**
     * Transform response data based on API version
     */
    static transform(data: any, version: string): any;
    /**
     * Transform for API v1 (legacy format)
     */
    private static transformV1;
    /**
     * Transform for API v2 (current format)
     */
    private static transformV2;
}
/**
 * Middleware to transform response based on API version
 */
export declare function responseTransformMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Default API versioning configuration for Hospital Management System
 */
export declare const defaultVersionConfig: ApiVersionConfig;
/**
 * Create versioning middleware with default config
 */
export declare function createVersioningMiddleware(config?: Partial<ApiVersionConfig>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Deprecation notice middleware
 */
export declare function deprecationNotice(version: string, deprecationDate: Date, sunsetDate?: Date): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Version compatibility check
 */
export declare function checkVersionCompatibility(minVersion: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=versioning.middleware.d.ts.map