import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { baseOpenAPIConfig } from '@hospital/shared/dist/config/openapi.config';
import { doctorSchemas, doctorPaths } from '@hospital/shared/dist/schemas/doctor.schemas';

/**
 * Swagger/OpenAPI 3.0 configuration for API Gateway
 */
const swaggerOptions = {
  definition: {
    ...baseOpenAPIConfig,
    info: {
      ...baseOpenAPIConfig.info,
      title: 'Hospital Management API Gateway',
      description: `
# 🏥 Hospital Management System API Gateway

**Cổng API trung tâm** cho hệ thống quản lý bệnh viện với kiến trúc microservices.

## 🌟 Tính năng chính

### 🔐 **Authentication & Authorization**
- JWT Bearer token authentication
- Role-based access control (Doctor, Patient, Admin)
- Session management
- Password reset & email verification

### 👨‍⚕️ **Doctor Management**
- Quản lý hồ sơ bác sĩ
- Lịch làm việc và ca trực
- Kinh nghiệm và chuyên môn
- Đánh giá từ bệnh nhân

### 🏥 **Patient Management**
- Đăng ký và quản lý bệnh nhân
- Hồ sơ y tế
- Lịch sử khám bệnh

### 📅 **Appointment System**
- Đặt lịch hẹn online
- Quản lý lịch hẹn
- Xác nhận và hủy lịch
- Thông báo real-time

### 🏢 **Department & Specialty**
- Quản lý khoa phòng
- Chuyên khoa y tế
- Phòng khám và thiết bị

### 💳 **Payment Integration**
- Thanh toán tiền mặt
- PayOS integration
- VNPay (coming soon)
- Hóa đơn điện tử

## 🚀 **API Versioning**

API hỗ trợ versioning qua:
- Header: \`X-API-Version: v2\`
- URL path: \`/api/v2/doctors\`
- Accept header: \`application/vnd.hospital.v2+json\`

**Phiên bản hiện tại:** v2.0.0  
**Phiên bản được hỗ trợ:** v1, v2

## 🇻🇳 **Vietnamese Support**

Tất cả API responses và error messages đều hỗ trợ **tiếng Việt**:
- Validation errors: "Email phải là email hợp lệ"
- Business logic errors: "Bác sĩ không có lịch"
- System errors: "Lỗi hệ thống"

## 📱 **Real-time Features**

- WebSocket connections cho notifications
- Live appointment updates
- Doctor availability status
- Patient queue management

## 🔒 **Security**

- Rate limiting: 1000 requests/15 minutes
- Request ID tracing
- Input sanitization
- CORS protection
- Helmet security headers

## 📊 **Monitoring**

- Health checks: \`/health\`
- Metrics: \`/metrics\` (Prometheus format)
- Service status: \`/services\`

---

**🏥 Phát triển bởi:** Hospital Management Team  
**📧 Liên hệ:** admin@hospital.com  
**📖 Tài liệu:** [API Documentation](/docs)
      `
    },
    // Merge schemas from shared config
    components: {
      ...baseOpenAPIConfig.components,
      schemas: {
        ...baseOpenAPIConfig.components?.schemas,
        ...doctorSchemas
      }
    }
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    '../doctor-service/src/routes/*.ts',
    '../auth-service/src/routes/*.ts',
    '../patient-service/src/routes/*.ts',
    '../appointment-service/src/routes/*.ts',
    '../department-service/src/routes/*.ts'
  ]
};

/**
 * Generate OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions) as any;

// Add doctor paths to the spec
if (swaggerSpec.paths) {
  Object.assign(swaggerSpec.paths, doctorPaths);
} else {
  swaggerSpec.paths = doctorPaths;
}

/**
 * Setup Swagger UI for API Gateway
 */
export function setupSwagger(app: Express) {
  // Swagger UI options
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { 
        display: none; 
      }
      .swagger-ui .info .title {
        color: #0ea5e9;
      }
      .swagger-ui .scheme-container {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      .swagger-ui .btn.authorize {
        background-color: #10b981;
        border-color: #10b981;
      }
      .swagger-ui .btn.authorize:hover {
        background-color: #059669;
        border-color: #059669;
      }
    `,
    customSiteTitle: 'Hospital Management API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true
    }
  };

  // Serve Swagger UI
  app.use('/docs', swaggerUi.serve);
  app.get('/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve OpenAPI spec as JSON
  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger UI available at: /docs');
  console.log('📄 OpenAPI JSON spec at: /openapi.json');
}

/**
 * Add OpenAPI documentation to existing routes
 */
export function addOpenAPIDocumentation() {
  return {
    // Health check documentation
    healthCheck: {
      tags: ['Health'],
      summary: 'Kiểm tra trạng thái API Gateway',
      description: 'Endpoint để kiểm tra trạng thái hoạt động của API Gateway và các dependencies',
      responses: {
        '200': {
          description: 'API Gateway hoạt động bình thường',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/HealthCheckResponse'
              }
            }
          }
        },
        '503': {
          description: 'API Gateway hoặc dependencies gặp sự cố',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/HealthCheckResponse'
              }
            }
          }
        }
      }
    },

    // Service status documentation
    serviceStatus: {
      tags: ['Health'],
      summary: 'Trạng thái các microservices',
      description: 'Kiểm tra trạng thái của tất cả microservices trong hệ thống',
      responses: {
        '200': {
          description: 'Trạng thái các services',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      gateway: { $ref: '#/components/schemas/HealthCheckResponse' },
                      auth: { $ref: '#/components/schemas/HealthCheckResponse' },
                      doctor: { $ref: '#/components/schemas/HealthCheckResponse' },
                      patient: { $ref: '#/components/schemas/HealthCheckResponse' },
                      appointment: { $ref: '#/components/schemas/HealthCheckResponse' },
                      department: { $ref: '#/components/schemas/HealthCheckResponse' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Metrics documentation
    metrics: {
      tags: ['Monitoring'],
      summary: 'Prometheus metrics',
      description: 'Endpoint cung cấp metrics cho Prometheus monitoring',
      responses: {
        '200': {
          description: 'Prometheus metrics',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: `# HELP api_gateway_requests_total Total number of requests
# TYPE api_gateway_requests_total counter
api_gateway_requests_total{method="GET",status="200"} 1234

# HELP api_gateway_request_duration_seconds Request duration in seconds
# TYPE api_gateway_request_duration_seconds histogram
api_gateway_request_duration_seconds_bucket{le="0.1"} 100
api_gateway_request_duration_seconds_bucket{le="0.5"} 200
api_gateway_request_duration_seconds_bucket{le="1.0"} 300`
              }
            }
          }
        }
      }
    }
  };
}

/**
 * Validate OpenAPI specification
 */
export function validateOpenAPISpec() {
  try {
    // Basic validation
    if (!swaggerSpec.openapi) {
      throw new Error('Missing OpenAPI version');
    }
    
    if (!swaggerSpec.info || !swaggerSpec.info.title || !swaggerSpec.info.version) {
      throw new Error('Missing required info fields');
    }

    if (!swaggerSpec.paths || Object.keys(swaggerSpec.paths).length === 0) {
      console.warn('⚠️ No API paths defined in OpenAPI spec');
    }

    console.log('✅ OpenAPI specification is valid');
    console.log(`📋 API Title: ${swaggerSpec.info.title}`);
    console.log(`🔢 API Version: ${swaggerSpec.info.version}`);
    console.log(`📊 Total paths: ${Object.keys(swaggerSpec.paths || {}).length}`);
    console.log(`📦 Total schemas: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);
    
    return true;
  } catch (error) {
    console.error('❌ OpenAPI specification validation failed:', error);
    return false;
  }
}

/**
 * Export OpenAPI spec for other services
 */
export { swaggerSpec as openAPISpec };
