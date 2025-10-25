/**
 * Medical Record Routes - Presentation Layer
 * Express routes for medical records API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA
 */
import { Router } from 'express';
/**
 * Create medical record routes
 */
export declare function createMedicalRecordRoutes(): Router;
/**
 * Route configuration
 */
export declare const routeConfig: {
    basePath: string;
    version: string;
    service: string;
    description: string;
    endpoints: {
        method: string;
        path: string;
        description: string;
        roles: string[];
        rateLimit: string;
    }[];
};
/**
 * Route documentation generator
 */
export declare function generateRouteDocumentation(): {
    service: string;
    version: string;
    basePath: string;
    description: string;
    endpoints: {
        method: string;
        path: string;
        description: string;
        roles: string[];
        rateLimit: string;
    }[];
    authentication: string;
    authorization: string;
    rateLimit: string;
    auditLogging: string;
    errorHandling: string;
    validation: string;
};
//# sourceMappingURL=medical-record.routes.d.ts.map