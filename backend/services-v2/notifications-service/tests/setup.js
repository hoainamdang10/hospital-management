"use strict";
/**
 * Test Setup Configuration
 * Global test setup with Vietnamese healthcare context and mocks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Testing Best Practices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = exports.generateVietnameseTestData = exports.mockSocketIOClient = exports.mockSocketIOServer = exports.mockRabbitMQConnection = exports.mockSupabaseClient = exports.VIETNAMESE_HEALTHCARE_CONSTANTS = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load test environment variables
dotenv_1.default.config({ path: '.env.test' });
// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
// Mock console methods to reduce test output noise
const originalConsole = { ...console };
beforeAll(() => {
    // Mock console methods but keep error for debugging
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();
    // Keep console.error for debugging test failures
});
afterAll(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
});
// Global test timeout
jest.setTimeout(30000);
// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:00:00.000Z');
const originalDate = Date;
beforeEach(() => {
    // Reset Date mock before each test
    global.Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
    global.Date.prototype = originalDate.prototype;
});
afterEach(() => {
    // Restore Date after each test
    global.Date = originalDate;
    jest.clearAllMocks();
});
// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.FRONTEND_URL = 'http://localhost:3000';
// Vietnamese healthcare test constants
exports.VIETNAMESE_HEALTHCARE_CONSTANTS = {
    PATIENT_ID: 'PAT-202401-001',
    DOCTOR_ID: 'CARD-DOC-202401-001',
    APPOINTMENT_ID: 'APT-202401-000001',
    MEDICAL_RECORD_ID: 'MED-202401-000001',
    INVOICE_ID: 'INV-202401-000001',
    NOTIFICATION_ID: 'NOT-202401-000001',
    PATIENT_NAME: 'Nguyễn Văn An',
    DOCTOR_NAME: 'BS. Trần Thị Bình',
    HOSPITAL_NAME: 'Bệnh viện Đa khoa Thành phố',
    PHONE_NUMBER: '0901234567',
    EMAIL: 'patient@hospital.com',
    APPOINTMENT_DATE: '2024-01-20',
    APPOINTMENT_TIME: '14:30',
    ROOM_NUMBER: 'P.101',
    VIETNAMESE_MESSAGES: {
        APPOINTMENT_REMINDER: 'Nhắc nhở lịch hẹn khám',
        TEST_RESULTS_READY: 'Kết quả xét nghiệm đã có',
        PAYMENT_REMINDER: 'Nhắc nhở thanh toán viện phí',
        EMERGENCY_ALERT: 'Cảnh báo khẩn cấp',
        MEDICATION_REMINDER: 'Nhắc nhở uống thuốc'
    }
};
// Mock Supabase client
exports.mockSupabaseClient = {
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    auth: {
        getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@hospital.com' } },
            error: null
        })
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null })
};
// Mock RabbitMQ connection
exports.mockRabbitMQConnection = {
    createChannel: jest.fn().mockResolvedValue({
        assertExchange: jest.fn().mockResolvedValue({}),
        assertQueue: jest.fn().mockResolvedValue({}),
        bindQueue: jest.fn().mockResolvedValue({}),
        consume: jest.fn().mockResolvedValue({}),
        publish: jest.fn().mockResolvedValue(true),
        ack: jest.fn(),
        nack: jest.fn(),
        prefetch: jest.fn().mockResolvedValue({}),
        close: jest.fn().mockResolvedValue({})
    }),
    close: jest.fn().mockResolvedValue({})
};
// Mock Socket.IO server
exports.mockSocketIOServer = {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn()
};
// Mock Socket.IO client
exports.mockSocketIOClient = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'test-socket-id'
};
// Vietnamese healthcare test data generators
exports.generateVietnameseTestData = {
    patient: () => ({
        patientId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        fullName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        phoneNumber: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PHONE_NUMBER,
        email: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.EMAIL,
        dateOfBirth: '1990-05-15',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        insuranceNumber: 'BHYT123456789'
    }),
    doctor: () => ({
        doctorId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
        fullName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
        specialization: 'Tim mạch',
        licenseNumber: 'VN-TM-1234',
        phoneNumber: '0987654321',
        email: 'doctor@hospital.com'
    }),
    appointment: () => ({
        appointmentId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID,
        patientId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        doctorId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
        appointmentDate: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_DATE,
        appointmentTime: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_TIME,
        roomNumber: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.ROOM_NUMBER,
        status: 'SCHEDULED',
        notes: 'Khám định kỳ'
    }),
    notification: () => ({
        notificationId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.NOTIFICATION_ID,
        recipientId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        status: 'DRAFT',
        templateData: {
            patientName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
            doctorName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
            appointmentDate: '20/01/2024',
            appointmentTime: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_TIME,
            roomNumber: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.ROOM_NUMBER,
            hospitalName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.HOSPITAL_NAME
        },
        metadata: {
            healthcareContext: {
                patientId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
                doctorId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
                appointmentId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID
            },
            tags: ['appointment', 'reminder'],
            source: 'APPOINTMENT_SERVICE'
        },
        createdAt: mockDate,
        updatedAt: mockDate
    }),
    integrationEvent: () => ({
        eventId: 'evt-202401-000001',
        eventType: 'AppointmentScheduled',
        aggregateId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID,
        aggregateType: 'Appointment',
        serviceName: 'scheduling-service',
        eventVersion: '1.0',
        eventData: {
            appointmentId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID,
            patientId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
            doctorId: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
            patientName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
            doctorName: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
            appointmentDate: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_DATE,
            appointmentTime: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_TIME,
            roomNumber: exports.VIETNAMESE_HEALTHCARE_CONSTANTS.ROOM_NUMBER
        },
        occurredAt: mockDate,
        version: 1,
        metadata: {
            correlationId: 'corr-202401-000001',
            userId: 'user-123',
            source: 'scheduling-service'
        }
    })
};
// Test utilities
exports.testUtils = {
    // Wait for async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    // Generate random Vietnamese name
    generateVietnameseName: () => {
        const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
        const middleNames = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Thanh', 'Quang', 'Hữu', 'Đức', 'Anh', 'Thu'];
        const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hà', 'Linh', 'Mai', 'Nam'];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${middleName} ${lastName}`;
    },
    // Generate Vietnamese phone number
    generateVietnamesePhone: () => {
        const prefixes = ['090', '091', '094', '083', '084', '085', '081', '082'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return `${prefix}${suffix}`;
    },
    // Validate Vietnamese text
    isVietnameseText: (text) => {
        const vietnameseRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\d.,!?()-]+$/;
        return vietnameseRegex.test(text);
    }
};
// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
exports.default = {
    VIETNAMESE_HEALTHCARE_CONSTANTS: exports.VIETNAMESE_HEALTHCARE_CONSTANTS,
    mockSupabaseClient: exports.mockSupabaseClient,
    mockRabbitMQConnection: exports.mockRabbitMQConnection,
    mockSocketIOServer: exports.mockSocketIOServer,
    mockSocketIOClient: exports.mockSocketIOClient,
    generateVietnameseTestData: exports.generateVietnameseTestData,
    testUtils: exports.testUtils
};
//# sourceMappingURL=setup.js.map