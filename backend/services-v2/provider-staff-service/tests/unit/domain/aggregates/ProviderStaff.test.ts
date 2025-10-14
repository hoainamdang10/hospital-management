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

describe('ProviderStaff Aggregate', () => {
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
      // Arrange
      const staffData = {
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      };

      // Act
      const staff = ProviderStaff.create(staffData);

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
      const staffData = {
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15,
        specializations: [
          {
            code: 'CARDIO',
            name: 'Tim mạch',
            description: 'Chuyên khoa Tim mạch',
            isActive: true
          }
        ]
      };

      // Act
      const staff = ProviderStaff.create(staffData);

      // Assert
      expect(staff.specializations).toBeDefined();
      expect(staff.specializations.length).toBe(1);
    });

    it('should generate StaffRegistered domain event', () => {
      // Arrange
      const staffData = {
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      };

      // Act
      const staff = ProviderStaff.create(staffData);

      // Assert
      const events = staff.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('StaffRegistered');
    });
  });

  describe('updatePersonalInfo', () => {
    it('should update personal info successfully', () => {
      // Arrange
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      const newPersonalInfo = PersonalInfo.create({
        ...validPersonalInfo,
        phoneNumber: '0987654321'
      });

      // Act
      staff.updatePersonalInfo(newPersonalInfo);

      // Assert
      expect(staff.personalInfo.phoneNumber).toBe('0987654321');
    });

    it('should generate StaffUpdated domain event', () => {
      // Arrange
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      staff.clearDomainEvents(); // Clear creation events

      const newPersonalInfo = PersonalInfo.create({
        ...validPersonalInfo,
        phoneNumber: '0987654321'
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
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

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
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      staff.clearDomainEvents();

      const newSchedule = WorkSchedule.create({
        ...validWorkSchedule,
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
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      staff.deactivate('Nghỉ phép');

      // Act
      staff.activate();

      // Assert
      expect(staff.isActive).toBe(true);
    });

    it('should deactivate staff with reason', () => {
      // Arrange
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      // Act
      staff.deactivate('Nghỉ phép dài hạn');

      // Assert
      expect(staff.isActive).toBe(false);
    });

    it('should generate StaffStatusChanged event on deactivation', () => {
      // Arrange
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

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
        ProviderStaff.create({
          userId: 'user-123',
          staffType: 'doctor' as const,
          personalInfo: validPersonalInfo,
          professionalInfo: validProfessionalInfo,
          workSchedule: validWorkSchedule,
          licenseNumber: 'BYS-12345',
          employmentType: 'full-time' as const,
          hireDate: new Date('2025-01-01'),
          yearsOfExperience: -1 // Invalid
        });
      }).toThrow();
    });

    it('should enforce valid license number format', () => {
      // Arrange & Act & Assert
      expect(() => {
        ProviderStaff.create({
          userId: 'user-123',
          staffType: 'doctor' as const,
          personalInfo: validPersonalInfo,
          professionalInfo: validProfessionalInfo,
          workSchedule: validWorkSchedule,
          licenseNumber: '', // Empty
          employmentType: 'full-time' as const,
          hireDate: new Date('2025-01-01'),
          yearsOfExperience: 15
        });
      }).toThrow();
    });

    it('should enforce hire date not in future', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // Act & Assert
      expect(() => {
        ProviderStaff.create({
          userId: 'user-123',
          staffType: 'doctor' as const,
          personalInfo: validPersonalInfo,
          professionalInfo: validProfessionalInfo,
          workSchedule: validWorkSchedule,
          licenseNumber: 'BYS-12345',
          employmentType: 'full-time' as const,
          hireDate: futureDate,
          yearsOfExperience: 15
        });
      }).toThrow();
    });
  });

  describe('domain events', () => {
    it('should track domain events', () => {
      // Arrange & Act
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      // Assert
      const events = staff.getDomainEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should clear domain events', () => {
      // Arrange
      const staff = ProviderStaff.create({
        userId: 'user-123',
        staffType: 'doctor' as const,
        personalInfo: validPersonalInfo,
        professionalInfo: validProfessionalInfo,
        workSchedule: validWorkSchedule,
        licenseNumber: 'BYS-12345',
        employmentType: 'full-time' as const,
        hireDate: new Date('2025-01-01'),
        yearsOfExperience: 15
      });

      // Act
      staff.clearDomainEvents();

      // Assert
      expect(staff.getDomainEvents().length).toBe(0);
    });
  });
});

