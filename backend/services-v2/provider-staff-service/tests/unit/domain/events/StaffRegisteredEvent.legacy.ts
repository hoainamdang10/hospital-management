/**
 * StaffRegisteredEvent Tests
 * @version 2.0.0
 */

import { StaffRegisteredEvent } from '../../../../src/domain/events/StaffRegisteredEvent';
import { StaffId } from '../../../../src/domain/value-objects/StaffId';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';

describe('StaffRegisteredEvent', () => {
  const staffId = StaffId.create('DOC-CARD-202501-001');
  const userId = 'user-123';
  const personalInfo = PersonalInfo.create({
    fullName: 'Dr. John Doe',
    dateOfBirth: new Date('1980-01-01'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    phoneNumber: '0901234567',
    email: 'doctor@hospital.vn',
    address: {
      street: '123 Test St',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh',
      province: 'Ho Chi Minh',
      country: 'Vietnam'
    }
  });
  const professionalInfo = ProfessionalInfo.create({
    title: 'Doctor',
    department: 'Cardiology',
    position: 'Senior',
    education: ['MD'],
    languages: ['Vietnamese', 'English'],
    bio: 'Experienced'
  });
  const workSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { start: '08:00', end: '17:00' },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new StaffRegisteredEvent(
        staffId,
        userId,
        'doctor',
        personalInfo,
        professionalInfo,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      expect(event.eventType).toBe('StaffRegistered');
      expect(event.staffId).toBe(staffId);
      expect(event.userId).toBe(userId);
      expect(event.staffType).toBe('doctor');
    });

    it('should include correlation tracking', () => {
      const event = new StaffRegisteredEvent(
        staffId,
        userId,
        'doctor',
        personalInfo,
        professionalInfo,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        workSchedule,
        'correlation-123',
        'causation-456',
        'admin-123'
      });

      expect(event.correlationId).toBe('correlation-123');
      expect(event.causationId).toBe('causation-456');
    });
  });

  describe('getEventData', () => {
    it('should return complete event data', () => {
      const event = new StaffRegisteredEvent(
        staffId,
        userId,
        'doctor',
        personalInfo,
        professionalInfo,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      const data = event.getEventData();

      expect(data).toHaveProperty('staffId');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('staffType');
      expect(data).toHaveProperty('personalInfo');
      expect(data).toHaveProperty('professionalInfo');
      expect(data).toHaveProperty('occurredAt');
    });
  });

  describe('HIPAA compliance', () => {
    it('should mark as containing PHI', () => {
      const event = new StaffRegisteredEvent(
        staffId,
        userId,
        'doctor',
        personalInfo,
        professionalInfo,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      expect(event.containsPHI()).toBe(true);
    });

    it('should return null for patient ID', () => {
      const event = new StaffRegisteredEvent(
        staffId,
        userId,
        'doctor',
        personalInfo,
        professionalInfo,
        'BYS-12345',
        'full_time',
        new Date('2020-01-01'),
        workSchedule
      );

      expect(event.getPatientId()).toBeNull();
    });
  });
});
