import { Express } from 'express';
/**
 * Generate OpenAPI specification
 */
export declare const swaggerSpec: any;
/**
 * Setup Swagger UI for API Gateway
 */
export declare function setupSwagger(app: Express): void;
/**
 * Add OpenAPI documentation to existing routes
 */
export declare function addOpenAPIDocumentation(): {
    healthCheck: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            '200': {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
            '503': {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                    };
                };
            };
        };
    };
    serviceStatus: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            '200': {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            type: string;
                            properties: {
                                success: {
                                    type: string;
                                };
                                data: {
                                    type: string;
                                    properties: {
                                        gateway: {
                                            $ref: string;
                                        };
                                        auth: {
                                            $ref: string;
                                        };
                                        doctor: {
                                            $ref: string;
                                        };
                                        patient: {
                                            $ref: string;
                                        };
                                        appointment: {
                                            $ref: string;
                                        };
                                        department: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    metrics: {
        tags: string[];
        summary: string;
        description: string;
        responses: {
            '200': {
                description: string;
                content: {
                    'text/plain': {
                        schema: {
                            type: string;
                            example: string;
                        };
                    };
                };
            };
        };
    };
};
/**
 * Validate OpenAPI specification
 */
export declare function validateOpenAPISpec(): boolean;
/**
 * Export OpenAPI spec for other services
 */
export { swaggerSpec as openAPISpec };
