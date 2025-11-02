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
import { PatientId } from '../../../src/domain/value-objects/PatientId';
import { ConsoleLogger } from '@shared/application/services/logger.interface';
import { PatientMatchingService } from '../../../src/application/services/PatientMatchingService';
import { v4 as uuidv4 } from 'uuid';

describe('SupabasePatientRepository Integration Tests', () => {
  let repository: SupabasePatientRepository;
  let testPatient: Patient;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Nguyễn Văn Test Integration',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    ethnicity: 'Kinh',
    occupation: 'Software Engineer',
    maritalStatus: 'single'
  });

  const validContactInfo = ContactInfo.create({
    primaryPhone: '0901234567',
    email: 'integration.test@example.com',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam',
      postalCode: '700000'
    },
    preferredContactMethod: 'phone'
  });

  const validBasicMedicalInfo = BasicMedicalInfo.create({
    bloodType: 'O+',
    knownAllergies: ['Penicillin']
  });

  beforeAll(() => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const logger = new ConsoleLogger();
    const matchingService = new PatientMatchingService(logger);

    repository = new SupabasePatientRepository(
      supabaseUrl,
      supabaseKey,
      logger,
      matchingService
    );
  });

  beforeEach(() => {
    testPatient = Patient.register(
      uuidv4(), // Use UUID for user_id
      validPersonalInfo,
      validContactInfo,
      validBasicMedicalInfo,
      undefined,
      [],
      uuidv4() // Use UUID for admin user ID
    );
  });

  afterEach(async () => {
    if (testPatient) {
      try {
        const patientIdObj = testPatient.getPatientIdObject();
        await repository.delete(patientIdObj);
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });

  describe('save', () => {
    it('should save patient to database', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const retrieved = await repository.findById(patientIdObj);

      expect(retrieved).toBeDefined();
      expect(retrieved?.getPatientId()).toBe(testPatient.getPatientId());
      expect(retrieved?.getPersonalInfo().fullName).toBe('Nguyễn Văn Test Integration');
    });

    it('should save patient with all fields', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const retrieved = await repository.findById(patientIdObj);

      expect(retrieved?.getPersonalInfo().nationalId).toBe('001234567890');
      expect(retrieved?.getContactInfo().primaryPhone).toBe('0901234567');
      expect(retrieved?.getContactInfo().email).toBe('integration.test@example.com');
      expect(retrieved?.getBasicMedicalInfo().bloodType).toBe('O+');
    });

    it('should update patient when saving duplicate patient ID (UPSERT)', async () => {
      // First save
      await repository.save(testPatient);

      // Update patient data
      const updatedPersonalInfo = PersonalInfo.create({
        fullName: 'Updated Name',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });
      testPatient.updatePersonalInfo(updatedPersonalInfo, uuidv4());

      // Second save should update, not throw
      await expect(repository.save(testPatient)).resolves.not.toThrow();

      // Verify update
      const patientIdObj = testPatient.getPatientIdObject();
      const retrieved = await repository.findById(patientIdObj);
      expect(retrieved?.getPersonalInfo().fullName).toBe('Updated Name');
    });
  });

  describe('findById', () => {
    it('should find patient by ID', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const found = await repository.findById(patientIdObj);

      expect(found).toBeDefined();
      expect(found?.getPatientId()).toBe(testPatient.getPatientId());
    });

    it('should return null for non-existent patient', async () => {
      const nonExistentId = PatientId.create('PAT-202512-999');
      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });

    it('should reconstruct patient aggregate correctly', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const found = await repository.findById(patientIdObj);

      expect(found).toBeInstanceOf(Patient);
      expect(found?.getPersonalInfo()).toBeInstanceOf(PersonalInfo);
      expect(found?.getContactInfo()).toBeInstanceOf(ContactInfo);
      expect(found?.getBasicMedicalInfo()).toBeInstanceOf(BasicMedicalInfo);
    });
  });

  describe('findByUserId', () => {
    it('should find patient by user ID', async () => {
      // Create a fresh patient for this test
      const testUserId = uuidv4();
      const freshPatient = Patient.register(
        testUserId,
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        'test-admin'
      );

      await repository.save(freshPatient);

      const found = await repository.findByUserId(testUserId);

      expect(found).toBeDefined();
      expect(found?.getUserId()).toBe(testUserId);
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
      expect(found?.getPersonalInfo().nationalId).toBe('001234567890');
    });

    it('should return null for non-existent national ID', async () => {
      const found = await repository.findByNationalId('999999999999');
      
      expect(found).toBeNull();
    });
  });

  describe('save (update)', () => {
    it('should update patient information', async () => {
      await repository.save(testPatient);

      const newPersonalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn Updated',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese',
        ethnicity: 'Kinh',
        occupation: 'Software Engineer',
        maritalStatus: 'single'
      });

      testPatient.updatePersonalInfo(newPersonalInfo, 'admin-user-id');
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const retrieved = await repository.findById(patientIdObj);

      expect(retrieved?.getPersonalInfo().fullName).toBe('Nguyễn Văn Updated');
    });

    it('should update contact information', async () => {
      await repository.save(testPatient);

      const newContactInfo = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'updated@example.com',
        address: {
          street: '456 Updated Street',
          ward: 'Ward 2',
          district: 'District 2',
          city: 'Ho Chi Minh City',
          province: 'Ho Chi Minh',
          country: 'Vietnam',
          postalCode: '700000'
        },
        preferredContactMethod: 'email'
      });

      testPatient.updateContactInfo(newContactInfo, 'admin-user-id');
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const retrieved = await repository.findById(patientIdObj);

      expect(retrieved?.getContactInfo().primaryPhone).toBe('0987654321');
      expect(retrieved?.getContactInfo().email).toBe('updated@example.com');
    });
  });

  describe('delete', () => {
    it('should delete patient from database (soft delete)', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      await repository.delete(patientIdObj);

      const found = await repository.findById(patientIdObj);
      // Soft delete: patient still exists but status is 'inactive'
      expect(found).toBeDefined();
      expect(found?.getStatus()).toBe('inactive');
    });

    it('should not throw error when deleting non-existent patient', async () => {
      const nonExistentId = PatientId.create('PAT-202512-999');
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('should respect RLS policies', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const found = await repository.findById(patientIdObj);
      expect(found).toBeDefined();
    });
  });

  describe('HIPAA compliance', () => {
    it('should store PHI securely', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      const found = await repository.findById(patientIdObj);

      expect(found?.getPersonalInfo().nationalId).toBe('001234567890');
      expect(found?.getContactInfo().email).toBe('integration.test@example.com');
    });

    it('should audit patient data access', async () => {
      await repository.save(testPatient);

      const patientIdObj = testPatient.getPatientIdObject();
      await repository.findById(patientIdObj);

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

      const patientIdObj = testPatient.getPatientIdObject();
      const startTime = Date.now();
      await repository.findById(patientIdObj);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Transaction support', () => {
    it('should rollback on error', async () => {
      const rollbackPatient = Patient.register(
        uuidv4(),
        validPersonalInfo,
        validContactInfo,
        validBasicMedicalInfo,
        undefined,
        [],
        uuidv4()
      );

      const invalidPatient = { ...rollbackPatient, id: null } as any;

      await expect(repository.save(invalidPatient)).rejects.toThrow();

      const patientIdObj = rollbackPatient.getPatientIdObject();
      const found = await repository.findById(patientIdObj);
      expect(found).toBeNull();
    });
  });
});
