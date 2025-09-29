"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hospital Auth Service API',
            version: '1.0.0',
            description: 'Authentication microservice using Supabase Auth for Hospital Management System',
            contact: {
                name: 'Hospital Management Team',
                email: 'support@hospital.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.hospital.com/auth'
                    : 'http://localhost:3001',
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your Supabase JWT token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'User unique identifier'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        full_name: {
                            type: 'string',
                            description: 'User full name'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'doctor', 'patient'],
                            description: 'User role in the system'
                        },
                        phone_number: {
                            type: 'string',
                            description: 'User phone number'
                        },
                        gender: {
                            type: 'string',
                            enum: ['male', 'female', 'other'],
                            description: 'User gender'
                        },
                        date_of_birth: {
                            type: 'string',
                            format: 'date',
                            description: 'User date of birth'
                        },
                        is_active: {
                            type: 'boolean',
                            description: 'Whether the user account is active'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp'
                        },
                        last_sign_in_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last sign in timestamp'
                        }
                    }
                },
                Session: {
                    type: 'object',
                    properties: {
                        access_token: {
                            type: 'string',
                            description: 'JWT access token'
                        },
                        refresh_token: {
                            type: 'string',
                            description: 'Refresh token for getting new access tokens'
                        },
                        expires_in: {
                            type: 'integer',
                            description: 'Token expiration time in seconds'
                        },
                        token_type: {
                            type: 'string',
                            default: 'bearer',
                            description: 'Token type'
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            default: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        message: {
                            type: 'string',
                            description: 'Detailed error description'
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object'
                            },
                            description: 'Validation error details'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            default: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints'
            },
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Sessions',
                description: 'Session management endpoints'
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts'
    ]
};
const specs = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    const swaggerOptions = {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true
        },
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c5aa0 }
    `,
        customSiteTitle: 'Hospital Auth Service API Documentation'
    };
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, swaggerOptions));
    app.get('/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
};
exports.setupSwagger = setupSwagger;
exports.default = specs;
//# sourceMappingURL=swagger.js.map