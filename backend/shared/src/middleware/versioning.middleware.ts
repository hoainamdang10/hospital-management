import { Request, Response, NextFunction } from 'express';
import { EnhancedResponseHelper } from '../utils/response-helpers';

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
export class ApiVersioning {
  private config: ApiVersionConfig;

  constructor(config: ApiVersionConfig) {
    this.config = config;
  }

  /**
   * Middleware to handle API versioning
   */
  versioningMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Get version from header, query parameter, or URL path
      let requestedVersion = this.extractVersion(req);

      // If no version specified, use default
      if (!requestedVersion) {
        requestedVersion = this.config.defaultVersion;
      }

      // Validate version
      if (!this.isVersionSupported(requestedVersion)) {
        const errorResponse = EnhancedResponseHelper.errorVi(
          'VALIDATION_ERROR',
          'UNSUPPORTED_VERSION',
          {
            requestedVersion,
            supportedVersions: this.config.supportedVersions,
            message: `Phiên bản API ${requestedVersion} không được hỗ trợ`
          }
        );
        return res.status(400).json(errorResponse);
      }

      // Check if version is deprecated
      if (this.isVersionDeprecated(requestedVersion)) {
        res.setHeader('X-API-Deprecated', 'true');
        res.setHeader('X-API-Deprecation-Date', this.config.deprecationDate?.toISOString() || '');
        
        if (this.config.sunsetDate) {
          res.setHeader('X-API-Sunset-Date', this.config.sunsetDate.toISOString());
        }
        
        res.setHeader('X-API-Supported-Versions', this.config.supportedVersions.join(', '));
      }

      // Add version info to request
      (req as any).apiVersion = requestedVersion;
      res.setHeader('X-API-Version', requestedVersion);

      next();
    };
  }

  /**
   * Extract version from request
   */
  private extractVersion(req: Request): string | null {
    // 1. Check Accept header (e.g., application/vnd.hospital.v1+json)
    const acceptHeader = req.headers.accept;
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.hospital\.v(\d+)\+json/);
      if (versionMatch) {
        return `v${versionMatch[1]}`;
      }
    }

    // 2. Check custom header
    const versionHeader = req.headers['x-api-version'] as string;
    if (versionHeader) {
      return versionHeader;
    }

    // 3. Check query parameter
    const versionQuery = req.query.version as string;
    if (versionQuery) {
      return versionQuery;
    }

    // 4. Check URL path (e.g., /api/v1/doctors)
    const pathMatch = req.path.match(/^\/api\/v(\d+)/);
    if (pathMatch) {
      return `v${pathMatch[1]}`;
    }

    return null;
  }

  /**
   * Check if version is supported
   */
  private isVersionSupported(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Check if version is deprecated
   */
  private isVersionDeprecated(version: string): boolean {
    return Boolean(this.config.deprecated) && version !== this.config.defaultVersion;
  }
}

/**
 * Version-specific route handler
 */
export function versionedRoute(versions: Record<string, (req: Request, res: Response, next: NextFunction) => void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = (req as any).apiVersion || 'v1';
    
    const handler = versions[apiVersion];
    if (!handler) {
      const errorResponse = EnhancedResponseHelper.errorVi(
        'VALIDATION_ERROR',
        'VERSION_NOT_IMPLEMENTED',
        {
          version: apiVersion,
          availableVersions: Object.keys(versions),
          message: `Phiên bản ${apiVersion} chưa được triển khai cho endpoint này`
        }
      );
      return res.status(501).json(errorResponse);
    }

    handler(req, res, next);
  };
}

/**
 * Response transformation based on API version
 */
export class ResponseTransformer {
  /**
   * Transform response data based on API version
   */
  static transform(data: any, version: string): any {
    switch (version) {
      case 'v1':
        return this.transformV1(data);
      case 'v2':
        return this.transformV2(data);
      default:
        return data;
    }
  }

  /**
   * Transform for API v1 (legacy format)
   */
  private static transformV1(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformV1(item));
    }

    if (data && typeof data === 'object') {
      // Convert snake_case to camelCase for v1 compatibility
      const transformed: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = this.transformV1(value);
      }
      
      return transformed;
    }

    return data;
  }

  /**
   * Transform for API v2 (current format)
   */
  private static transformV2(data: any): any {
    // v2 uses the current format, no transformation needed
    return data;
  }
}

/**
 * Middleware to transform response based on API version
 */
export function responseTransformMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = (req as any).apiVersion || 'v2';
    
    // Override res.json to transform response
    const originalJson = res.json;
    res.json = function(body: any) {
      if (body && body.data) {
        body.data = ResponseTransformer.transform(body.data, apiVersion);
      }
      
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Default API versioning configuration for Hospital Management System
 */
export const defaultVersionConfig: ApiVersionConfig = {
  version: 'v2',
  deprecated: false,
  supportedVersions: ['v1', 'v2'],
  defaultVersion: 'v2'
};

/**
 * Create versioning middleware with default config
 */
export function createVersioningMiddleware(config?: Partial<ApiVersionConfig>) {
  const finalConfig = { ...defaultVersionConfig, ...config };
  const versioning = new ApiVersioning(finalConfig);
  return versioning.versioningMiddleware();
}

/**
 * Deprecation notice middleware
 */
export function deprecationNotice(version: string, deprecationDate: Date, sunsetDate?: Date) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = (req as any).apiVersion;
    
    if (apiVersion === version) {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Date', deprecationDate.toISOString());
      
      if (sunsetDate) {
        res.setHeader('X-API-Sunset-Date', sunsetDate.toISOString());
      }
      
      // Add deprecation warning to response
      const originalJson = res.json;
      res.json = function(body: any) {
        if (body && typeof body === 'object') {
          body.meta = body.meta || {};
          body.meta.deprecationWarning = {
            message: `API phiên bản ${version} sẽ ngừng hỗ trợ vào ${deprecationDate.toLocaleDateString('vi-VN')}`,
            deprecationDate: deprecationDate.toISOString(),
            sunsetDate: sunsetDate?.toISOString(),
            upgradeInstructions: 'Vui lòng nâng cấp lên phiên bản mới nhất'
          };
        }
        
        return originalJson.call(this, body);
      };
    }

    next();
  };
}

/**
 * Version compatibility check
 */
export function checkVersionCompatibility(minVersion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiVersion = (req as any).apiVersion || 'v1';
    
    // Extract version number for comparison
    const currentVersionNum = parseInt(apiVersion.replace('v', ''));
    const minVersionNum = parseInt(minVersion.replace('v', ''));
    
    if (currentVersionNum < minVersionNum) {
      const errorResponse = EnhancedResponseHelper.errorVi(
        'VALIDATION_ERROR',
        'VERSION_TOO_OLD',
        {
          currentVersion: apiVersion,
          minimumVersion: minVersion,
          message: `Endpoint này yêu cầu tối thiểu phiên bản ${minVersion}`
        }
      );
      return res.status(400).json(errorResponse);
    }

    next();
  };
}
