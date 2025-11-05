/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Provider/Staff Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Provider/Staff Service

Complete healthcare provider and staff management system for Vietnamese healthcare facilities.

## Features
- ✅ Doctor & Staff Profile Management
- ✅ Credentials & Certifications Tracking
- ✅ Department Assignments
- ✅ Schedule Management
- ✅ Specialization Management
- ✅ Availability Tracking
- ✅ Performance Metrics
- ✅ Event-Driven Architecture

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3022
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
        url: 'http://localhost:3022',
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
        name: 'Providers',
        description: 'Healthcare provider management operations'
      },
      {
        name: 'Staff',
        description: 'Staff management operations'
      },
      {
        name: 'Credentials',
        description: 'Credentials and certifications management'
      },
      {
        name: 'Schedules',
        description: 'Provider schedule management'
      },
      {
        name: 'Departments',
        description: 'Department assignment operations'
      },
      {
        name: 'Statistics',
        description: 'Provider statistics and performance metrics'
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
        // Provider/Staff Types
        ProviderType: {
          type: 'string',
          enum: ['DOCTOR', 'NURSE', 'TECHNICIAN', 'PHARMACIST', 'ADMIN', 'OTHER']
        },
        ProviderStatus: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED']
        },
        CredentialType: {
          type: 'string',
          enum: ['LICENSE', 'CERTIFICATION', 'DEGREE', 'TRAINING']
        },
        CredentialStatus: {
          type: 'string',
          enum: ['VALID', 'EXPIRED', 'PENDING_RENEWAL', 'REVOKED']
        },
        
        // Request/Response schemas
        CreateProviderRequest: {
          type: 'object',
          required: ['userId', 'type', 'specialization'],
          properties: {
            userId: {
              type: 'string',
              pattern: '^USR-\\d{6}-\\d{3}$',
              example: 'USR-202510-001'
            },
            type: {
              $ref: '#/components/schemas/ProviderType'
            },
            specialization: {
              type: 'string',
              example: 'Cardiology'
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

export const swaggerSpec = swaggerJsdoc(options);

