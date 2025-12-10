import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger Configuration for API Gateway
 * Provides OpenAPI 3.0 documentation for all microservices
 */
export const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management System API Gateway',
      version: '2.0.0',
      description: `
        API Gateway cho Hospital Management System V2 - Clean Architecture
        
        ## Tính năng chính:
        -  Authentication & Authorization (JWT)
        -  Patient Management
        -  Provider/Staff Management
        -  Appointments & Scheduling
        -  Clinical EMR (FHIR R4)
        -  Billing & Payments
        -  Notifications
        -  Job Scheduling
        
        ## Authentication:
        Tất cả các endpoint (trừ /api/v1/auth/*) yêu cầu JWT token trong header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Rate Limiting:
        - Global: 1000 requests/15 phút
        - Per User: 500 requests/15 phút
        - Sensitive endpoints (login, register): 3-5 requests/15 phút
      `,
      contact: {
        name: 'Hospital Management Team',
        email: 'support@hospital-management.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3101',
        description: 'Development server'
      },
      {
        url: 'http://api-gateway:3101',
        description: 'Docker internal network'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token từ Identity Service (/api/v1/auth/login)'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Lỗi hệ thống'
            },
            code: {
              type: 'string',
              example: 'INTERNAL_ERROR'
            },
            requestId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  service: {
                    type: 'string',
                    example: 'identity-service'
                  },
                  healthy: {
                    type: 'boolean',
                    example: true
                  },
                  url: {
                    type: 'string',
                    example: 'http://identity-service:3021'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Chưa đăng nhập hoặc token không hợp lệ',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Không có quyền truy cập',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Bạn không có quyền truy cập tài nguyên này',
                code: 'FORBIDDEN'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Health Check',
        description: 'Kiểm tra trạng thái hệ thống và services'
      },
      {
        name: 'Authentication',
        description: 'Đăng nhập, đăng ký, quản lý phiên (Identity Service)'
      },
      {
        name: 'Patients',
        description: 'Quản lý bệnh nhân (Patient Registry Service)'
      },
      {
        name: 'Providers',
        description: 'Quản lý bác sĩ/nhân viên (Provider/Staff Service)'
      },
      {
        name: 'Appointments',
        description: 'Đặt lịch hẹn và quản lý lịch khám (Appointments Service)'
      },
      {
        name: 'Clinical EMR',
        description: 'Hồ sơ bệnh án điện tử - FHIR R4 (Clinical EMR Service)'
      },
      {
        name: 'Billing',
        description: 'Hóa đơn và thanh toán (Billing Service)'
      },
      {
        name: 'Notifications',
        description: 'Thông báo đa kênh (Notifications Service)'
      },
      {
        name: 'Scheduler',
        description: 'Quản lý scheduled jobs (Scheduler Service)'
      }
    ]
  },
  apis: ['./src/presentation/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

