/**
 * Test Setup - Provider/Staff Service
 * Global test configuration and utilities
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TZ = 'Asia/Ho_Chi_Minh';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test utilities
export class TestUtils {
  /**
   * Generate random staff ID
   */
  static generateRandomStaffId(): string {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STF-${year}${month}-${random}`;
  }

  /**
   * Generate random user ID
   */
  static generateRandomUserId(): string {
    return `user-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate random email
   */
  static generateRandomEmail(): string {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `test-${randomString}@hospital.test`;
  }

  /**
   * Generate random Vietnamese phone number
   */
  static generateRandomPhone(): string {
    const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${suffix}`;
  }

  /**
   * Generate random Vietnamese national ID (CCCD)
   */
  static generateRandomNationalId(): string {
    return Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
  }

  /**
   * Generate random license number
   */
  static generateRandomLicenseNumber(): string {
    const prefix = 'BYS';
    const number = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${number}`;
  }

  /**
   * Sleep utility
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for condition
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await TestUtils.sleep(interval);
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  /**
   * Format Vietnamese currency
   */
  static formatVNDAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}

// Test data factories
export class TestDataFactory {
  /**
   * Create valid staff registration data
   */
  static createValidStaffData(overrides: any = {}) {
    return {
      userId: overrides.userId || TestUtils.generateRandomUserId(),
      staffType: overrides.staffType || 'doctor',
      personalInfo: {
        fullName: overrides.fullName || 'Bác sĩ Nguyễn Văn Test',
        dateOfBirth: overrides.dateOfBirth || '1985-01-01',
        gender: overrides.gender || 'male',
        nationalId: overrides.nationalId || TestUtils.generateRandomNationalId(),
        phoneNumber: overrides.phoneNumber || TestUtils.generateRandomPhone(),
        email: overrides.email || TestUtils.generateRandomEmail()
      },
      professionalInfo: {
        licenseNumber: overrides.licenseNumber || TestUtils.generateRandomLicenseNumber(),
        specialization: overrides.specialization || 'Nội khoa',
        department: overrides.department || 'Khoa Nội',
        yearsOfExperience: overrides.yearsOfExperience || 10
      },
      ...overrides
    };
  }

  /**
   * Create valid doctor data
   */
  static createValidDoctorData(overrides: any = {}) {
    return TestDataFactory.createValidStaffData({
      ...overrides,
      staffType: 'doctor',
      professionalInfo: {
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        specialization: overrides.specialization || 'Tim mạch',
        department: overrides.department || 'Khoa Tim mạch',
        yearsOfExperience: overrides.yearsOfExperience || 15,
        consultationFee: overrides.consultationFee || 500000
      }
    });
  }

  /**
   * Create valid nurse data
   */
  static createValidNurseData(overrides: any = {}) {
    return TestDataFactory.createValidStaffData({
      ...overrides,
      staffType: 'nurse',
      professionalInfo: {
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        specialization: overrides.specialization || 'Điều dưỡng đa khoa',
        department: overrides.department || 'Khoa Nội',
        yearsOfExperience: overrides.yearsOfExperience || 5
      }
    });
  }

  /**
   * Create valid technician data
   */
  static createValidTechnicianData(overrides: any = {}) {
    return TestDataFactory.createValidStaffData({
      ...overrides,
      staffType: 'technician',
      professionalInfo: {
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        specialization: overrides.specialization || 'Kỹ thuật X-quang',
        department: overrides.department || 'Khoa Chẩn đoán hình ảnh',
        yearsOfExperience: overrides.yearsOfExperience || 7
      }
    });
  }

  /**
   * Create valid pharmacist data
   */
  static createValidPharmacistData(overrides: any = {}) {
    return TestDataFactory.createValidStaffData({
      ...overrides,
      staffType: 'pharmacist',
      professionalInfo: {
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        specialization: overrides.specialization || 'Dược lâm sàng',
        department: overrides.department || 'Khoa Dược',
        yearsOfExperience: overrides.yearsOfExperience || 8
      }
    });
  }

  /**
   * Create work schedule data
   */
  static createWorkScheduleData(overrides: any = {}) {
    return {
      monday: overrides.monday || { start: '08:00', end: '17:00', isWorking: true },
      tuesday: overrides.tuesday || { start: '08:00', end: '17:00', isWorking: true },
      wednesday: overrides.wednesday || { start: '08:00', end: '17:00', isWorking: true },
      thursday: overrides.thursday || { start: '08:00', end: '17:00', isWorking: true },
      friday: overrides.friday || { start: '08:00', end: '17:00', isWorking: true },
      saturday: overrides.saturday || { start: '08:00', end: '12:00', isWorking: true },
      sunday: overrides.sunday || { isWorking: false }
    };
  }

  /**
   * Create credential data
   */
  static createCredentialData(overrides: any = {}) {
    return {
      credentialType: overrides.credentialType || 'medical_license',
      credentialNumber: overrides.credentialNumber || TestUtils.generateRandomLicenseNumber(),
      issuedBy: overrides.issuedBy || 'Bộ Y tế',
      issuedDate: overrides.issuedDate || '2015-01-01',
      expiryDate: overrides.expiryDate || '2025-01-01',
      documentUrl: overrides.documentUrl || 'https://example.com/credential.pdf'
    };
  }
}

// Mock logger for tests
export const createMockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn()
});

// Export for use in tests
export { dotenv };

