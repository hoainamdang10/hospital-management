/**
 * Jest Setup File
 * Global test configuration and mocks
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables from .env file
config();

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => '00000000-0000-0000-0000-000000000000')
}));

// Set timezone to UTC for consistent date testing
process.env.TZ = 'UTC';

/**
 * Test Utilities
 */
export class TestUtils {
  static generateRandomStaffId(): string {
    const types = ['DOC', 'NUR', 'TEC', 'PHA', 'THE', 'ADM', 'REC'];
    const type = types[Math.floor(Math.random() * types.length)];
    const dept = 'TEST';
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const seq = Math.floor(Math.random() * 999) + 1;
    const seqStr = seq.toString().padStart(3, '0');
    return `${type}-${dept}-${year}${month}-${seqStr}`;
  }

  static generateRandomUserId(): string {
    return randomUUID();
  }

  static generateRandomEmail(): string {
    return `test-${randomUUID()}@hospital-test.vn`;
  }

  static generateRandomPhone(): string {
    const random = Math.floor(Math.random() * 900000000) + 100000000;
    return `09${random.toString().substring(0, 8)}`;
  }

  static generateRandomNationalId(): string {
    const prefixes = ['001', '002', '004', '005', '007'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomPart = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return `${prefix}${randomPart}`.substring(0, 12);
  }

  static generateRandomLicenseNumber(): string {
    const sequence = Math.floor(Math.random() * 90000) + 10000;
    return `BYS-${sequence}`;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async waitFor(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start <= timeoutMs) {
      const result = await predicate();
      if (result) {
        return;
      }
      await TestUtils.sleep(intervalMs);
    }

    throw new Error('Timeout waiting for condition');
  }

  static formatVNDAmount(amount: number): string {
    const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
    return `${safeAmount.toLocaleString('vi-VN')} VND`;
  }
}

/**
 * Test Data Factory
 */
export class TestDataFactory {
  static createStaffData(overrides: any = {}) {
    return this.createValidStaffData(overrides);
  }

  static createValidStaffData(overrides: any = {}) {
    return this.createBaseStaffData(overrides);
  }

  static createValidDoctorData(overrides: any = {}) {
    return this.createBaseStaffData({
      staffType: 'doctor',
      title: 'Bác sĩ',
      position: 'Bác sĩ điều trị',
      department: 'Khoa Nội tổng quát',
      consultationFee: overrides.consultationFee ?? 500000,
      ...overrides
    });
  }

  static createValidNurseData(overrides: any = {}) {
    return this.createBaseStaffData({
      staffType: 'nurse',
      title: 'Điều dưỡng',
      position: 'Điều dưỡng viên',
      consultationFee: overrides.consultationFee ?? 0,
      specializations: [],
      ...overrides
    });
  }

  static createValidTechnicianData(overrides: any = {}) {
    return this.createBaseStaffData({
      staffType: 'technician',
      title: 'Kỹ thuật viên',
      position: 'KTV xét nghiệm',
      consultationFee: overrides.consultationFee ?? 0,
      specializations: [],
      ...overrides
    });
  }

  static createValidPharmacistData(overrides: any = {}) {
    return this.createBaseStaffData({
      staffType: 'pharmacist',
      title: 'Dược sĩ',
      position: 'Quản lý dược phẩm',
      consultationFee: overrides.consultationFee ?? 0,
      specializations: [],
      ...overrides
    });
  }

  static createWorkScheduleData(overrides: any = {}) {
    const workingHours = overrides.workingHours || {};

    return {
      workingDays: overrides.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: workingHours.start || '08:00',
        end: workingHours.end || '17:00'
      },
      timeZone: overrides.timeZone || 'Asia/Ho_Chi_Minh',
      isFlexible: overrides.isFlexible ?? false
    };
  }

  static createCredentialData(overrides: any = {}) {
    return {
      credentialType: overrides.credentialType || 'medical_license',
      credentialNumber: overrides.credentialNumber || `CRED-${Date.now()}`,
      issuedBy: overrides.issuedBy || 'Bộ Y tế',
      issuedDate: this.normalizeDate(overrides.issuedDate || new Date()),
      expiryDate: overrides.expiryDate ? this.normalizeDate(overrides.expiryDate) : undefined,
      documentUrl: overrides.documentUrl || 'https://storage.test/credential.pdf'
    };
  }

  private static createBaseStaffData(overrides: any = {}) {
    const personalInfoOverrides = overrides.personalInfo || {};
    const addressOverrides = overrides.address || personalInfoOverrides.address || {};
    const professionalOverrides = overrides.professionalInfo || {};
    const workScheduleOverrides = overrides.workSchedule || {};

    const staffType = overrides.staffType || professionalOverrides.staffType || 'doctor';

    const personalInfo = {
      fullName: overrides.fullName || personalInfoOverrides.fullName || 'Test Staff',
      dateOfBirth: this.normalizeDate(overrides.dateOfBirth || personalInfoOverrides.dateOfBirth || '1985-01-01'),
      gender: overrides.gender || personalInfoOverrides.gender || 'male',
      nationalId: overrides.nationalId || personalInfoOverrides.nationalId || TestUtils.generateRandomNationalId(),
      nationality: overrides.nationality || personalInfoOverrides.nationality || 'Vietnamese',
      phoneNumber: overrides.phoneNumber || personalInfoOverrides.phoneNumber || TestUtils.generateRandomPhone(),
      email: overrides.email || personalInfoOverrides.email || TestUtils.generateRandomEmail(),
      address: {
        street: overrides.street || addressOverrides.street || '123 Test St',
        ward: overrides.ward || addressOverrides.ward || 'Ward 1',
        district: overrides.district || addressOverrides.district || 'District 1',
        city: overrides.city || addressOverrides.city || 'Ho Chi Minh',
        province: overrides.province || addressOverrides.province || 'Ho Chi Minh',
        country: overrides.country || addressOverrides.country || 'Vietnam'
      }
    };

    const professionalInfo = {
      title: overrides.title || professionalOverrides.title || 'Bác sĩ',
      department: overrides.department || professionalOverrides.department || 'Khoa Nội tổng quát',
      position: overrides.position || professionalOverrides.position || 'Bác sĩ điều trị',
      education: overrides.education || professionalOverrides.education || ['Doctor of Medicine'],
      languages: overrides.languages || professionalOverrides.languages || ['Vietnamese', 'English'],
      bio: overrides.bio || professionalOverrides.bio
    };

    const workingDays = overrides.workingDays || workScheduleOverrides.workingDays;
    const workingHoursOverrides = overrides.workingHours || workScheduleOverrides.workingHours || {};

    const workSchedule = {
      workingDays: workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: {
        start: workingHoursOverrides.start || '08:00',
        end: workingHoursOverrides.end || '17:00'
      },
      timeZone: overrides.timeZone || workScheduleOverrides.timeZone || 'Asia/Ho_Chi_Minh',
      isFlexible: overrides.isFlexible ?? workScheduleOverrides.isFlexible ?? false
    };

    const specializations =
      overrides.specializations ||
      professionalOverrides.specializations ||
      (staffType === 'doctor'
        ? [
            {
              code: overrides.specializationCode || 'CARD',
              name: overrides.specialization || 'Tim mạch',
              description: overrides.specializationDescription || 'Chuyên khoa Tim mạch',
              isActive: true
            }
          ]
        : []);

    return {
      userId: overrides.userId || personalInfoOverrides.userId || TestUtils.generateRandomUserId(),
      staffType,
      personalInfo,
      professionalInfo,
      workSchedule,
      licenseNumber: overrides.licenseNumber || professionalOverrides.licenseNumber || TestUtils.generateRandomLicenseNumber(),
      employmentType: overrides.employmentType || overrides.employment?.employmentType || 'full_time',
      hireDate: this.normalizeDate(overrides.hireDate || overrides.employment?.hireDate || new Date()),
      contractEndDate: overrides.contractEndDate
        ? this.normalizeDate(overrides.contractEndDate)
        : overrides.employment?.contractEndDate
        ? this.normalizeDate(overrides.employment.contractEndDate)
        : undefined,
      yearsOfExperience: overrides.yearsOfExperience ?? professionalOverrides.yearsOfExperience ?? 5,
      consultationFee: overrides.consultationFee ?? professionalOverrides.consultationFee ?? (staffType === 'doctor' ? 500000 : 0),
      specializations,
      vietnameseHealthcareLicense:
        overrides.vietnameseHealthcareLicense ?? professionalOverrides.vietnameseHealthcareLicense,
      mohRegistrationNumber:
        overrides.mohRegistrationNumber ?? professionalOverrides.mohRegistrationNumber
    };
  }

  private static normalizeDate(value: any): string {
    if (!value) {
      return new Date().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }

    return new Date(value).toISOString();
  }
}
