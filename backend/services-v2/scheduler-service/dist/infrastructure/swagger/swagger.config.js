"use strict";
/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Scheduler Service API',
            version: '2.0.0',
            description: `
# Hospital Management System - Scheduler Service

Job scheduling and cron management system for Vietnamese healthcare facilities.

## Features
- ✅ Cron-based Scheduling
- ✅ Recurring Tasks
- ✅ Job Monitoring
- ✅ Dead Letter Queue
- ✅ Schedule Deduplication
- ✅ Manual Job Execution
- ✅ Run History Tracking
- ✅ Retry Mechanism
- ✅ SDK for Other Services

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3030
- Production: https://api.hospital.vn

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Cron Expression Format
Standard cron format with 5 fields:
\`\`\`
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
\`\`\`

Examples:
- \`0 9 * * *\` - Daily at 9:00 AM
- \`*/15 * * * *\` - Every 15 minutes
- \`0 0 * * 0\` - Weekly on Sunday at midnight
      `,
            contact: {
                name: 'Hospital Management Team',
                email: 'api@hospital.vn',
                url: 'https://hospital.vn'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3030',
                description: 'Development server'
            },
            {
                url: 'https://api.hospital.vn',
                description: 'Production server'
            },
            {
                url: 'https://staging-api.hospital.vn',
                description: 'Staging server'
            }
        ],
        tags: [
            {
                name: 'Schedules',
                description: 'Schedule management operations'
            },
            {
                name: 'Runs',
                description: 'Job run history and monitoring'
            },
            {
                name: 'Cron',
                description: 'Cron job management'
            },
            {
                name: 'Monitoring',
                description: 'Job monitoring and statistics'
            },
            {
                name: 'Health',
                description: 'Service health checks'
            },
            {
                name: 'Metrics',
                description: 'Service metrics and monitoring'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT authentication token from Identity Service'
                }
            },
            schemas: {
                // Schedule Types
                ScheduleStatus: {
                    type: 'string',
                    enum: ['ACTIVE', 'PAUSED', 'CANCELLED']
                },
                // Run Types
                RunStatus: {
                    type: 'string',
                    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING']
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: [
        './src/presentation/routes/*.ts',
        './src/presentation/controllers/*.ts'
    ]
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.config.js.map