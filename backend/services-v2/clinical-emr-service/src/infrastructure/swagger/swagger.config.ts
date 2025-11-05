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
      title: 'Clinical EMR Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Clinical EMR Service

Complete Electronic Medical Records (EMR) system with FHIR R4 compliance for Vietnamese healthcare facilities.

## Features
- ✅ Medical Records Management
- ✅ Clinical Notes & Documentation
- ✅ Diagnostic Reports
- ✅ Treatment Plans
- ✅ Prescriptions & Medications
- ✅ Lab Results
- ✅ Medical Imaging References
- ✅ FHIR R4 Compliance
- ✅ PHI Access Audit Logging
- ✅ HIPAA Compliance

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3027
- Production: https://api.hospital.vn

## Rate Limiting
- 50 requests per 15 minutes per IP (stricter for PHI data)
- 500 requests per hour per authenticated user

## FHIR R4 Compliance
This service implements FHIR R4 standards for healthcare data interoperability.
All clinical data can be exported in FHIR format.
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
        url: 'http://localhost:3027',
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
        name: 'Medical Records',
        description: 'Electronic Medical Records (EMR) management'
      },
      {
        name: 'Clinical Notes',
        description: 'Clinical documentation and notes'
      },
      {
        name: 'Diagnostic Reports',
        description: 'Lab, imaging, and pathology reports'
      },
      {
        name: 'Treatment Plans',
        description: 'Patient treatment planning'
      },
      {
        name: 'Prescriptions',
        description: 'Medication prescriptions and dispensing'
      },
      {
        name: 'Lab Results',
        description: 'Laboratory test results'
      },
      {
        name: 'Medical Imaging',
        description: 'Medical imaging references (X-ray, CT, MRI)'
      },
      {
        name: 'FHIR',
        description: 'FHIR R4 resources and export'
      },
      {
        name: 'Audit',
        description: 'PHI access audit logs'
      },
      {
        name: 'Statistics',
        description: 'Medical records statistics'
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
        // Clinical Note Types
        NoteType: {
          type: 'string',
          enum: ['PROGRESS', 'ADMISSION', 'DISCHARGE', 'CONSULTATION', 'PROCEDURE', 'OTHER']
        },
        NoteStatus: {
          type: 'string',
          enum: ['DRAFT', 'FINAL', 'AMENDED', 'COSIGNED']
        },
        // Diagnostic Report Types
        ReportType: {
          type: 'string',
          enum: ['LAB', 'IMAGING', 'PATHOLOGY', 'CARDIOLOGY', 'OTHER']
        },
        ReportStatus: {
          type: 'string',
          enum: ['PRELIMINARY', 'FINAL', 'AMENDED', 'CANCELLED']
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

