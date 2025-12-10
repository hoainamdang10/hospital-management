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
      title: 'Patient Registry Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Patient Registry Service

Comprehensive patient management system for Vietnamese healthcare facilities.

## Features
-  Patient Registration & Management
-  Medical History Tracking
-  Insurance Management (BHYT/BHTN)
-  Emergency Contacts
-  Consent Management (HIPAA Compliant)
-  Photo Management
-  Communication Preferences
-  Patient Matching (PMI)
-  Vietnamese Healthcare Compliance
-  CCCD/BHYT Validation
-  Audit Logging

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3023
- Production: https://api.hospital.vn

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Vietnamese Healthcare Compliance
- CCCD (Căn cước công dân) validation
- BHYT (Bảo hiểm y tế) number validation
- MOH (Ministry of Health) compliance
- HIPAA-compliant consent management
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
        url: 'http://localhost:3023',
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
        name: 'Patients',
        description: 'Patient CRUD operations'
      },
      {
        name: 'Search',
        description: 'Patient search and matching'
      },
      {
        name: 'Emergency Contacts',
        description: 'Emergency contact management'
      },
      {
        name: 'Insurance',
        description: 'Insurance management (BHYT/BHTN)'
      },
      {
        name: 'Consents',
        description: 'Patient consent management (HIPAA compliant)'
      },
      {
        name: 'Photos',
        description: 'Patient photo management'
      },
      {
        name: 'Communication',
        description: 'Communication preferences'
      },
      {
        name: 'Advanced',
        description: 'Advanced operations (merge, link, deactivate)'
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
        // Patient Status
        PatientStatus: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'DECEASED', 'MERGED'],
          description: 'Patient status in the system'
        },

        // Gender
        Gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Patient gender'
        },

        // Blood Type
        BloodType: {
          type: 'string',
          enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          description: 'Patient blood type'
        },

        // Insurance Type
        InsuranceType: {
          type: 'string',
          enum: ['BHYT', 'BHTN', 'PRIVATE', 'NONE'],
          description: 'BHYT = Compulsory, BHTN = Voluntary, PRIVATE = Private insurance'
        },

        // Request/Response schemas
        RegisterPatientRequest: {
          type: 'object',
          required: ['fullName', 'dateOfBirth', 'gender', 'nationalId'],
          properties: {
            fullName: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              example: 'Nguyễn Văn A'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15'
            },
            gender: {
              $ref: '#/components/schemas/Gender'
            },
            nationalId: {
              type: 'string',
              pattern: '^\\d{12}$',
              example: '001234567890',
              description: 'CCCD (12 digits)'
            },
            phoneNumber: {
              type: 'string',
              pattern: '^(\\+84|0)[0-9]{9,10}$',
              example: '+84901234567'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'patient@example.com'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Đường ABC' },
                ward: { type: 'string', example: 'Phường 1' },
                district: { type: 'string', example: 'Quận 1' },
                city: { type: 'string', example: 'TP. Hồ Chí Minh' },
                country: { type: 'string', example: 'Vietnam' }
              }
            },
            bloodType: {
              $ref: '#/components/schemas/BloodType'
            }
          }
        },

        PatientResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                patientId: { type: 'string', example: 'PAT-202501-001' },
                fullName: { type: 'string', example: 'Nguyễn Văn A' },
                dateOfBirth: { type: 'string', format: 'date' },
                gender: { $ref: '#/components/schemas/Gender' },
                nationalId: { type: 'string', example: '001234567890' },
                status: { $ref: '#/components/schemas/PatientStatus' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string', example: 'Patient registered successfully' }
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
              example: ['Full name is required', 'Invalid CCCD format']
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR'
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

