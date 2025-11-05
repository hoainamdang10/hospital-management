"use strict";
/**
 * Jest Setup Configuration
 * Global test setup for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest Testing, Environment Setup, Vietnamese Healthcare Testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = exports.TestDataFactory = void 0;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// Load test environment variables
(0, dotenv_1.config)({ path: (0, path_1.join)(__dirname, '../../.env.test') });
// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
// Database configuration for tests
process.env.SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key';
process.env.SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test_anon_key';
// JWT configuration for tests
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test_jwt_secret_key_for_billing_service';
// PayOS test configuration
process.env.PAYOS_CLIENT_ID = process.env.TEST_PAYOS_CLIENT_ID || 'test_payos_client_id';
process.env.PAYOS_API_KEY = process.env.TEST_PAYOS_API_KEY || 'test_payos_api_key';
process.env.PAYOS_CHECKSUM_KEY = process.env.TEST_PAYOS_CHECKSUM_KEY || 'test_payos_checksum_key';
process.env.PAYOS_ENVIRONMENT = 'sandbox';
process.env.PAYOS_WEBHOOK_URL = 'https://test.hospital.com/api/v1/billing/webhooks/payos';
// BHYT test configuration
process.env.BHYT_API_URL = process.env.TEST_BHYT_API_URL || 'https://sandbox-bhyt.gov.vn/api';
process.env.BHYT_API_KEY = process.env.TEST_BHYT_API_KEY || 'test_bhyt_api_key';
process.env.BHYT_FACILITY_CODE = process.env.TEST_BHYT_FACILITY_CODE || 'TEST_HOSPITAL_001';
// BHTN test configuration
process.env.BHTN_API_URL = process.env.TEST_BHTN_API_URL || 'https://sandbox-bhtn.gov.vn/api';
process.env.BHTN_API_KEY = process.env.TEST_BHTN_API_KEY || 'test_bhtn_api_key';
process.env.BHTN_FACILITY_CODE = process.env.TEST_BHTN_FACILITY_CODE || 'TEST_HOSPITAL_001';
// Redis test configuration
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
// RabbitMQ test configuration
process.env.RABBITMQ_URL = process.env.TEST_RABBITMQ_URL || 'amqp://localhost:5672';
// API Gateway configuration
process.env.API_GATEWAY_URL = process.env.TEST_API_GATEWAY_URL || 'http://localhost:3100';
// Service configuration
process.env.SERVICE_NAME = 'billing-service';
process.env.SERVICE_VERSION = '2.0.0';
process.env.SERVICE_PORT = '3009';
// Timezone configuration for Vietnamese healthcare
process.env.TZ = 'Asia/Ho_Chi_Minh';
// Global test timeout
jest.setTimeout(30000);
// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
beforeAll(() => {
    // Mock console methods but allow important test output
    console.error = jest.fn((message, ...args) => {
        if (typeof message === 'string' && message.includes('Test Error')) {
            originalConsoleError(message, ...args);
        }
    });
    console.warn = jest.fn((message, ...args) => {
        if (typeof message === 'string' && message.includes('Test Warning')) {
            originalConsoleWarn(message, ...args);
        }
    });
    console.log = jest.fn((message, ...args) => {
        if (typeof message === 'string' && message.includes('Test Log')) {
            originalConsoleLog(message, ...args);
        }
    });
});
afterAll(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
});
// Mock external services for unit tests
jest.mock('../../src/infrastructure/external/PayOSGatewayService', () => {
    return {
        PayOSGatewayService: jest.fn().mockImplementation(() => ({
            createPaymentLink: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    checkoutUrl: 'https://sandbox.payos.vn/payment/test123',
                    qrCode: 'data:image/png;base64,test_qr_code',
                    orderCode: 'INV-202412-000001',
                    amount: 500000
                }
            }),
            getPaymentStatus: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    orderCode: 'INV-202412-000001',
                    status: 'PENDING',
                    amount: 500000
                }
            }),
            cancelPayment: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    orderCode: 'INV-202412-000001',
                    status: 'CANCELLED'
                }
            }),
            verifyWebhookSignature: jest.fn().mockResolvedValue(true),
            healthCheck: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    service: 'payos-gateway',
                    status: 'healthy',
                    timestamp: new Date().toISOString()
                }
            })
        }))
    };
});
jest.mock('../../src/infrastructure/external/BHYTAPIService', () => {
    return {
        BHYTAPIService: jest.fn().mockImplementation(() => ({
            validateCard: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    isValid: true,
                    policyNumber: 'HS1234567890123',
                    beneficiaryName: 'NGUYEN VAN A',
                    coverageLevel: 0.8,
                    coPaymentRate: 0.2,
                    validFrom: new Date('2024-01-01'),
                    validTo: new Date('2024-12-31'),
                    region: '01',
                    warnings: [],
                    recommendations: ['Bệnh nhân được hưởng 80% chi phí điều trị']
                }
            }),
            submitClaim: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    claimId: 'BHYT-CLAIM-202412-001',
                    status: 'SUBMITTED',
                    claimAmount: 400000,
                    estimatedProcessingTime: '3-5 ngày làm việc'
                }
            }),
            getClaimStatus: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    claimId: 'BHYT-CLAIM-202412-001',
                    status: 'APPROVED',
                    approvedAmount: 400000,
                    lastUpdated: new Date()
                }
            }),
            healthCheck: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    service: 'bhyt-api',
                    status: 'healthy',
                    responseTime: 150
                }
            })
        }))
    };
});
jest.mock('../../src/infrastructure/external/BHTNAPIService', () => {
    return {
        BHTNAPIService: jest.fn().mockImplementation(() => ({
            validatePolicy: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    isValid: true,
                    policyNumber: 'TN1234567890123',
                    beneficiaryName: 'NGUYEN VAN D',
                    coverageLevel: 1.0,
                    coPaymentRate: 0.0,
                    validFrom: new Date('2024-01-01'),
                    validTo: new Date('2024-12-31'),
                    warnings: [],
                    recommendations: ['BHTN bao phủ 100% chi phí điều trị tai nạn lao động']
                }
            }),
            submitAccidentClaim: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    claimId: 'BHTN-CLAIM-202412-001',
                    status: 'SUBMITTED',
                    claimAmount: 18500000,
                    priority: 'HIGH'
                }
            }),
            submitDisabilityAssessment: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    assessmentId: 'BHTN-ASSESS-202412-001',
                    disabilityLevel: 25,
                    compensationAmount: 50000000,
                    monthlyAllowance: 2000000
                }
            }),
            healthCheck: jest.fn().mockResolvedValue({
                success: true,
                data: {
                    service: 'bhtn-api',
                    status: 'healthy',
                    responseTime: 200
                }
            })
        }))
    };
});
// Mock Supabase client for unit tests
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
            then: jest.fn().mockResolvedValue({ data: [], error: null })
        })),
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@hospital.com' } },
                error: null
            })
        }
    }))
}));
// Test data factories
exports.TestDataFactory = {
    createValidBillingAggregate: () => ({
        invoiceId: 'INV-202412-000001',
        patientId: 'PAT-202412-001',
        doctorId: 'CARD-DOC-202412-001',
        medicalRecordId: 'MR-202412-001',
        appointmentId: 'APT-202412-001',
        status: 'DRAFT',
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        insuranceCoverage: 0,
        patientPayment: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    }),
    createValidBillingItem: () => ({
        serviceCode: 'CONS001',
        serviceName: 'Khám tổng quát',
        quantity: 1,
        unitPrice: 500000,
        totalAmount: 500000,
        category: 'CONSULTATION',
        description: 'Khám sức khỏe tổng quát'
    }),
    createValidBHYTInsurance: () => ({
        type: 'BHYT',
        policyNumber: 'HS1234567890123',
        beneficiaryName: 'NGUYEN VAN A',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        region: '01',
        coverageLevel: 0.8
    }),
    createValidBHTNInsurance: () => ({
        type: 'BHTN',
        policyNumber: 'TN1234567890123',
        beneficiaryName: 'NGUYEN VAN D',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageLevel: 1.0
    }),
    createValidPayment: () => ({
        paymentMethod: 'CASH',
        amount: 500000,
        currency: 'VND',
        transactionId: 'CASH-001',
        processedAt: new Date(),
        status: 'COMPLETED'
    })
};
// Test utilities
exports.TestUtils = {
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    generateRandomInvoiceId: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
        return `INV-${year}${month}-${sequence}`;
    },
    generateRandomPatientId: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 999)).padStart(3, '0');
        return `PAT-${year}${month}-${sequence}`;
    },
    formatVNDAmount: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
};
//# sourceMappingURL=jest.setup.js.map