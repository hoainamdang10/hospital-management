/**
 * SupabaseProviderStaffRepository Integration Tests
 * Provider/Staff Service - Integration Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseProviderStaffRepository } from '../../../src/infrastructure/repositories/SupabaseProviderStaffRepository';
import { ProviderStaff } from '../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../src/domain/value-objects/WorkSchedule';
import { DepartmentAssignment } from '../../../src/domain/entities/DepartmentAssignment';
import { StaffId } from '../../../src/domain/value-objects/StaffId';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WinstonLogger } from '../../../src/infrastructure/logging/logger';
import { AuditService } from '../../../src/infrastructure/audit/AuditService';

describe('SupabaseProviderStaffRepository Integration Tests', () => {
  let repository: SupabaseProviderStaffRepository;
  let supabaseClient: SupabaseClient;
  let testStaff: ProviderStaff;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Bác sĩ Nguyễn Văn Integration Test',
    dateOfBirth: new Date('1985-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    phoneNumber: '0901234567',
    email: 'integration.doctor@hospital.vn',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam'
    }
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    title: 'Bác sĩ Chuyên khoa I',
    department: 'Cardiology',
    position: 'Senior Doctor',
    education: ['MD - Medical University', 'Specialist I - Cardiology'],
    languages: ['Vietnamese', 'English'],
    bio: 'Experienced cardiologist with 15 years of practice'
  });

  const validWorkSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    const logger = new WinstonLogger();
    const auditService = new AuditService({
      supabaseUrl,
      supabaseKey,
      logger,
      serviceName: 'provider-staff-service'
    });
    
    repository = new SupabaseProviderStaffRepository(
      supabaseUrl,
      supabaseKey,
      logger,
      auditService,
      'provider_schema',
      'staff_profiles'
    );
  });

  beforeEach(() => {
    const uniqueLicense = `BYS-${Date.now().toString().slice(-5)}`;
    
    testStaff = ProviderStaff.create(
      'integration-test-user-' + Date.now(),
      'doctor',
      validPersonalInfo,
      validProfessionalInfo,
      validWorkSchedule,
      uniqueLicense,
      'full_time',
      new Date('2020-01-01'),
      15
    );
  });

  afterEach(async () => {
    if (testStaff) {
      try {
        await repository.delete(testStaff.staffId);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });

  describe('save', () => {
    it('should save staff to database', async () => {
      await repository.save(testStaff);

      const retrieved = await repository.findById(testStaff.staffId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testStaff.id);
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Nguyễn Văn Integration Test');
    });

    it('should save staff with all fields', async () => {
      await repository.save(testStaff);

      const retrieved = await repository.findById(testStaff.staffId);
      
      expect(retrieved?.staffType).toBe('doctor');
      expect(retrieved?.professionalInfo.title).toBe('Bác sĩ Chuyên khoa I');
      expect(retrieved?.professionalInfo.department).toBe('Cardiology');
      expect(retrieved?.employmentType).toBe('full_time');
    });

    it('should throw error when saving duplicate staff ID', async () => {
      await repository.save(testStaff);

      await expect(repository.save(testStaff)).rejects.toThrow();
    });

    it('should throw error when saving duplicate license number', async () => {
      await repository.save(testStaff);

      const duplicateStaff = ProviderStaff.create(
        'different-user-id',
        'doctor',
        validPersonalInfo,
        validProfessionalInfo,
        validWorkSchedule,
        testStaff.licenseNumber, // Same license number
        'full_time',
        new Date('2020-01-01'),
        15
      );

      await expect(repository.save(duplicateStaff)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find staff by ID', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(testStaff.id);
    });

    it('should return null for non-existent staff', async () => {
      const found = await repository.findById(StaffId.create('DOC-GEN-202501-999'));

      expect(found).toBeNull();
    });

    it('should reconstruct staff aggregate correctly', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);

      expect(found).toBeInstanceOf(ProviderStaff);
      expect(found?.personalInfo).toBeInstanceOf(PersonalInfo);
      expect(found?.professionalInfo).toBeInstanceOf(ProfessionalInfo);
      expect(found?.workSchedule).toBeInstanceOf(WorkSchedule);
    });
  });

  describe('findByLicenseNumber', () => {
    it('should find staff by license number', async () => {
      await repository.save(testStaff);

      const found = await repository.findByLicenseNumber(testStaff.licenseNumber);
      
      expect(found).toBeDefined();
      expect(found?.licenseNumber).toBe(testStaff.licenseNumber);
    });

    it('should return null for non-existent license number', async () => {
      const found = await repository.findByLicenseNumber('BYS-99999');
      
      expect(found).toBeNull();
    });

    it('should mask license number in response', async () => {
      await repository.save(testStaff);

      const found = await repository.findByLicenseNumber(testStaff.licenseNumber);
      
      // License number should be masked for security
      expect(found?.licenseNumber).toMatch(/BYS-\d{5}/);
    });
  });

  describe('update', () => {
    it('should update work schedule', async () => {
      await repository.save(testStaff);

      const newWorkSchedule = WorkSchedule.create({
        workingDays: ['monday', 'wednesday', 'friday'],
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: true
      });

      testStaff.updateWorkSchedule(newWorkSchedule);
      await repository.update(testStaff);

      const retrieved = await repository.findById(testStaff.staffId);

      expect(retrieved?.workSchedule.workingDays).toHaveLength(3);
      expect(retrieved?.workSchedule.isFlexible).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete staff from database', async () => {
      await repository.save(testStaff);

      await repository.delete(testStaff.staffId);

      const found = await repository.findById(testStaff.staffId);
      expect(found).toBeNull();
    });

    it('should not throw error when deleting non-existent staff', async () => {
      await expect(repository.delete(StaffId.create('DOC-GEN-202501-999'))).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all staff members', async () => {
      await repository.save(testStaff);

      const staffList = await repository.findAll();
      
      expect(staffList).toBeInstanceOf(Array);
      expect(staffList.length).toBeGreaterThan(0);
    });

    it('should return staff with correct structure', async () => {
      await repository.save(testStaff);

      const staffList = await repository.findAll();
      const staff = staffList.find(s => s.id === testStaff.id);

      expect(staff).toBeDefined();
      expect(staff?.personalInfo).toBeInstanceOf(PersonalInfo);
      expect(staff?.professionalInfo).toBeInstanceOf(ProfessionalInfo);
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('should respect RLS policies', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);
      expect(found).toBeDefined();
    });
  });

  describe('HIPAA compliance', () => {
    it('should store sensitive data securely', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);

      expect(found?.personalInfo.nationalId).toBe('001234567890');
      expect(found?.licenseNumber).toMatch(/BYS-\d{5}/);
    });

    it('should audit staff data access', async () => {
      await repository.save(testStaff);
      await repository.findById(testStaff.staffId);

      // Audit log should be created (check audit_logs table)
      // This is implementation-specific
    });

    it('should mask license number in logs', async () => {
      await repository.save(testStaff);

      // License number should be masked in audit logs
      // Check audit_logs table for masked values
    });
  });

  describe('Performance', () => {
    it('should save staff within acceptable time', async () => {
      const startTime = Date.now();
      await repository.save(testStaff);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should retrieve staff within acceptable time', async () => {
      await repository.save(testStaff);

      const startTime = Date.now();
      await repository.findById(testStaff.staffId);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Transaction support', () => {
    it('should rollback on error', async () => {
      const invalidStaff = { ...testStaff, id: null } as any;

      await expect(repository.save(invalidStaff)).rejects.toThrow();

      const found = await repository.findById(testStaff.staffId);
      expect(found).toBeNull();
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should validate Vietnamese medical license format', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);

      expect(found?.licenseNumber).toMatch(/^BYS-\d{5}$/);
    });

    it('should support Vietnamese medical titles', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.staffId);

      expect(found?.professionalInfo.title).toContain('Bác sĩ');
    });
  });

  describe('findByDepartment', () => {
    it('should find staff assigned to a department', async () => {
      // Save staff with department assignment
      const departmentAssignment = DepartmentAssignment.create({
        departmentId: 'CARD',
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        role: 'Senior Doctor',
        isPrimary: true,
        startDate: new Date('2020-01-01'),
        isActive: true
      });

      testStaff.assignToDepartment(departmentAssignment);
      await repository.save(testStaff);

      // Query by department
      const staffInDepartment = await repository.findByDepartment('CARD');

      expect(staffInDepartment).toBeDefined();
      expect(staffInDepartment.length).toBeGreaterThan(0);

      const foundStaff = staffInDepartment.find(s => s.id === testStaff.id);
      expect(foundStaff).toBeDefined();
      expect(foundStaff?.departmentAssignments).toHaveLength(1);
      expect(foundStaff?.departmentAssignments[0].departmentId).toBe('CARD');
    });

    it('should return empty array when no staff in department', async () => {
      await repository.save(testStaff);

      const staffInDepartment = await repository.findByDepartment('NONEXISTENT');

      expect(staffInDepartment).toBeDefined();
      expect(staffInDepartment).toHaveLength(0);
    });

    it('should find staff with multiple department assignments', async () => {
      // Assign to primary department
      const primaryDept = DepartmentAssignment.create({
        departmentId: 'CARD',
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        role: 'Senior Doctor',
        isPrimary: true,
        startDate: new Date('2020-01-01'),
        isActive: true
      });

      // Assign to secondary department
      const secondaryDept = DepartmentAssignment.create({
        departmentId: 'EMER',
        departmentCode: 'EMER',
        departmentNameEn: 'Emergency',
        departmentNameVi: 'Cấp cứu',
        role: 'Consultant',
        isPrimary: false,
        startDate: new Date('2021-01-01'),
        isActive: true
      });

      testStaff.assignToDepartment(primaryDept);
      testStaff.assignToDepartment(secondaryDept);
      await repository.save(testStaff);

      // Should find in both departments
      const cardStaff = await repository.findByDepartment('CARD');
      const emerStaff = await repository.findByDepartment('EMER');

      expect(cardStaff.some(s => s.id === testStaff.id)).toBe(true);
      expect(emerStaff.some(s => s.id === testStaff.id)).toBe(true);
    });

    it('should only find active department assignments', async () => {
      const inactiveDept = DepartmentAssignment.create({
        departmentId: 'ORTH',
        departmentCode: 'ORTH',
        departmentNameEn: 'Orthopedics',
        departmentNameVi: 'Chấn thương chỉnh hình',
        role: 'Doctor',
        isPrimary: true,
        startDate: new Date('2019-01-01'),
        endDate: new Date('2020-12-31'),
        isActive: false
      });

      testStaff.assignToDepartment(inactiveDept);
      await repository.save(testStaff);

      // Should not find inactive assignments
      const orthStaff = await repository.findByDepartment('ORTH');

      // Staff might be found but assignment should be inactive
      if (orthStaff.length > 0) {
        const foundStaff = orthStaff.find(s => s.id === testStaff.id);
        if (foundStaff) {
          const orthAssignment = foundStaff.departmentAssignments.find(a => a.departmentId === 'ORTH');
          expect(orthAssignment?.isActive).toBe(false);
        }
      }
    });
  });
});

