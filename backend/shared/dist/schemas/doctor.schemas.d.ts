interface SchemaObject {
    type?: string;
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: string[];
    properties?: Record<string, SchemaObject>;
    required?: string[];
    items?: SchemaObject;
    allOf?: Array<{
        $ref?: string;
    } | SchemaObject>;
    $ref?: string;
    description?: string;
    example?: any;
    additionalProperties?: boolean | SchemaObject;
    oneOf?: Array<SchemaObject>;
}
interface PathItemObject {
    get?: OperationObject;
    post?: OperationObject;
    put?: OperationObject;
    delete?: OperationObject;
}
interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    parameters?: Array<ParameterObject | {
        $ref: string;
    }>;
    requestBody?: RequestBodyObject;
    responses: Record<string, ResponseObject | {
        $ref: string;
    }>;
    security?: Array<Record<string, string[]>>;
}
interface ParameterObject {
    name: string;
    in: 'query' | 'path' | 'header';
    required?: boolean;
    description?: string;
    schema: SchemaObject;
}
interface RequestBodyObject {
    required?: boolean;
    content: Record<string, {
        schema: SchemaObject | {
            $ref: string;
        };
    }>;
}
interface ResponseObject {
    description: string;
    content?: Record<string, {
        schema: SchemaObject | {
            $ref: string;
        };
    }>;
}
/**
 * OpenAPI 3.0 schemas for Doctor entities
 */
export declare const doctorSchemas: Record<string, SchemaObject>;
/**
 * Doctor API paths for OpenAPI documentation
 */
export declare const doctorPaths: Record<string, PathItemObject>;
export {};
//# sourceMappingURL=doctor.schemas.d.ts.map