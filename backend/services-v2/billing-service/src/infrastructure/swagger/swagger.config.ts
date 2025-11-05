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
      title: 'Billing Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Billing Service

Complete billing and payment management system for Vietnamese healthcare facilities.

## Features
- ✅ Invoice Generation & Management
- ✅ Payment Processing (Cash, Card, Bank Transfer)
- ✅ Insurance Claims (BHYT/BHTN)
- ✅ Refund Processing
- ✅ Payment History Tracking
- ✅ Revenue Statistics & Reports
- ✅ Vietnamese Payment Gateway Integration
- ✅ Multi-currency Support (VND primary)
- ✅ Event-Driven Architecture

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3029
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
        url: 'http://localhost:3029',
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
        name: 'Invoices',
        description: 'Invoice generation and management'
      },
      {
        name: 'Payments',
        description: 'Payment processing operations'
      },
      {
        name: 'Insurance Claims',
        description: 'BHYT/BHTN insurance claims management'
      },
      {
        name: 'Refunds',
        description: 'Refund processing'
      },
      {
        name: 'Statistics',
        description: 'Revenue statistics and analytics'
      },
      {
        name: 'Reports',
        description: 'Financial reports generation'
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
        // Invoice Types
        InvoiceStatus: {
          type: 'string',
          enum: ['DRAFT', 'FINALIZED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'REFUNDED']
        },
        // Payment Types
        PaymentMethod: {
          type: 'string',
          enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'MOMO', 'VNPAY', 'ZALOPAY']
        },
        PaymentStatus: {
          type: 'string',
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
        },
        // Insurance Types
        InsuranceType: {
          type: 'string',
          enum: ['BHYT', 'BHTN', 'PRIVATE', 'NONE']
        },
        ClaimStatus: {
          type: 'string',
          enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']
        },
        // Currency
        Currency: {
          type: 'string',
          enum: ['VND', 'USD'],
          default: 'VND'
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

