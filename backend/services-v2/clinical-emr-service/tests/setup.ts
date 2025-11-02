/**
 * Jest Test Setup - Clinical EMR Service
 * Global setup for all tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test if exists, otherwise .env
const envPath = resolve(__dirname, '../.env.test');
config({ path: envPath });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TZ = 'Asia/Ho_Chi_Minh';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(), // Silence console.log
  debug: jest.fn(), // Silence console.debug
  info: jest.fn(), // Silence console.info
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Global test utilities
global.testUtils = {
  /**
   * Generate a random UUID for testing
   */
  generateUUID: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate a random medical record ID
   */
  generateMedicalRecordId: (): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 900 + 100);
    return `REC-${year}${month}-${random}`;
  },

  /**
   * Generate a random patient ID
   */
  generatePatientId: (): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 900 + 100);
    return `PAT-${year}${month}-${random}`;
  },

  /**
   * Generate a random doctor ID
   */
  generateDoctorId: (): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 900 + 100);
    return `HOSP-DOC-${year}${month}-${random}`;
  },

  /**
   * Generate a random treatment plan ID
   */
  generateTreatmentPlanId: (): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 900 + 100);
    return `PLAN-${year}${month}-${random}`;
  },

  /**
   * Sleep for specified milliseconds
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Create a future date
   */
  futureDate: (daysFromNow: number = 7): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  },

  /**
   * Create a past date
   */
  pastDate: (daysAgo: number = 7): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  },
};

// Global type declarations
declare global {
  var testUtils: {
    generateUUID: () => string;
    generateMedicalRecordId: () => string;
    generatePatientId: () => string;
    generateDoctorId: () => string;
    generateTreatmentPlanId: () => string;
    sleep: (ms: number) => Promise<void>;
    futureDate: (daysFromNow?: number) => Date;
    pastDate: (daysAgo?: number) => Date;
  };

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      SUPABASE_URL?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      SUPABASE_JWT_SECRET?: string;
      JWT_SECRET?: string;
      DATABASE_SCHEMA?: string;
      REDIS_URL?: string;
      RABBITMQ_URL?: string;
    }
  }
}

// Setup global mocks
beforeAll(() => {
  // Mock Date.now() for consistent timestamps in tests if needed
  // jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-01T00:00:00.000Z').getTime());
});

// Cleanup after all tests
afterAll(() => {
  // Restore all mocks
  jest.restoreAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

export {};
