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
      title: 'Notifications Service API',
      version: '2.0.0',
      description: `
# Hospital Management System - Notifications Service

Multi-channel notification system for Vietnamese healthcare facilities.

## Features
-  Email Notifications (SendGrid)
-  SMS Notifications (Twilio)
-  In-App Notifications
-  Push Notifications
-  Template Management
-  Delivery Tracking
-  Notification Preferences
-  Batch Notifications
-  Event-Driven Architecture

## Authentication
All endpoints require JWT authentication via Bearer token:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Base URL
- Development: http://localhost:3031
- Production: https://api.hospital.vn

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Supported Channels
- **Email**: SendGrid integration
- **SMS**: Twilio integration
- **In-App**: Real-time notifications
- **Push**: Mobile push notifications
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
        url: 'http://localhost:3031',
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
        name: 'Email',
        description: 'Email notification operations'
      },
      {
        name: 'SMS',
        description: 'SMS notification operations'
      },
      {
        name: 'In-App',
        description: 'In-app notification operations'
      },
      {
        name: 'Push',
        description: 'Push notification operations'
      },
      {
        name: 'Templates',
        description: 'Notification template management'
      },
      {
        name: 'Delivery',
        description: 'Delivery tracking and status'
      },
      {
        name: 'Preferences',
        description: 'User notification preferences'
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
        // Notification Types
        NotificationChannel: {
          type: 'string',
          enum: ['EMAIL', 'SMS', 'IN_APP', 'PUSH']
        },
        NotificationStatus: {
          type: 'string',
          enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ']
        },
        NotificationPriority: {
          type: 'string',
          enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT']
        },
        // Template Types
        TemplateType: {
          type: 'string',
          enum: ['APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'LAB_RESULT', 'PRESCRIPTION', 'BILLING', 'GENERAL']
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

