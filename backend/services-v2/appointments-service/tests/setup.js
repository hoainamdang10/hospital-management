"use strict";
/**
 * Test Setup Configuration
 * V2 Clean Architecture + DDD Implementation
 * Global test setup and configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONSTANTS = void 0;
exports.cleanupTestData = cleanupTestData;
const dotenv_1 = require("dotenv");
// Load test environment variables
(0, dotenv_1.config)({ path: '.env.test' });
// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.TZ = 'Asia/Ho_Chi_Minh'; // Vietnamese timezone
// Global test configuration
global.console = {
    ...console,
    // Suppress console.log during tests unless explicitly needed
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
};
// Global test timeout
jest.setTimeout(30000);
// Mock Date for consistent testing
const mockDate = new Date('2024-12-27T10:00:00.000Z');
const originalDate = Date;
beforeAll(() => {
    // Mock Date constructor
    global.Date = jest.fn((dateString) => {
        if (dateString) {
            return new originalDate(dateString);
        }
        return mockDate;
    });
    // Mock Date.now()
    global.Date.now = jest.fn(() => mockDate.getTime());
    // Mock Date.UTC()
    global.Date.UTC = originalDate.UTC;
    // Copy other Date methods
    Object.setPrototypeOf(global.Date, originalDate);
    Object.getOwnPropertyNames(originalDate).forEach(name => {
        if (name !== 'length' && name !== 'name' && name !== 'prototype') {
            global.Date[name] = originalDate[name];
        }
    });
});
afterAll(() => {
    // Restore original Date
    global.Date = originalDate;
});
// Custom Jest matchers
expect.extend({
    toBeValidDate(received) {
        const pass = received instanceof Date && !isNaN(received.getTime());
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid date`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid date`,
                pass: false,
            };
        }
    },
    toBeValidUUID(received) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pass = typeof received === 'string' && uuidRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false,
            };
        }
    },
    toBeValidVietnamesePhone(received) {
        const phoneRegex = /^0\d{9}$/;
        const pass = typeof received === 'string' && phoneRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid Vietnamese phone number`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid Vietnamese phone number (10 digits starting with 0)`,
                pass: false,
            };
        }
    },
    toBeValidVietnameseNationalId(received) {
        const nationalIdRegex = /^\d{9}(\d{3})?$/;
        const pass = typeof received === 'string' && nationalIdRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid Vietnamese national ID`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid Vietnamese national ID (9 or 12 digits)`,
                pass: false,
            };
        }
    },
    toMatchAppointmentIdPattern(received) {
        const appointmentIdRegex = /^[A-Z]{3,4}-\d{6}-\d{3}-[A-Z]{3}-\d{3}$/;
        const pass = typeof received === 'string' && appointmentIdRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to match appointment ID pattern`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to match appointment ID pattern (DEPT-YYYYMM-XXX-TYPE-XXX)`,
                pass: false,
            };
        }
    },
});
// Mock external dependencies
jest.mock('../../shared/infrastructure/database/optimized-supabase-client', () => {
    return {
        OptimizedSupabaseClient: jest.fn().mockImplementation(() => {
            const queryBuilder = {
                from: jest.fn().mockReturnThis(),
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
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: jest.fn().mockResolvedValue({ data: [], error: null })
            };
            return {
                query: jest.fn().mockReturnValue(queryBuilder),
                getConnectionStatus: jest.fn().mockResolvedValue({ connected: true }),
                close: jest.fn().mockResolvedValue(undefined)
            };
        })
    };
});
// Mock logger
jest.mock('../src/infrastructure/logging/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));
// Global test data constants
exports.TEST_CONSTANTS = {
    DATES: {
        MOCK_NOW: mockDate,
        TOMORROW: new Date(mockDate.getTime() + 24 * 60 * 60 * 1000),
        NEXT_WEEK: new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        YESTERDAY: new Date(mockDate.getTime() - 24 * 60 * 60 * 1000)
    },
    PATIENT: {
        ID: 'PAT-202412-001',
        NAME: 'Nguyễn Văn A',
        PHONE: '0123456789',
        DATE_OF_BIRTH: '1990-01-01',
        NATIONAL_ID: '123456789',
        EMAIL: 'patient@test.com'
    },
    PROVIDER: {
        ID: 'CARD-DOC-202412-001',
        NAME: 'Bác sĩ Trần Thị B',
        SPECIALIZATION: 'Tim mạch',
        DEPARTMENT: 'CARD',
        LICENSE: 'VN-TM-1234'
    },
    APPOINTMENT: {
        ROOM_ID: 'ROOM-001',
        REASON: 'Khám tim định kỳ',
        DURATION: 30,
        URGENCY_LEVEL: 'routine'
    }
};
// Test database cleanup utility
async function cleanupTestData() {
    // This would be implemented to clean up test data
    // For now, it's a placeholder since we're using mocks
    console.log('Cleaning up test data...');
}
// Setup and teardown hooks
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
});
afterEach(async () => {
    // Cleanup after each test
    await cleanupTestData();
});
// Vietnamese healthcare constants for testing
global.VIETNAMESE_HEALTHCARE_CONSTANTS = {
    TIMEZONE: 'Asia/Ho_Chi_Minh',
    CURRENCY: 'VND',
    LANGUAGE: 'vi-VN',
    BUSINESS_HOURS: { START: 7, END: 17 },
    INSURANCE_TYPES: ['BHYT', 'BHTN', 'PRIVATE'],
    APPOINTMENT_TYPES: ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'DIAGNOSTIC'],
    TEST_PATIENT: {
        ID: 'PAT-202501-001',
        NAME: 'Nguyễn Văn Test',
        PHONE: '0901234567',
        NATIONAL_ID: '123456789012',
        INSURANCE_NUMBER: 'HS4010123456789',
        INSURANCE_TYPE: 'BHYT'
    },
    TEST_PROVIDER: {
        ID: 'CARD-DOC-202501-001',
        NAME: 'BS. Nguyễn Văn Hùng',
        DEPARTMENT_CODE: 'CARD'
    }
};
// Vietnamese healthcare test utilities
global.vietnameseTestUtils = {
    generateVietnameseName: () => {
        const names = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thu Dung'];
        return names[Math.floor(Math.random() * names.length)];
    },
    generateVietnamesePhone: () => {
        const prefixes = ['090', '091', '094', '083'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return `${prefix}${suffix}`;
    },
    generateBHYTNumber: () => {
        const prefixes = ['HS40', 'DN12', 'HN01'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        return `${prefix}${suffix}`;
    },
    createVietnameseDate: (dateString) => {
        return new Date(`${dateString}+07:00`);
    },
    isVietnameseBusinessHours: (date) => {
        const hour = date.getHours();
        return hour >= 7 && hour < 17;
    }
};
console.log('✅ Test setup completed - Vietnamese Healthcare Compliance Enabled');
console.log(`📅 Mock date: ${mockDate.toISOString()}`);
console.log(`🧪 Test environment: ${process.env.NODE_ENV}`);
console.log(`🇻🇳 Vietnamese timezone: ${process.env.TZ}`);
//# sourceMappingURL=setup.js.map