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
      title: 'Identity Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Identity Service

Authentication, authorization, and user management service for Vietnamese healthcare facilities.

## Features
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Multi-Factor Authentication (MFA)
- ✅ Email Verification
- ✅ Password Recovery
- ✅ Session Management
- ✅ User Management
- ✅ Permission Management
- ✅ Password Policies
- ✅ Account Recovery

## Authentication
Most endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Public endpoints (no authentication required):
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- GET /api/v1/auth/verify-email
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/resend-verification
- POST /api/v1/auth/activate-staff
- POST /api/v1/auth/refresh
- POST /api/v1/auth/mfa/verify

## Base URL
- Development: http://localhost:3021
- Production: https://api.hospital.vn

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Roles
- SUPER_ADMIN: Full system access
- ADMIN: Administrative access
- DOCTOR: Medical staff access
- NURSE: Nursing staff access
- PATIENT: Patient portal access
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
        url: 'http://localhost:3021',
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
        name: 'Authentication',
        description: 'User authentication operations (login, register, logout)'
      },
      {
        name: 'MFA',
        description: 'Multi-factor authentication operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Admin',
        description: 'Administrative operations (SUPER_ADMIN, ADMIN only)'
      },
      {
        name: 'Sessions',
        description: 'Session management operations'
      },
      {
        name: 'Permissions',
        description: 'Permission and role management'
      },
      {
        name: 'Password Policy',
        description: 'Password policy configuration'
      },
      {
        name: 'Account Recovery',
        description: 'Account recovery operations'
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
          description: 'JWT authentication token'
        }
      },
      schemas: {
        // User Roles
        UserRole: {
          type: 'string',
          enum: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'],
          description: 'User role in the system'
        },

        // Request/Response schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'doctor@hospital.vn'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePassword123!'
            },
            mfaCode: {
              type: 'string',
              pattern: '^\\d{6}$',
              example: '123456',
              description: 'Required if MFA is enabled'
            }
          }
        },

        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'usr_123456' },
                    email: { type: 'string', example: 'doctor@hospital.vn' },
                    fullName: { type: 'string', example: 'Dr. Nguyen Van A' },
                    role: { $ref: '#/components/schemas/UserRole' },
                    isEmailVerified: { type: 'boolean', example: true },
                    isMfaEnabled: { type: 'boolean', example: false }
                  }
                }
              }
            },
            message: { type: 'string', example: 'Login successful' }
          }
        },

        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'patient@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePassword123!'
            },
            fullName: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              example: 'Nguyen Van B'
            },
            phoneNumber: {
              type: 'string',
              pattern: '^(\\+84|0)[0-9]{9,10}$',
              example: '+84901234567'
            }
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
              example: ['Email is required', 'Password must be at least 8 characters']
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


