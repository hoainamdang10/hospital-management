"use strict";
/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 *
 * @author Hospital Management Team
 * @version 3.0.0
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
            title: 'Appointments Service API',
            version: '3.0.0',
            description: `
# Hospital Management System - Appointments Service

Complete appointment scheduling and management system for Vietnamese healthcare facilities.

## Features
- ✅ Appointment Scheduling & Management
- ✅ Queue Management
- ✅ Provider Availability Search
- ✅ Payment Integration
- ✅ Insurance Validation (BHYT/BHTN)
- ✅ Reminder System
- ✅ Event-Driven Architecture
- ✅ CQRS Read Model

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3004
- Production: https://api.hospital.vn

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user
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
                url: 'http://localhost:3004',
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
                name: 'Appointments',
                description: 'Appointment management operations (Commands)'
            },
            {
                name: 'Queue',
                description: 'Waiting queue management'
            },
            {
                name: 'Availability',
                description: 'Provider availability and scheduling'
            },
            {
                name: 'Queries',
                description: 'Read operations (CQRS Read Model)'
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
                // Appointment
                AppointmentStatus: {
                    type: 'string',
                    enum: [
                        'SCHEDULED',
                        'CONFIRMED',
                        'ARRIVED',
                        'IN_PROGRESS',
                        'COMPLETED',
                        'CANCELLED',
                        'NO_SHOW'
                    ]
                },
                AppointmentType: {
                    type: 'string',
                    enum: [
                        'CONSULTATION',
                        'FOLLOW_UP',
                        'EMERGENCY',
                        'PREVENTIVE',
                        'SPECIALIZED'
                    ]
                },
                AppointmentPriority: {
                    type: 'string',
                    enum: ['NORMAL', 'URGENT', 'EMERGENCY']
                },
                QueueStatus: {
                    type: 'string',
                    enum: ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'LEFT']
                },
                PaymentMethod: {
                    type: 'string',
                    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE']
                },
                InsuranceType: {
                    type: 'string',
                    enum: ['BHYT', 'BHTN', 'PRIVATE'],
                    description: 'BHYT = Compulsory, BHTN = Voluntary, PRIVATE = Private insurance'
                },
                // Request/Response schemas
                ScheduleAppointmentRequest: {
                    type: 'object',
                    required: ['patientId', 'doctorId', 'appointmentDate', 'appointmentTime', 'duration'],
                    properties: {
                        patientId: {
                            type: 'string',
                            pattern: '^PAT-\\d{6}-\\d{3}$',
                            example: 'PAT-202510-001'
                        },
                        doctorId: {
                            type: 'string',
                            pattern: '^DEPT-DOC-\\d{6}-\\d{3}$',
                            example: 'DEPT-DOC-202510-001'
                        },
                        appointmentDate: {
                            type: 'string',
                            format: 'date',
                            example: '2025-10-30'
                        },
                        appointmentTime: {
                            type: 'string',
                            pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
                            example: '09:00'
                        },
                        duration: {
                            type: 'integer',
                            minimum: 15,
                            maximum: 120,
                            example: 30,
                            description: 'Duration in minutes'
                        },
                        type: {
                            $ref: '#/components/schemas/AppointmentType'
                        },
                        priority: {
                            $ref: '#/components/schemas/AppointmentPriority'
                        },
                        reason: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 500,
                            example: 'Khám tổng quát'
                        },
                        chiefComplaint: {
                            type: 'string',
                            maxLength: 1000,
                            example: 'Đau đầu, chóng mặt'
                        },
                        symptoms: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['Đau đầu', 'Chóng mặt', 'Buồn nôn']
                        },
                        consultationFee: {
                            type: 'number',
                            minimum: 0,
                            example: 500000,
                            description: 'Fee in VND'
                        }
                    }
                },
                AppointmentResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                appointmentId: { type: 'string', example: 'APT-202510-001' },
                                patientId: { type: 'string' },
                                doctorId: { type: 'string' },
                                appointmentDate: { type: 'string', format: 'date' },
                                appointmentTime: { type: 'string' },
                                status: { $ref: '#/components/schemas/AppointmentStatus' },
                                queueNumber: { type: 'integer', example: 5 },
                                estimatedWaitTime: { type: 'integer', example: 45, description: 'Minutes' }
                            }
                        },
                        message: { type: 'string' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Validation failed' },
                        errors: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['Patient ID is required', 'Invalid appointment time']
                        }
                    }
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