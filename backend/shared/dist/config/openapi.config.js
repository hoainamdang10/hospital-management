"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalSchemas = exports.baseOpenAPIConfig = void 0;
/**
 * Shared OpenAPI 3.0 configuration for Hospital Management System
 */
exports.baseOpenAPIConfig = {
    openapi: '3.0.0',
    info: {
        title: 'Hospital Management System API',
        version: '2.0.0',
        description: `
# 🏥 Hospital Management System API

Hệ thống quản lý bệnh viện với kiến trúc microservices, hỗ trợ:

- **Quản lý bác sĩ** - Doctor Service (Port 3002)
- **Xác thực người dùng** - Auth Service (Port 3001) 
- **Quản lý bệnh nhân** - Patient Service (Port 3003)
- **Đặt lịch hẹn** - Appointment Service (Port 3004)
- **Quản lý khoa** - Department Service (Port 3005)
- **Hồ sơ y tế** - Medical Records Service (Port 3006)
- **Thanh toán** - Payment Service (Port 3008)

## 🌐 API Gateway
Tất cả requests đều đi qua API Gateway tại port **3100**.

## 🔐 Authentication
Sử dụng JWT Bearer token trong header Authorization.

## 📱 Versioning
API hỗ trợ versioning qua header \`X-API-Version\` hoặc URL path \`/api/v1/\`, \`/api/v2/\`.

## 🇻🇳 Vietnamese Support
Tất cả error messages và responses đều hỗ trợ tiếng Việt.
    `,
        contact: {
            name: 'Hospital Management System',
            email: 'admin@hospital.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:3100',
            description: 'API Gateway - Development'
        },
        {
            url: 'http://localhost:3001',
            description: 'Auth Service - Direct'
        },
        {
            url: 'http://localhost:3002',
            description: 'Doctor Service - Direct'
        },
        {
            url: 'http://localhost:3003',
            description: 'Patient Service - Direct'
        },
        {
            url: 'http://localhost:3004',
            description: 'Appointment Service - Direct'
        },
        {
            url: 'http://localhost:3005',
            description: 'Department Service - Direct'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token từ Auth Service'
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API Key cho service-to-service communication'
            }
        },
        parameters: {
            // Pagination parameters
            PageParam: {
                name: 'page',
                in: 'query',
                description: 'Số trang (bắt đầu từ 1)',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    default: 1,
                    example: 1
                }
            },
            LimitParam: {
                name: 'limit',
                in: 'query',
                description: 'Số lượng items per page',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 20,
                    example: 20
                }
            },
            SearchParam: {
                name: 'search',
                in: 'query',
                description: 'Từ khóa tìm kiếm',
                schema: {
                    type: 'string',
                    maxLength: 100,
                    example: 'Nguyễn'
                }
            },
            // API Versioning
            ApiVersionHeader: {
                name: 'X-API-Version',
                in: 'header',
                description: 'Phiên bản API',
                schema: {
                    type: 'string',
                    enum: ['v1', 'v2'],
                    default: 'v2',
                    example: 'v2'
                }
            },
            // Request ID for tracing
            RequestIdHeader: {
                name: 'X-Request-ID',
                in: 'header',
                description: 'Request ID để trace requests',
                schema: {
                    type: 'string',
                    example: '1640995200000-abc123def'
                }
            }
        },
        schemas: {
            // Standard API Response
            StandardApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Trạng thái thành công',
                        example: true
                    },
                    data: {
                        description: 'Dữ liệu response'
                    },
                    error: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'Thông báo lỗi',
                                example: 'Dữ liệu không hợp lệ'
                            },
                            code: {
                                type: 'string',
                                description: 'Mã lỗi',
                                example: 'VALIDATION_ERROR'
                            },
                            details: {
                                description: 'Chi tiết lỗi'
                            }
                        }
                    },
                    pagination: {
                        $ref: '#/components/schemas/Pagination'
                    },
                    meta: {
                        type: 'object',
                        properties: {
                            timestamp: {
                                type: 'string',
                                format: 'date-time',
                                description: 'Thời gian response',
                                example: '2025-01-01T12:00:00.000Z'
                            },
                            requestId: {
                                type: 'string',
                                description: 'Request ID',
                                example: '1640995200000-abc123def'
                            },
                            version: {
                                type: 'string',
                                description: 'Phiên bản service',
                                example: '1.0.0'
                            },
                            service: {
                                type: 'string',
                                description: 'Tên service',
                                example: 'Hospital Doctor Service'
                            }
                        }
                    }
                }
            },
            // Pagination
            Pagination: {
                type: 'object',
                properties: {
                    page: {
                        type: 'integer',
                        description: 'Trang hiện tại',
                        example: 1
                    },
                    limit: {
                        type: 'integer',
                        description: 'Số items per page',
                        example: 20
                    },
                    total: {
                        type: 'integer',
                        description: 'Tổng số items',
                        example: 100
                    },
                    totalPages: {
                        type: 'integer',
                        description: 'Tổng số trang',
                        example: 5
                    },
                    hasNext: {
                        type: 'boolean',
                        description: 'Có trang tiếp theo',
                        example: true
                    },
                    hasPrev: {
                        type: 'boolean',
                        description: 'Có trang trước',
                        example: false
                    }
                }
            },
            // Health Check Response
            HealthCheckResponse: {
                type: 'object',
                properties: {
                    service: {
                        type: 'string',
                        description: 'Tên service',
                        example: 'Hospital Doctor Service'
                    },
                    status: {
                        type: 'string',
                        enum: ['healthy', 'unhealthy', 'degraded'],
                        description: 'Trạng thái service',
                        example: 'healthy'
                    },
                    version: {
                        type: 'string',
                        description: 'Phiên bản service',
                        example: '1.0.0'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Thời gian check',
                        example: '2025-01-01T12:00:00.000Z'
                    },
                    uptime: {
                        type: 'number',
                        description: 'Thời gian hoạt động (seconds)',
                        example: 3600
                    },
                    environment: {
                        type: 'string',
                        description: 'Môi trường',
                        example: 'development'
                    },
                    dependencies: {
                        type: 'object',
                        description: 'Trạng thái các dependencies',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                status: {
                                    type: 'string',
                                    enum: ['healthy', 'unhealthy']
                                },
                                responseTime: {
                                    type: 'number',
                                    description: 'Response time (ms)'
                                },
                                error: {
                                    type: 'string',
                                    description: 'Error message nếu có'
                                }
                            }
                        }
                    },
                    features: {
                        type: 'object',
                        description: 'Các tính năng được hỗ trợ',
                        additionalProperties: {
                            oneOf: [
                                { type: 'boolean' },
                                { type: 'string' }
                            ]
                        }
                    },
                    memory: {
                        type: 'object',
                        properties: {
                            used: {
                                type: 'number',
                                description: 'Memory đã sử dụng (bytes)'
                            },
                            total: {
                                type: 'number',
                                description: 'Tổng memory (bytes)'
                            },
                            percentage: {
                                type: 'number',
                                description: 'Phần trăm memory sử dụng'
                            }
                        }
                    }
                }
            },
            // Error Response
            ErrorResponse: {
                allOf: [
                    { $ref: '#/components/schemas/StandardApiResponse' },
                    {
                        type: 'object',
                        properties: {
                            success: {
                                type: 'boolean',
                                enum: [false]
                            },
                            data: {
                                type: 'null'
                            },
                            error: {
                                type: 'object',
                                required: ['message'],
                                properties: {
                                    message: {
                                        type: 'string',
                                        description: 'Thông báo lỗi tiếng Việt'
                                    },
                                    code: {
                                        type: 'string',
                                        description: 'Mã lỗi'
                                    },
                                    details: {
                                        description: 'Chi tiết lỗi'
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },
        responses: {
            // Common error responses
            BadRequest: {
                description: 'Dữ liệu không hợp lệ',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: {
                            success: false,
                            data: null,
                            error: {
                                message: 'Dữ liệu không hợp lệ',
                                code: 'VALIDATION_ERROR',
                                details: [
                                    {
                                        field: 'email',
                                        message: 'Email phải là email hợp lệ'
                                    }
                                ]
                            },
                            meta: {
                                timestamp: '2025-01-01T12:00:00.000Z',
                                requestId: '1640995200000-abc123def',
                                version: '1.0.0',
                                service: 'Hospital Management API'
                            }
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Yêu cầu xác thực',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: {
                            success: false,
                            data: null,
                            error: {
                                message: 'Yêu cầu xác thực',
                                code: 'UNAUTHORIZED'
                            }
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Không có quyền truy cập',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Không tìm thấy',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Lỗi hệ thống',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            ServiceUnavailable: {
                description: 'Dịch vụ không khả dụng',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
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
            name: 'Authentication',
            description: '🔐 Xác thực và quản lý người dùng'
        },
        {
            name: 'Doctors',
            description: '👨‍⚕️ Quản lý bác sĩ'
        },
        {
            name: 'Patients',
            description: '🏥 Quản lý bệnh nhân'
        },
        {
            name: 'Appointments',
            description: '📅 Quản lý lịch hẹn'
        },
        {
            name: 'Departments',
            description: '🏢 Quản lý khoa'
        },
        {
            name: 'Medical Records',
            description: '📋 Hồ sơ y tế'
        },
        {
            name: 'Payments',
            description: '💳 Thanh toán'
        },
        {
            name: 'Health',
            description: '❤️ Health checks'
        }
    ]
};
/**
 * Common OpenAPI schemas for Hospital entities
 */
exports.hospitalSchemas = {
    // Vietnamese phone number pattern
    VietnamesePhone: {
        type: 'string',
        pattern: '^0[0-9]{9}$',
        description: 'Số điện thoại Việt Nam (10 số bắt đầu bằng 0)',
        example: '0123456789'
    },
    // Vietnamese license number pattern
    VietnameseLicense: {
        type: 'string',
        pattern: '^VN-[A-Z]{2}-[0-9]{4}$',
        description: 'Số giấy phép Việt Nam (VN-XX-YYYY)',
        example: 'VN-TM-1234'
    },
    // Gender enum
    Gender: {
        type: 'string',
        enum: ['male', 'female', 'other'],
        description: 'Giới tính',
        example: 'male'
    },
    // Appointment status
    AppointmentStatus: {
        type: 'string',
        enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        description: 'Trạng thái lịch hẹn',
        example: 'scheduled'
    }
};
//# sourceMappingURL=openapi.config.js.map