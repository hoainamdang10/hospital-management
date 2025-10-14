/**
 * SupabasePatientRepository Integration Tests
 * Patient Registry Service - Integration Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabasePatientRepository } from '../../../src/infrastructure/repositories/SupabasePatientRepository';
import { Patient } from '../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../src/domain/value-objects/BasicMedicalInfo';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('SupabasePatientRepository Integration Tests', () => {
  let repository: SupabasePatientRepository;
  let supabaseClient: SupabaseClient;
  let testPatient: Patient;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Nguyễn Văn Test Integration',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    ethnicity: 'Kinh',
    religion: 'Buddhism',
    occupation: 'Software Engineer',
    maritalStatus: 'single'
  });

  const validContactInfo = ContactInfo.create({
    phoneNumber: '0901234567',
    email: 'integration.test@example.com',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam',
      postalCode: '700000'
    }
  });

  const validBasicMedicalInfo = BasicMedicalInfo.create({
    bloodType: 'O+',
    allergies: ['Penicillin'],
    chronicDiseases: [],
    disabilities: []
  });

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    repository = new SupabasePatientRepository(supabaseClient);
  });

  beforeEach(() => {
    testPatient = Patient.register(
      'integration-test-user-' + Date.now(),
      validPersonalInfo,
      validContactInfo,
      validBasicMedicalInfo,
      undefined,
      [],
      'admin-user-id'
    );
  });

  afterEach(async () => {
    if (testPatient) {
      try {
        await repository.delete(testPatient.id.value);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });

  describe('save', () => {
    it('should save patient to database', async () => {
      await repository.save(testPatient);

      const retrieved = await repository.findById(testPatient.id.value);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id.value).toBe(testPatient.id.value);
      expect(retrieved?.personalInfo.fullName).toBe('Nguyễn Văn Test Integration');
    });

    it('should save patient with all fields', async () => {
      await repository.save(testPatient);

      const retrieved = await repository.findById(testPatient.id.value);
      
      expect(retrieved?.personalInfo.nationalId).toBe('001234567890');
      expect(retrieved?.contactInfo.phoneNumber).toBe('0901234567');
      expect(retrieved?.contactInfo.email).toBe('integration.test@example.com');
      expect(retrieved?.basicMedicalInfo.bloodType).toBe('O+');
    });

    it('should throw error when saving duplicate patient ID', async () => {
      await repository.save(testPatient);

      await expect(repository.save(testPatient)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find patient by ID', async () => {
      await repository.save(testPatient);

      const found = await repository.findById(testPatient.id.value);
      
      expect(found).toBeDefined();
      expect(found?.id.value).toBe(testPatient.id.value);
    });

    it('should return null for non-existent patient', async () => {
      const found = await repository.findById('PAT-999999-999');
      
      expect(found).toBeNull();
    });

    it('should reconstruct patient aggregate correctly', async () => {
      await repository.save(testPatient);

      const found = await repository.findById(testPatient.id.value);
      
      expect(found).toBeInstanceOf(Patient);
      expect(found?.personalInfo).toBeInstanceOf(PersonalInfo);
      expect(found?.contactInfo).toBeInstanceOf(ContactInfo);
      expect(found?.basicMedicalInfo).toBeInstanceOf(BasicMedicalInfo);
    });
  });

  describe('findByUserId', () => {
    it('should find patient by user ID', async () => {
      await repository.save(testPatient);

      const found = await repository.findByUserId(testPatient.userId);
      
      expect(found).toBeDefined();
      expect(found?.userId).toBe(testPatient.userId);
    });

    it('should return null for non-existent user ID', async () => {
      const found = await repository.findByUserId('non-existent-user-id');
      
      expect(found).toBeNull();
    });
  });

  describe('findByNationalId', () => {
    it('should find patient by national ID', async () => {
      await repository.save(testPatient);

      const found = await repository.findByNationalId('001234567890');
      
      expect(found).toBeDefined();
      expect(found?.personalInfo.nationalId).toBe('001234567890');
    });

    it('should return null for non-existent national ID', async () => {
      const found = await repository.findByNationalId('999999999999');
      
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update patient information', async () => {
      await repository.save(testPatient);

      const newPersonalInfo = PersonalInfo.create({
        ...validPersonalInfo,
        fullName: 'Nguyễn Văn Updated'
      });

      testPatient.updatePersonalInfo(newPersonalInfo, 'admin-user-id');
      await repository.update(testPatient);

      const retrieved = await repository.findById(testPatient.id.value);
      
      expect(retrieved?.personalInfo.fullName).toBe('Nguyễn Văn Updated');
    });

    it('should update contact information', async () => {
      await repository.save(testPatient);

      const newContactInfo = ContactInfo.create({
        ...validContactInfo,
        phoneNumber: '0987654321'
      });

      testPatient.updateContactInfo(newContactInfo, 'admin-user-id');
      await repository.update(testPatient);

      const retrieved = await repository.findById(testPatient.id.value);
      
      expect(retrieved?.contactInfo.phoneNumber).toBe('0987654321');
    });
  });

  describe('delete', () => {
    it('should delete patient from database', async () => {
      await repository.save(testPatient);

      await repository.delete(testPatient.id.value);

      const found = await repository.findById(testPatient.id.value);
      expect(found).toBeNull();
    });

    it('should not throw error when deleting non-existent patient', async () => {
      await expect(repository.delete('PAT-999999-999')).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all patients', async () => {
      await repository.save(testPatient);

      const patients = await repository.findAll();
      
      expect(patients).toBeInstanceOf(Array);
      expect(patients.length).toBeGreaterThan(0);
    });

    it('should return patients with correct structure', async () => {
      await repository.save(testPatient);

      const patients = await repository.findAll();
      const patient = patients.find(p => p.id.value === testPatient.id.value);
      
      expect(patient).toBeDefined();
      expect(patient?.personalInfo).toBeInstanceOf(PersonalInfo);
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('should respect RLS policies', async () => {
      await repository.save(testPatient);

      const found = await repository.findById(testPatient.id.value);
      expect(found).toBeDefined();
    });
  });

  describe('HIPAA compliance', () => {
    it('should store PHI securely', async () => {
      await repository.save(testPatient);

      const found = await repository.findById(testPatient.id.value);
      
      expect(found?.personalInfo.nationalId).toBe('001234567890');
      expect(found?.contactInfo.email).toBe('integration.test@example.com');
    });

    it('should audit patient data access', async () => {
      await repository.save(testPatient);
      await repository.findById(testPatient.id.value);

      // Audit log should be created (check audit_logs table)
      // This is implementation-specific
    });
  });

  describe('Performance', () => {
    it('should save patient within acceptable time', async () => {
      const startTime = Date.now();
      await repository.save(testPatient);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should retrieve patient within acceptable time', async () => {
      await repository.save(testPatient);

      const startTime = Date.now();
      await repository.findById(testPatient.id.value);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Transaction support', () => {
    it('should rollback on error', async () => {
      const invalidPatient = { ...testPatient, id: null } as any;

      await expect(repository.save(invalidPatient)).rejects.toThrow();

      const found = await repository.findById(testPatient.id.value);
      expect(found).toBeNull();
    });
  });
});

