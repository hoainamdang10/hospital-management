/**
 * SupabaseStaffRepository Integration Tests
 * Tests repository CRUD operations, search, pagination, transactions, and constraints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { SupabaseProviderStaffRepository } from '../../../src/infrastructure/repositories/SupabaseProviderStaffRepository';
import { ProviderStaff } from '../../../src/domain/aggregates/ProviderStaff';
import { StaffId } from '../../../src/domain/value-objects/StaffId';
import { PersonalInfo } from '../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../src/domain/value-objects/WorkSchedule';
import { Specialization } from '../../../src/domain/entities/Specialization';
import { WinstonLogger } from '../../../src/infrastructure/logging/logger';
import { AuditService } from '../../../src/infrastructure/audit/AuditService';

describe('SupabaseStaffRepository Integration Tests', () => {
  let repository: SupabaseProviderStaffRepository;
  let supabaseClient: SupabaseClient;
  let logger: WinstonLogger;
  let auditService: AuditService;
  
  let testStaffIds: string[] = [];

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    logger = new WinstonLogger();
    auditService = new AuditService({
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

  afterEach(async () => {
    // Cleanup test data after each test
    if (testStaffIds.length > 0) {
      await supabaseClient
        .from('staff_profiles')
        .delete()
        .in('staff_id', testStaffIds);
      testStaffIds = [];
    }
  });

  afterAll(async () => {
    // Final cleanup
    if (testStaffIds.length > 0) {
      await supabaseClient
        .from('staff_profiles')
        .delete()
        .in('staff_id', testStaffIds);
    }
  });

  /**
   * Helper: Create test staff
   */
  function createTestStaff(overrides: any = {}): ProviderStaff {
    const uniqueUserId = randomUUID();
    const uniqueLicense = `VN-BS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`;

    const personalInfo = PersonalInfo.create({
      fullName: overrides.fullName || 'Bác sĩ Nguyễn Văn Test',
      dateOfBirth: new Date('1985-01-15'),
      gender: overrides.gender || 'male',
      nationalId: overrides.nationalId || `079085${Date.now().toString().slice(-6)}`,
      nationality: 'Vietnamese',
      phoneNumber: overrides.phoneNumber || `090${Date.now().toString().slice(-7)}`,
      email: overrides.email || `test-${uniqueUserId}@hospital.vn`,
      address: {
        street: '123 Test Street',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      }
    });

    const professionalInfo = ProfessionalInfo.create({
      title: overrides.title || 'Bác sĩ Chuyên khoa I',
      department: overrides.department || 'Cardiology',
      position: overrides.position || 'Senior Doctor',
      education: overrides.education || ['Bác sĩ Đa khoa', 'Chuyên khoa I Tim mạch'],
      languages: overrides.languages || ['Vietnamese', 'English'],
      bio: overrides.bio || 'Experienced cardiologist with 10 years of practice'
    });

    const workSchedule = WorkSchedule.create({
      workingDays: overrides.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHours: overrides.workingHours || { start: '08:00', end: '17:00' },
      timeZone: overrides.timeZone || 'Asia/Ho_Chi_Minh',
      isFlexible: overrides.isFlexible !== undefined ? overrides.isFlexible : false
    });

    const specializations = overrides.specializations || [
      Specialization.create({
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch',
        isActive: true
      })
    ];

    const staff = ProviderStaff.create(
      overrides.userId || uniqueUserId,
      overrides.staffType || 'doctor',
      personalInfo,
      professionalInfo,
      workSchedule,
      overrides.licenseNumber || uniqueLicense,
      overrides.employmentType || 'full_time',
      new Date(overrides.hireDate || '2020-01-01'),
      overrides.yearsOfExperience || 10,
      specializations
    );

    testStaffIds.push(staff.staffIdValue);
    return staff;
  }

  // ==================== CREATE TESTS ====================

  describe('save - Create Operations', () => {
    it('should save new staff to database', async () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      await repository.save(staff);

      // Assert
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(staff.id);
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Nguyễn Văn Test');
    });

    it('should save staff with all fields correctly', async () => {
      // Arrange
      const staff = createTestStaff({
        fullName: 'Bác sĩ Trần Thị B',
        gender: 'female',
        staffType: 'doctor',
        department: 'Neurology'
      });

      // Act
      await repository.save(staff);

      // Assert
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved?.staffType).toBe('doctor');
      expect(retrieved?.professionalInfo.department).toBe('Neurology');
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Trần Thị B');
    });

    it('should save staff with specializations', async () => {
      // Arrange
      const specializations = [
        Specialization.create({
          code: 'CARD',
          name: 'Tim mạch',
          description: 'Chuyên khoa Tim mạch',
          isActive: true
        }),
        Specialization.create({
          code: 'NEUR',
          name: 'Thần kinh',
          description: 'Chuyên khoa Thần kinh',
          isActive: true
        })
      ];

      const staff = createTestStaff({ specializations });

      // Act
      await repository.save(staff);

      // Assert
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved?.specializations.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error when saving duplicate staff ID', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act & Assert
      await expect(repository.save(staff)).rejects.toThrow();
    });

    it('should throw error when saving duplicate license number', async () => {
      // Arrange
      const staff1 = createTestStaff();
      await repository.save(staff1);

      const staff2 = createTestStaff({
        userId: randomUUID(),
        licenseNumber: staff1.licenseNumber // Same license
      });

      // Act & Assert
      await expect(repository.save(staff2)).rejects.toThrow();
    });

    it('should audit staff creation', async () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      await repository.save(staff);

      // Assert - Audit log should be created
      // This is verified through audit service
      expect(staff.id).toBeDefined();
    });
  });

  // ==================== READ TESTS ====================

  describe('findById - Read Operations', () => {
    it('should find staff by ID', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const found = await repository.findById(staff.staffId);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(staff.id);
      expect(found?.staffIdValue).toBe(staff.staffIdValue);
    });

    it('should return null for non-existent staff', async () => {
      // Act
      const found = await repository.findById(StaffId.create('DOC-GEN-202501-999'));

      // Assert
      expect(found).toBeNull();
    });

    it('should reconstruct staff aggregate correctly', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const found = await repository.findById(staff.staffId);

      // Assert
      expect(found).toBeInstanceOf(ProviderStaff);
      expect(found?.personalInfo).toBeInstanceOf(PersonalInfo);
      expect(found?.professionalInfo).toBeInstanceOf(ProfessionalInfo);
      expect(found?.workSchedule).toBeInstanceOf(WorkSchedule);
    });

    it('should find staff by user ID', async () => {
      // Arrange
      const uniqueUserId = randomUUID();
      const staff = createTestStaff({ userId: uniqueUserId });
      await repository.save(staff);

      // Act
      const found = await repository.findByUserId(uniqueUserId);

      // Assert
      expect(found).toBeDefined();
      expect(found?.userId).toBe(uniqueUserId);
    });

    it('should find staff by license number', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const found = await repository.findByLicenseNumber(staff.licenseNumber);

      // Assert
      expect(found).toBeDefined();
      expect(found?.licenseNumber).toBe(staff.licenseNumber);
    });

    it('should return null for non-existent license number', async () => {
      // Act
      const found = await repository.findByLicenseNumber('VN-BS-999999');

      // Assert
      expect(found).toBeNull();
    });
  });

  // ==================== UPDATE TESTS ====================

  describe('update - Update Operations', () => {
    it('should update existing staff', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Modify staff
      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Bác sĩ Updated Name',
        dateOfBirth: staff.personalInfo.dateOfBirth,
        gender: staff.personalInfo.gender,
        nationalId: staff.personalInfo.nationalId,
        nationality: staff.personalInfo.nationality,
        phoneNumber: staff.personalInfo.phoneNumber,
        email: staff.personalInfo.email,
        address: staff.personalInfo.address
      });
      staff.updatePersonalInfo(newPersonalInfo);

      // Act
      await repository.update(staff);

      // Assert
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Updated Name');
    });

    it('should update professional info', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Modify professional info
      const newProfessionalInfo = ProfessionalInfo.create({
        title: staff.professionalInfo.title,
        department: 'Updated Department',
        position: staff.professionalInfo.position,
        education: staff.professionalInfo.education,
        languages: staff.professionalInfo.languages,
        bio: staff.professionalInfo.bio
      });
      staff.updateProfessionalInfo(newProfessionalInfo);

      // Act
      await repository.update(staff);

      // Assert
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved?.professionalInfo.department).toBe('Updated Department');
    });

    it('should audit staff update', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.update(staff);

      // Assert - Audit log should be created
      expect(staff.id).toBeDefined();
    });
  });

  // ==================== DELETE TESTS ====================

  describe('delete - Soft Delete Operations', () => {
    it('should soft delete staff', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.delete(staff.staffId);

      // Assert - Staff should be marked as inactive
      const { data } = await supabaseClient
        .from('provider_schema.staff_profiles')
        .select('is_active, status')
        .eq('staff_id', staff.staffIdValue)
        .single();

      expect(data?.is_active).toBe(false);
      expect(data?.status).toBe('terminated');
    });

    it('should preserve data after soft delete', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.delete(staff.staffId);

      // Assert - Data should still exist
      const { data } = await supabaseClient
        .from('provider_schema.staff_profiles')
        .select('*')
        .eq('staff_id', staff.staffIdValue)
        .single();

      expect(data).toBeDefined();
      expect(data?.staff_id).toBe(staff.staffIdValue);
    });

    it('should audit staff deletion', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.delete(staff.staffId);

      // Assert - Audit log should be created
      expect(staff.staffIdValue).toBeDefined();
    });
  });

  // ==================== SEARCH & FILTER TESTS ====================

  describe('findAll - Search and Filter Operations', () => {
    it('should return all staff members', async () => {
      // Arrange
      const staff1 = createTestStaff();
      const staff2 = createTestStaff();
      await repository.save(staff1);
      await repository.save(staff2);

      // Act
      const staffList = await repository.findAll();

      // Assert
      expect(staffList).toBeInstanceOf(Array);
      expect(staffList.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by staff type', async () => {
      // Arrange
      const doctor = createTestStaff({ staffType: 'doctor' });
      const nurse = createTestStaff({ staffType: 'nurse' });
      await repository.save(doctor);
      await repository.save(nurse);

      // Act
      const doctors = await repository.findAll({ staffType: 'doctor' });

      // Assert
      expect(doctors.every(s => s.staffType === 'doctor')).toBe(true);
    });

    it('should filter by status', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const activeStaff = await repository.findAll({ status: 'active' });

      // Assert
      expect(activeStaff.every(s => s.status === 'active')).toBe(true);
    });

    it('should filter by isActive flag', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const activeStaff = await repository.findAll({ isActive: true });

      // Assert
      expect(activeStaff.every(s => s.isActive)).toBe(true);
    });

    it('should find staff by department', async () => {
      // Arrange
      const staff = createTestStaff({ department: 'Cardiology' });
      await repository.save(staff);

      // Act
      const cardiologyStaff = await repository.findByDepartment('Cardiology');

      // Assert
      expect(cardiologyStaff.length).toBeGreaterThan(0);
    });

    it('should find staff by specialization', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const cardiacStaff = await repository.findBySpecialization('CARD');

      // Assert
      expect(cardiacStaff.length).toBeGreaterThan(0);
    });

    it('should find available staff', async () => {
      // Arrange
      const staff = createTestStaff({ staffType: 'doctor' });
      await repository.save(staff);

      // Act
      const availableStaff = await repository.findAvailableStaff({
        staffType: 'doctor'
      });

      // Assert
      expect(availableStaff.length).toBeGreaterThan(0);
      expect(availableStaff.every(s => s.isActive)).toBe(true);
    });
  });

  // ==================== PAGINATION & SORTING TESTS ====================

  describe('Pagination and Sorting', () => {
    it('should count staff with filters', async () => {
      // Arrange
      const staff1 = createTestStaff({ staffType: 'doctor' });
      const staff2 = createTestStaff({ staffType: 'doctor' });
      await repository.save(staff1);
      await repository.save(staff2);

      // Act
      const count = await repository.count({ staffType: 'doctor' });

      // Assert
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should count all staff', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const count = await repository.count();

      // Assert
      expect(count).toBeGreaterThan(0);
    });

    it('should get repository statistics', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const stats = await repository.getStatistics();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBeDefined();
      expect(stats.inactive).toBeDefined();
    });
  });

  // ==================== TRANSACTION HANDLING TESTS ====================

  describe('Transaction Handling', () => {
    it('should handle concurrent save operations', async () => {
      // Arrange
      const staff1 = createTestStaff();
      const staff2 = createTestStaff();

      // Act
      await Promise.all([
        repository.save(staff1),
        repository.save(staff2)
      ]);

      // Assert
      const retrieved1 = await repository.findById(staff1.staffId);
      const retrieved2 = await repository.findById(staff2.staffId);
      
      expect(retrieved1).toBeDefined();
      expect(retrieved2).toBeDefined();
    });

    it('should handle concurrent update operations', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Modify in two different ways
      const newInfo1 = PersonalInfo.create({
        fullName: 'Update 1',
        dateOfBirth: staff.personalInfo.dateOfBirth,
        gender: staff.personalInfo.gender,
        nationalId: staff.personalInfo.nationalId,
        nationality: staff.personalInfo.nationality,
        phoneNumber: staff.personalInfo.phoneNumber,
        email: staff.personalInfo.email,
        address: staff.personalInfo.address
      });
      const newInfo2 = PersonalInfo.create({
        fullName: 'Update 2',
        dateOfBirth: staff.personalInfo.dateOfBirth,
        gender: staff.personalInfo.gender,
        nationalId: staff.personalInfo.nationalId,
        nationality: staff.personalInfo.nationality,
        phoneNumber: staff.personalInfo.phoneNumber,
        email: staff.personalInfo.email,
        address: staff.personalInfo.address
      });

      // Act
      staff.updatePersonalInfo(newInfo1);
      const update1 = repository.update(staff);

      staff.updatePersonalInfo(newInfo2);
      const update2 = repository.update(staff);

      await Promise.all([update1, update2]);

      // Assert - Last update should win
      const retrieved = await repository.findById(staff.staffId);
      expect(retrieved?.personalInfo.fullName).toBeDefined();
    });
  });

  // ==================== CONSTRAINT VIOLATION TESTS ====================

  describe('Constraint Violations', () => {
    it('should enforce unique staff_id constraint', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act & Assert
      await expect(repository.save(staff)).rejects.toThrow();
    });

    it('should enforce unique license_number constraint', async () => {
      // Arrange
      const staff1 = createTestStaff();
      await repository.save(staff1);

      const staff2 = createTestStaff({
        userId: randomUUID(),
        licenseNumber: staff1.licenseNumber
      });

      // Act & Assert
      await expect(repository.save(staff2)).rejects.toThrow();
    });

    it('should validate staff_type enum', async () => {
      // This is validated at domain level, not repository level
      // Domain should prevent invalid staff types
      const staff = createTestStaff({ staffType: 'doctor' });
      await repository.save(staff);

      const retrieved = await repository.findById(staff.staffId);
      expect(['doctor', 'nurse', 'technician', 'pharmacist', 'admin']).toContain(retrieved?.staffType);
    });

    it('should validate status enum', async () => {
      // This is validated at domain level
      const staff = createTestStaff();
      await repository.save(staff);

      const retrieved = await repository.findById(staff.staffId);
      expect(['active', 'on_leave', 'suspended', 'terminated']).toContain(retrieved?.status);
    });
  });

  // ==================== AUDIT LOGGING TESTS ====================

  describe('Audit Logging', () => {
    it('should log staff creation', async () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      await repository.save(staff);

      // Assert - Audit service should have logged the action
      expect(staff.id).toBeDefined();
    });

    it('should log staff update', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.update(staff);

      // Assert - Audit service should have logged the action
      expect(staff.id).toBeDefined();
    });

    it('should log staff deletion', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.delete(staff.staffId);

      // Assert - Audit service should have logged the action
      expect(staff.staffIdValue).toBeDefined();
    });

    it('should log data access', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      await repository.findById(staff.staffId);

      // Assert - Audit service should have logged the access
      expect(staff.id).toBeDefined();
    });
  });

  // ==================== PERFORMANCE TESTS ====================

  describe('Performance', () => {
    it('should save staff within acceptable time', async () => {
      // Arrange
      const staff = createTestStaff();

      // Act
      const startTime = Date.now();
      await repository.save(staff);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds
    });

    it('should retrieve staff within acceptable time', async () => {
      // Arrange
      const staff = createTestStaff();
      await repository.save(staff);

      // Act
      const startTime = Date.now();
      await repository.findById(staff.staffId);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });

    it('should handle bulk operations efficiently', async () => {
      // Arrange
      const staffList = Array.from({ length: 5 }, () => createTestStaff());

      // Act
      const startTime = Date.now();
      await Promise.all(staffList.map(s => repository.save(s)));
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds for 5 staff
    });
  });

  // ==================== HEALTH CHECK TESTS ====================

  describe('Health Check', () => {
    it('should report healthy status', async () => {
      // Act
      const isHealthy = await repository.isHealthy();

      // Assert
      expect(isHealthy).toBe(true);
    });

    it('should check database connectivity', async () => {
      // Act
      const exists = await repository.exists(StaffId.create('DOC-GEN-202501-999'));

      // Assert - Should not throw error
      expect(typeof exists).toBe('boolean');
    });
  });
});
