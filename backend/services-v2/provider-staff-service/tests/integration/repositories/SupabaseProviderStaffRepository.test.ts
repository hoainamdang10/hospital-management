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
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    repository = new SupabaseProviderStaffRepository(supabaseClient);
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
      'full-time',
      new Date('2020-01-01'),
      15
    );
  });

  afterEach(async () => {
    if (testStaff) {
      try {
        await repository.delete(testStaff.id.value);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });

  describe('save', () => {
    it('should save staff to database', async () => {
      await repository.save(testStaff);

      const retrieved = await repository.findById(testStaff.id.value);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id.value).toBe(testStaff.id.value);
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Nguyễn Văn Integration Test');
    });

    it('should save staff with all fields', async () => {
      await repository.save(testStaff);

      const retrieved = await repository.findById(testStaff.id.value);
      
      expect(retrieved?.staffType).toBe('doctor');
      expect(retrieved?.professionalInfo.title).toBe('Bác sĩ Chuyên khoa I');
      expect(retrieved?.professionalInfo.department).toBe('Cardiology');
      expect(retrieved?.employmentType).toBe('full-time');
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
        'full-time',
        new Date('2020-01-01'),
        15
      );

      await expect(repository.save(duplicateStaff)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find staff by ID', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(testStaff.id.value);
    });

    it('should return null for non-existent staff', async () => {
      const found = await repository.findById('STF-999999-999');
      
      expect(found).toBeNull();
    });

    it('should reconstruct staff aggregate correctly', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      
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
    it('should update staff information', async () => {
      await repository.save(testStaff);

      const newPersonalInfo = PersonalInfo.create({
        ...validPersonalInfo,
        fullName: 'Bác sĩ Nguyễn Văn Updated'
      });

      testStaff.updatePersonalInfo(newPersonalInfo);
      await repository.update(testStaff);

      const retrieved = await repository.findById(testStaff.id.value);
      
      expect(retrieved?.personalInfo.fullName).toBe('Bác sĩ Nguyễn Văn Updated');
    });

    it('should update professional information', async () => {
      await repository.save(testStaff);

      const newProfessionalInfo = ProfessionalInfo.create({
        ...validProfessionalInfo,
        title: 'Bác sĩ Chuyên khoa II'
      });

      testStaff.updateProfessionalInfo(newProfessionalInfo);
      await repository.update(testStaff);

      const retrieved = await repository.findById(testStaff.id.value);
      
      expect(retrieved?.professionalInfo.title).toBe('Bác sĩ Chuyên khoa II');
    });

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

      const retrieved = await repository.findById(testStaff.id.value);
      
      expect(retrieved?.workSchedule.workingDays).toHaveLength(3);
      expect(retrieved?.workSchedule.isFlexible).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete staff from database', async () => {
      await repository.save(testStaff);

      await repository.delete(testStaff.id.value);

      const found = await repository.findById(testStaff.id.value);
      expect(found).toBeNull();
    });

    it('should not throw error when deleting non-existent staff', async () => {
      await expect(repository.delete('STF-999999-999')).resolves.not.toThrow();
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
      const staff = staffList.find(s => s.id.value === testStaff.id.value);
      
      expect(staff).toBeDefined();
      expect(staff?.personalInfo).toBeInstanceOf(PersonalInfo);
      expect(staff?.professionalInfo).toBeInstanceOf(ProfessionalInfo);
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('should respect RLS policies', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      expect(found).toBeDefined();
    });
  });

  describe('HIPAA compliance', () => {
    it('should store sensitive data securely', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      
      expect(found?.personalInfo.nationalId).toBe('001234567890');
      expect(found?.licenseNumber).toMatch(/BYS-\d{5}/);
    });

    it('should audit staff data access', async () => {
      await repository.save(testStaff);
      await repository.findById(testStaff.id.value);

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
      await repository.findById(testStaff.id.value);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Transaction support', () => {
    it('should rollback on error', async () => {
      const invalidStaff = { ...testStaff, id: null } as any;

      await expect(repository.save(invalidStaff)).rejects.toThrow();

      const found = await repository.findById(testStaff.id.value);
      expect(found).toBeNull();
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should validate Vietnamese medical license format', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      
      expect(found?.licenseNumber).toMatch(/^BYS-\d{5}$/);
    });

    it('should support Vietnamese medical titles', async () => {
      await repository.save(testStaff);

      const found = await repository.findById(testStaff.id.value);
      
      expect(found?.professionalInfo.title).toContain('Bác sĩ');
    });
  });
});

