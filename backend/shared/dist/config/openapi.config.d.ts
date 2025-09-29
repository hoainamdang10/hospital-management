interface OpenAPIDocument {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
        contact?: {
            name?: string;
            email?: string;
        };
        license?: {
            name: string;
            url?: string;
        };
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    components?: {
        securitySchemes?: Record<string, any>;
        parameters?: Record<string, any>;
        schemas?: Record<string, any>;
        responses?: Record<string, any>;
    };
    security?: Array<Record<string, string[]>>;
    tags?: Array<{
        name: string;
        description?: string;
    }>;
}
/**
 * Shared OpenAPI 3.0 configuration for Hospital Management System
 */
export declare const baseOpenAPIConfig: OpenAPIDocument;
/**
 * Common OpenAPI schemas for Hospital entities
 */
export declare const hospitalSchemas: {
    VietnamesePhone: {
        type: string;
        pattern: string;
        description: string;
        example: string;
    };
    VietnameseLicense: {
        type: string;
        pattern: string;
        description: string;
        example: string;
    };
    Gender: {
        type: string;
        enum: string[];
        description: string;
        example: string;
    };
    AppointmentStatus: {
        type: string;
        enum: string[];
        description: string;
        example: string;
    };
};
export {};
//# sourceMappingURL=openapi.config.d.ts.map