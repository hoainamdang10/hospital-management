/**
 * ProviderStaff Aggregate - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { Specialization } from '../../../../src/domain/entities/Specialization';

describe('ProviderStaff Aggregate', () => {
  // Create valid specialization for doctor tests
  const validSpecialization = Specialization.create({
    code: 'CARDIO',
    name: 'Tim mạch',
    description: 'Chuyên khoa Tim mạch',
    isActive: true
  });

  // Helper function to create staff with default values
  const createTestStaff = (overrides: {
    userId?: string;
    staffType?: 'doctor' | 'nurse' | 'technician' | 'pharmacist';
    licenseNumber?: string;
    employmentType?: 'full-time' | 'part-time' | 'contract';
    hireDate?: Date;
    yearsOfExperience?: number;
    specializations?: Specialization[];
  } = {}) => {
    return ProviderStaff.create(
      overrides.userId || 'user-123',
      overrides.staffType || 'doctor',
      validPersonalInfo,
      validProfessionalInfo,
      validWorkSchedule,
      overrides.licenseNumber || 'BYS-12345',
      overrides.employmentType || 'full-time',
      overrides.hireDate || new Date('2025-01-01'),
      overrides.yearsOfExperience !== undefined ? overrides.yearsOfExperience : 15,
      overrides.specializations || [validSpecialization]
    );
  };

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Bác sĩ Nguyễn Văn Test',
    dateOfBirth: new Date('1985-01-01'),
    gender: 'male' as const,
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    phoneNumber: '0901234567',
    email: 'doctor@hospital.vn',
    address: {
      street: '123 Đường Test',
      ward: 'Phường 1',
      district: 'Quận 1',
      city: 'Hồ Chí Minh',
      province: 'Hồ Chí Minh',
      country: 'Vietnam'
    }
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    title: 'Bác sĩ',
    department: 'Khoa Tim mạch',
    position: 'Bác sĩ chính',
    education: ['Đại học Y Hà Nội', 'Chuyên khoa II Tim mạch'],
    languages: ['Vietnamese', 'English'],
    bio: 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm'
  });

  const validWorkSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  describe('create', () => {
    it('should create ProviderStaff with valid data', () => {
      // Arrange - Using individual parameters as per method signature
      const userId = 'user-123';
      const staffType = 'doctor' as const;
      const licenseNumber = 'BYS-12345';
      const employmentType = 'full-time' as const;
      const hireDate = new Date('2025-01-01');
      const yearsOfExperience = 15;
      const specializations = [validSpecialization];

      // Act
      const staff = ProviderStaff.create(
        userId,
        staffType,
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        licenseNumber,
        employmentType,
        hireDate,
        yearsOfExperience,
        specializations
      );

      // Assert
      expect(staff).toBeInstanceOf(ProviderStaff);
      expect(staff.id).toBeInstanceOf(StaffId);
      expect(staff.userId).toBe('user-123');
      expect(staff.staffType).toBe('doctor');
      expect(staff.licenseNumber).toBe('BYS-12345');
      expect(staff.isActive).toBe(true);
      expect(staff.yearsOfExperience).toBe(15);
    });

    it('should create staff with specializations', () => {
      // Arrange
      const specialization2 = Specialization.create({
        code: 'NEURO',
        name: 'Thần kinh',
        description: 'Chuyên khoa Thần kinh',
        isActive: true
      });

      const specializations = [validSpecialization, specialization2];

      // Act
      const staff = ProviderStaff.create(
        'user-123',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-12345',
        'full-time',
        new Date('2025-01-01'),
        15,
        specializations
      );

      // Assert
      expect(staff.specializations).toBeDefined();
      expect(staff.specializations.length).toBe(2);
      expect(staff.specializations[0].code).toBe('CARDIO');
      expect(staff.specializations[1].code).toBe('NEURO');
    });

    it('should generate StaffRegistered domain event', () => {
      // Act
      const staff = ProviderStaff.create(
        'user-123',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-12345',
        'full-time',
        new Date('2025-01-01'),
        15,
        [validSpecialization]
      );

      // Assert
      const events = staff.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('StaffRegistered');

      // Verify event data structure
      expect(events[0].eventData).toMatchObject({
        staffId: expect.any(String),
        userId: 'user-123',
        staffType: 'doctor'
      });
    });
  });

  describe('updatePersonalInfo', () => {
    it('should update personal info successfully', () => {
      // Arrange
      const staff = ProviderStaff.create(
        'user-123',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-12345',
        'full-time',
        new Date('2025-01-01'),
        15,
        [validSpecialization]
      );

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Bác sĩ Nguyễn Văn Test Updated',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        phoneNumber: '0987654321',
        email: 'doctor@hospital.vn',
        address: {
          street: '123 Đường Test',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      // Act
      staff.updatePersonalInfo(newPersonalInfo);

      // Assert
      expect(staff.personalInfo.phoneNumber).toBe('0987654321');
    });

    it('should generate StaffUpdated domain event', () => {
      // Arrange
      const staff = ProviderStaff.create(
        'user-123',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        'BYS-12345',
        'full-time',
        new Date('2025-01-01'),
        15,
        [validSpecialization]
      );

      staff.clearDomainEvents(); // Clear creation events

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Bác sĩ Nguyễn Văn Test Updated',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'male' as const,
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        phoneNumber: '0987654321',
        email: 'doctor@hospital.vn',
        address: {
          street: '123 Đường Test',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      // Act
      staff.updatePersonalInfo(newPersonalInfo);

      // Assert
      const events = staff.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.eventType === 'StaffUpdated')).toBe(true);
    });
  });

  describe('updateWorkSchedule', () => {
    it('should update work schedule successfully', () => {
      // Arrange
      const staff = createTestStaff();

      const newSchedule = WorkSchedule.create({
        workingDays: ['monday', 'wednesday', 'friday'] as const,
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: true
      });

      // Act
      staff.updateWorkSchedule(newSchedule);

      // Assert
      expect(staff.workSchedule.isFlexible).toBe(true);
      expect(staff.workSchedule.workingDays).toEqual(['monday', 'wednesday', 'friday']);
    });

    it('should generate StaffScheduleUpdated domain event', () => {
      // Arrange
      const staff = createTestStaff();
      staff.clearDomainEvents();

      const newSchedule = WorkSchedule.create({
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
        workingHours: {
          start: '08:00',
          end: '17:00'
        },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: true
      });

      // Act
      staff.updateWorkSchedule(newSchedule);

      // Assert
      const events = staff.getDomainEvents();
      expect(events.some(e => e.eventType === 'StaffScheduleUpdated')).toBe(true);
    });
  });

  describe('activate/deactivate', () => {
    it('should activate staff', () => {
      // Arrange
      const staff = createTestStaff();
      staff.deactivate('Nghỉ phép');

      // Act
      staff.activate();

      // Assert
      expect(staff.isActive).toBe(true);
    });

    it('should deactivate staff with reason', () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      staff.deactivate('Nghỉ phép dài hạn');

      // Assert
      expect(staff.isActive).toBe(false);
    });

    it('should generate StaffStatusChanged event on deactivation', () => {
      // Arrange
      const staff = createTestStaff();
      staff.clearDomainEvents();

      // Act
      staff.deactivate('Nghỉ phép');

      // Assert
      const events = staff.getDomainEvents();
      expect(events.some(e => e.eventType === 'StaffStatusChanged')).toBe(true);
    });
  });

  describe('business rules', () => {
    it('should enforce minimum years of experience', () => {
      // Arrange & Act & Assert
      expect(() => {
        createTestStaff({ yearsOfExperience: -1 });
      }).toThrow('Số năm kinh nghiệm không được âm');
    });

    it('should enforce valid license number format', () => {
      // Arrange & Act & Assert
      expect(() => {
        createTestStaff({ licenseNumber: '' });
      }).toThrow('Số giấy phép hành nghề không được để trống');
    });

    it('should enforce hire date not in future', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Act & Assert
      expect(() => {
        createTestStaff({ hireDate: futureDate });
      }).toThrow();
    });

    it('should enforce doctor must have at least one specialization', () => {
      // Arrange & Act & Assert
      expect(() => {
        createTestStaff({ specializations: [] });
      }).toThrow('Bác sĩ phải có ít nhất một chuyên khoa');
    });
  });

  describe('domain events', () => {
    it('should track domain events', () => {
      // Arrange & Act
      const staff = createTestStaff();

      // Assert
      const events = staff.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should clear domain events', () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      staff.clearDomainEvents();

      // Assert
      expect(staff.getDomainEvents().length).toBe(0);
    });
  });
});

