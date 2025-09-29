"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultVersionConfig = exports.ResponseTransformer = exports.ApiVersioning = void 0;
exports.versionedRoute = versionedRoute;
exports.responseTransformMiddleware = responseTransformMiddleware;
exports.createVersioningMiddleware = createVersioningMiddleware;
exports.deprecationNotice = deprecationNotice;
exports.checkVersionCompatibility = checkVersionCompatibility;
const response_helpers_1 = require("../utils/response-helpers");
/**
 * API versioning middleware
 */
class ApiVersioning {
    constructor(config) {
        this.config = config;
    }
    /**
     * Middleware to handle API versioning
     */
    versioningMiddleware() {
        return (req, res, next) => {
            // Get version from header, query parameter, or URL path
            let requestedVersion = this.extractVersion(req);
            // If no version specified, use default
            if (!requestedVersion) {
                requestedVersion = this.config.defaultVersion;
            }
            // Validate version
            if (!this.isVersionSupported(requestedVersion)) {
                const errorResponse = response_helpers_1.EnhancedResponseHelper.errorVi('VALIDATION_ERROR', 'UNSUPPORTED_VERSION', {
                    requestedVersion,
                    supportedVersions: this.config.supportedVersions,
                    message: `Phiên bản API ${requestedVersion} không được hỗ trợ`
                });
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
            req.apiVersion = requestedVersion;
            res.setHeader('X-API-Version', requestedVersion);
            next();
        };
    }
    /**
     * Extract version from request
     */
    extractVersion(req) {
        // 1. Check Accept header (e.g., application/vnd.hospital.v1+json)
        const acceptHeader = req.headers.accept;
        if (acceptHeader) {
            const versionMatch = acceptHeader.match(/application\/vnd\.hospital\.v(\d+)\+json/);
            if (versionMatch) {
                return `v${versionMatch[1]}`;
            }
        }
        // 2. Check custom header
        const versionHeader = req.headers['x-api-version'];
        if (versionHeader) {
            return versionHeader;
        }
        // 3. Check query parameter
        const versionQuery = req.query.version;
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
    isVersionSupported(version) {
        return this.config.supportedVersions.includes(version);
    }
    /**
     * Check if version is deprecated
     */
    isVersionDeprecated(version) {
        return Boolean(this.config.deprecated) && version !== this.config.defaultVersion;
    }
}
exports.ApiVersioning = ApiVersioning;
/**
 * Version-specific route handler
 */
function versionedRoute(versions) {
    return (req, res, next) => {
        const apiVersion = req.apiVersion || 'v1';
        const handler = versions[apiVersion];
        if (!handler) {
            const errorResponse = response_helpers_1.EnhancedResponseHelper.errorVi('VALIDATION_ERROR', 'VERSION_NOT_IMPLEMENTED', {
                version: apiVersion,
                availableVersions: Object.keys(versions),
                message: `Phiên bản ${apiVersion} chưa được triển khai cho endpoint này`
            });
            return res.status(501).json(errorResponse);
        }
        handler(req, res, next);
    };
}
/**
 * Response transformation based on API version
 */
class ResponseTransformer {
    /**
     * Transform response data based on API version
     */
    static transform(data, version) {
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
    static transformV1(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.transformV1(item));
        }
        if (data && typeof data === 'object') {
            // Convert snake_case to camelCase for v1 compatibility
            const transformed = {};
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
    static transformV2(data) {
        // v2 uses the current format, no transformation needed
        return data;
    }
}
exports.ResponseTransformer = ResponseTransformer;
/**
 * Middleware to transform response based on API version
 */
function responseTransformMiddleware() {
    return (req, res, next) => {
        const apiVersion = req.apiVersion || 'v2';
        // Override res.json to transform response
        const originalJson = res.json;
        res.json = function (body) {
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
exports.defaultVersionConfig = {
    version: 'v2',
    deprecated: false,
    supportedVersions: ['v1', 'v2'],
    defaultVersion: 'v2'
};
/**
 * Create versioning middleware with default config
 */
function createVersioningMiddleware(config) {
    const finalConfig = { ...exports.defaultVersionConfig, ...config };
    const versioning = new ApiVersioning(finalConfig);
    return versioning.versioningMiddleware();
}
/**
 * Deprecation notice middleware
 */
function deprecationNotice(version, deprecationDate, sunsetDate) {
    return (req, res, next) => {
        const apiVersion = req.apiVersion;
        if (apiVersion === version) {
            res.setHeader('X-API-Deprecated', 'true');
            res.setHeader('X-API-Deprecation-Date', deprecationDate.toISOString());
            if (sunsetDate) {
                res.setHeader('X-API-Sunset-Date', sunsetDate.toISOString());
            }
            // Add deprecation warning to response
            const originalJson = res.json;
            res.json = function (body) {
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
function checkVersionCompatibility(minVersion) {
    return (req, res, next) => {
        const apiVersion = req.apiVersion || 'v1';
        // Extract version number for comparison
        const currentVersionNum = parseInt(apiVersion.replace('v', ''));
        const minVersionNum = parseInt(minVersion.replace('v', ''));
        if (currentVersionNum < minVersionNum) {
            const errorResponse = response_helpers_1.EnhancedResponseHelper.errorVi('VALIDATION_ERROR', 'VERSION_TOO_OLD', {
                currentVersion: apiVersion,
                minimumVersion: minVersion,
                message: `Endpoint này yêu cầu tối thiểu phiên bản ${minVersion}`
            });
            return res.status(400).json(errorResponse);
        }
        next();
    };
}
//# sourceMappingURL=versioning.middleware.js.map