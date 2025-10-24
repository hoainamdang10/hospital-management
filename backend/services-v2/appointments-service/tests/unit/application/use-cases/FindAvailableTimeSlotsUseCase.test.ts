/**
 * FindAvailableTimeSlotsUseCase Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { FindAvailableTimeSlotsUseCase } from '../../../../src/application/use-cases/FindAvailableTimeSlotsUseCase';
import { IProviderScheduleRepository } from '../../../../src/domain/repositories/IProviderScheduleRepository';
import { IAppointmentRepository } from '../../../../src/domain/repositories/IAppointmentRepository';
import { ProviderSchedule } from '../../../../src/domain/value-objects/ProviderSchedule.vo';
import { Appointment } from '../../../../src/domain/aggregates/Appointment.aggregate';
import { TimeSlot } from '../../../../src/domain/value-objects/TimeSlot.vo';

describe('FindAvailableTimeSlotsUseCase', () => {
  let useCase: FindAvailableTimeSlotsUseCase;
  let mockProviderScheduleRepo: jest.Mocked<IProviderScheduleRepository>;
  let mockAppointmentRepo: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    // Mock repositories
    mockProviderScheduleRepo = {
      findByProviderId: jest.fn(),
      findByProviderIds: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn()
    } as any;

    mockAppointmentRepo = {
      findByTimeSlot: jest.fn()
    } as any;

    useCase = new FindAvailableTimeSlotsUseCase(
      mockProviderScheduleRepo,
      mockAppointmentRepo
    );
  });

  describe('execute', () => {
    it('should return available time slots when provider has schedule', async () => {
      // Arrange
      const providerId = 'provider-123';
      const date = new Date('2025-10-24'); // Friday
      const durationMinutes = 30;

      const mockSchedule = ProviderSchedule.create({
        providerId,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: { start: '08:00', end: '17:00' },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: false,
        effectiveDate: new Date()
      });

      mockProviderScheduleRepo.findByProviderId.mockResolvedValue(mockSchedule);
      mockAppointmentRepo.findByTimeSlot.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({
        providerId,
        date,
        durationMinutes
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('startTime');
      expect(result[0]).toHaveProperty('endTime');
      expect(result[0]).toHaveProperty('appointmentDate');
      expect(result[0]).toHaveProperty('appointmentTime');
      expect(result[0]).toHaveProperty('formattedTime');
      expect(result[0]).toHaveProperty('dayOfWeek');
      expect(result[0].dayOfWeek).toBe('Thứ Sáu'); // Friday in Vietnamese
      expect(result[0].isAvailable).toBe(true);
    });

    it('should return empty array when provider does not work on the day', async () => {
      // Arrange
      const providerId = 'provider-123';
      const date = new Date('2025-10-26'); // Sunday
      const durationMinutes = 30;

      const mockSchedule = ProviderSchedule.create({
        providerId,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: { start: '08:00', end: '17:00' },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: false,
        effectiveDate: new Date()
      });

      mockProviderScheduleRepo.findByProviderId.mockResolvedValue(mockSchedule);

      // Act
      const result = await useCase.execute({
        providerId,
        date,
        durationMinutes
      });

      // Assert
      expect(result).toEqual([]);
      expect(mockAppointmentRepo.findByTimeSlot).not.toHaveBeenCalled();
    });

    it('should throw error when provider schedule not found', async () => {
      // Arrange
      const providerId = 'provider-123';
      const date = new Date('2025-10-24');
      const durationMinutes = 30;

      mockProviderScheduleRepo.findByProviderId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({ providerId, date, durationMinutes })
      ).rejects.toThrow('Provider schedule not found for provider: provider-123');
    });

    it('should throw error when provider ID is empty', async () => {
      // Arrange
      const providerId = '';
      const date = new Date('2025-10-24');
      const durationMinutes = 30;

      // Act & Assert
      await expect(
        useCase.execute({ providerId, date, durationMinutes })
      ).rejects.toThrow('Provider ID is required');
    });

    it('should throw error when date is invalid', async () => {
      // Arrange
      const providerId = 'provider-123';
      const date = new Date('invalid');
      const durationMinutes = 30;

      // Act & Assert
      await expect(
        useCase.execute({ providerId, date, durationMinutes })
      ).rejects.toThrow('Invalid date');
    });

    it('should throw error when duration is zero', async () => {
      // Arrange
      const providerId = 'provider-123';
      const date = new Date('2025-10-24');
      const durationMinutes = 0;

      // Act & Assert
      await expect(
        useCase.execute({ providerId, date, durationMinutes })
      ).rejects.toThrow('Duration must be greater than 0');
    });
  });
});
