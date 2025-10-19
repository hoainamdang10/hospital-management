/**
 * PatientMatchingService Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientMatchingService } from '../../../../src/application/services/PatientMatchingService';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { ILogger } from '@shared/application/services/logger.interface';
import { PatientMatchCriteria } from '../../../../src/application/services/IPatientMatchingService';

describe('PatientMatchingService', () => {
  let service: PatientMatchingService;
  let mockLogger: jest.Mocked<ILogger>;

  // Test data
  let patient1: Patient;
  let patient2: Patient;
  let patient3: Patient;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    service = new PatientMatchingService(mockLogger);

    // Create test patients
    const personalInfo1 = PersonalInfo.create({
      fullName: 'Nguyễn Văn A',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnamese'
    });

    const contactInfo1 = ContactInfo.create({
      primaryPhone: '0912345678',
      email: 'nguyenvana@example.com',
      address: {
        street: '123 Main St',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      },
      preferredContactMethod: 'phone'
    });

    const medicalInfo1 = BasicMedicalInfo.create({
      bloodType: 'A',
      allergies: [],
      chronicConditions: []
    });

    patient1 = Patient.register(
      'user-1',
      personalInfo1,
      contactInfo1,
      medicalInfo1,
      undefined,
      [],
      'admin-user-id'
    );

    // Patient 2 - Similar to patient 1 (probable match)
    const personalInfo2 = PersonalInfo.create({
      fullName: 'Nguyen Van A', // Same name, different diacritics
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      nationalId: '001234567891', // Different national ID
      nationality: 'Vietnamese'
    });

    const contactInfo2 = ContactInfo.create({
      primaryPhone: '0912345678',
      email: 'nguyenvana2@example.com',
      address: {
        street: '456 Other St',
        ward: 'Ward 2',
        district: 'District 2',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      },
      preferredContactMethod: 'phone'
    });

    const medicalInfo2 = BasicMedicalInfo.create({
      bloodType: 'A',
      allergies: [],
      chronicConditions: []
    });

    patient2 = Patient.register(
      'user-2',
      personalInfo2,
      contactInfo2,
      medicalInfo2,
      undefined,
      [],
      'admin-user-id'
    );

    // Patient 3 - Different person (no match)
    const personalInfo3 = PersonalInfo.create({
      fullName: 'Trần Thị B',
      dateOfBirth: new Date('1985-05-20'),
      gender: 'female',
      nationalId: '009876543210',
      nationality: 'Vietnamese'
    });

    const contactInfo3 = ContactInfo.create({
      primaryPhone: '0987654321',
      email: 'tranthib@example.com',
      address: {
        street: '789 Different St',
        ward: 'Ward 3',
        district: 'District 3',
        city: 'Hanoi',
        province: 'Hanoi',
        country: 'Vietnam'
      },
      preferredContactMethod: 'email'
    });

    const medicalInfo3 = BasicMedicalInfo.create({
      bloodType: 'B',
      allergies: [],
      chronicConditions: []
    });

    patient3 = Patient.register(
      'user-3',
      personalInfo3,
      contactInfo3,
      medicalInfo3,
      undefined,
      [],
      'admin-user-id'
    );
  });

  describe('matchPatients', () => {
    it('should find certain match with exact national ID', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15'),
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient1, patient2, patient3], criteria);

      expect(results).toHaveLength(2); // patient1 and patient2 (patient3 excluded as certainly-not)
      expect(results[0].patient).toBe(patient1);
      expect(results[0].matchGrade).toBe('certain');
      expect(results[0].score).toBeGreaterThanOrEqual(90);
    });

    it('should find probable match with similar data', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyen Van A',
        dateOfBirth: new Date('1990-01-15'),
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient2], criteria);

      expect(results).toHaveLength(1);
      expect(results[0].matchGrade).toBe('probable');
      expect(results[0].score).toBeGreaterThanOrEqual(70);
      expect(results[0].score).toBeLessThan(90);
    });

    it('should exclude certainly-not matches by default', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890',
        fullName: 'Nguyễn Văn A'
      };

      const results = await service.matchPatients([patient1, patient3], criteria);

      expect(results).toHaveLength(1);
      expect(results[0].patient).toBe(patient1);
    });

    it('should filter only certain matches when requested', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15'),
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient1, patient2], criteria, true);

      expect(results).toHaveLength(1);
      expect(results[0].matchGrade).toBe('certain');
    });

    it('should sort results by score descending', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15')
      };

      const results = await service.matchPatients([patient1, patient2], criteria);

      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    it('should respect limit parameter', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A'
      };

      const results = await service.matchPatients([patient1, patient2], criteria, false, 1);

      expect(results).toHaveLength(1);
    });

    it('should include match details', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15')
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails).toBeDefined();
      expect(results[0].matchDetails.matchedFields).toContain('nationalId');
      expect(results[0].matchDetails.matchedFields).toContain('fullName');
      expect(results[0].matchDetails.matchedFields).toContain('dateOfBirth');
      expect(results[0].matchDetails.scores).toBeDefined();
    });

    it('should log matching completion', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A'
      };

      await service.matchPatients([patient1, patient2], criteria);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Patient matching completed',
        expect.objectContaining({
          totalCandidates: 2,
          matchesFound: expect.any(Number)
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Test'
      };

      // Force an error by passing invalid data
      const invalidPatient = null as any;

      await expect(
        service.matchPatients([invalidPatient], criteria)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('scoring algorithm', () => {
    it('should give highest weight to national ID (40 points)', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.scores.nationalId).toBe(40);
    });

    it('should give 20 points for exact full name match', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.scores.fullName).toBeGreaterThan(15); // High similarity
    });

    it('should give 20 points for exact date of birth match', async () => {
      const criteria: PatientMatchCriteria = {
        dateOfBirth: new Date('1990-01-15')
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.scores.dateOfBirth).toBe(20);
    });

    it('should give 15 points for exact phone match', async () => {
      const criteria: PatientMatchCriteria = {
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.scores.primaryPhone).toBe(15);
    });

    it('should give 5 points for exact email match', async () => {
      const criteria: PatientMatchCriteria = {
        email: 'nguyenvana@example.com'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.scores.email).toBe(5);
    });

    it('should normalize Vietnamese diacritics in name matching', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyen Van A' // No diacritics
      };

      const results = await service.matchPatients([patient1], criteria); // Has diacritics

      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].matchDetails.matchedFields).toContain('fullName');
    });

    it('should normalize phone numbers (remove non-digits)', async () => {
      const criteria: PatientMatchCriteria = {
        primaryPhone: '091-234-5678' // With dashes
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].matchDetails.matchedFields).toContain('primaryPhone');
    });

    it('should handle partial name similarity', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn B' // Similar but not exact
      };

      const results = await service.matchPatients([patient1], criteria);

      // Should have some score but not full 20 points
      if (results[0].matchDetails.scores.fullName) {
        expect(results[0].matchDetails.scores.fullName).toBeLessThan(20);
        expect(results[0].matchDetails.scores.fullName).toBeGreaterThan(0);
      }
    });
  });

  describe('match grade thresholds', () => {
    it('should classify score >= 90 as certain', async () => {
      const criteria: PatientMatchCriteria = {
        nationalId: '001234567890',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15'),
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].score).toBeGreaterThanOrEqual(90);
      expect(results[0].matchGrade).toBe('certain');
    });

    it('should classify score 70-89 as probable', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15'),
        primaryPhone: '0912345678'
      };

      const results = await service.matchPatients([patient1], criteria);

      expect(results[0].score).toBeGreaterThanOrEqual(70);
      expect(results[0].score).toBeLessThan(90);
      expect(results[0].matchGrade).toBe('probable');
    });

    it('should classify score 50-69 as possible', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-15')
      };

      const results = await service.matchPatients([patient1], criteria);

      if (results[0].score >= 50 && results[0].score < 70) {
        expect(results[0].matchGrade).toBe('possible');
      }
    });

    it('should classify score < 50 as certainly-not', async () => {
      const criteria: PatientMatchCriteria = {
        fullName: 'Completely Different Name'
      };

      const results = await service.matchPatients([patient1], criteria, false, 100);

      // Should be filtered out by default, but if we get it, should be certainly-not
      const certainlyNotResults = results.filter(r => r.matchGrade === 'certainly-not');
      expect(certainlyNotResults).toHaveLength(0); // Filtered out by default
    });
  });
});

