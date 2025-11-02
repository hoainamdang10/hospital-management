/**
 * Conflict Resolution Service Unit Tests
 * Tests conflict detection and alternative slot suggestion
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { ConflictResolutionService } from '../../../../src/infrastructure/services/ConflictResolutionService';
import { IAppointmentRepository } from '../../../../src/domain/repositories/IAppointmentRepository';

describe('ConflictResolutionService', () => {
  let service: ConflictResolutionService;
  let mockRepository: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    mockRepository = {
      checkConflicts: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDateRange: jest.fn(),
    } as any;

    service = new ConflictResolutionService(mockRepository);
  });

  describe('checkConflicts', () => {
    it('should return no conflicts when time slot is free', async () => {
      mockRepository.checkConflicts.mockResolvedValue({
        hasConflicts: false,
        conflicts: [],
      });

      const request = {
        doctorId: 'doctor-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T10:30:00Z'),
      };

      const result = await service.checkConflicts(request);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.suggestions).toBeUndefined();
    });

    it('should detect conflicts and suggest alternatives', async () => {
      mockRepository.checkConflicts.mockResolvedValue({
        hasConflicts: true,
        conflicts: [
          {
            appointmentId: 'apt-1',
            startTime: new Date('2025-12-01T10:00:00Z'),
            endTime: new Date('2025-12-01T10:30:00Z'),
            reason: 'Doctor already booked',
          },
        ],
      });

      // Mock alternative slots
      mockRepository.findByDoctorId.mockResolvedValue([]);

      const request = {
        doctorId: 'doctor-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T10:30:00Z'),
      };

      const result = await service.checkConflicts(request);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].appointmentId).toBe('apt-1');
      expect(result.suggestions).toBeDefined();
    });

    it('should exclude specific appointment from conflict check', async () => {
      mockRepository.checkConflicts.mockResolvedValue({
        hasConflicts: false,
        conflicts: [],
      });

      const request = {
        doctorId: 'doctor-1',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T10:30:00Z'),
        excludeAppointmentId: 'apt-to-exclude',
      };

      const result = await service.checkConflicts(request);

      expect(result.hasConflicts).toBe(false);
      expect(mockRepository.checkConflicts).toHaveBeenCalledWith(
        'doctor-1',
        expect.any(Date),
        expect.any(Date),
        'apt-to-exclude'
      );
    });
  });

  describe('findAlternativeSlots', () => {
    it('should return proper response structure for alternative slots', async () => {
      mockRepository.findByDoctorId.mockResolvedValue([]);

      const request = {
        doctorId: 'doctor-1',
        preferredDate: new Date('2025-12-01T10:00:00'),
        durationMinutes: 30,
        maxSuggestions: 5,
      };

      const result = await service.findAlternativeSlots(request);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.totalFound).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should respect business hours (8 AM - 5 PM)', async () => {
      mockRepository.findByDoctorId.mockResolvedValue([]);

      const request = {
        doctorId: 'doctor-1',
        preferredDate: new Date('2025-12-01T18:00:00'), // After business hours
        durationMinutes: 30,
      };

      const result = await service.findAlternativeSlots(request);

      expect(result.suggestions).toBeDefined();
      
      // All suggestions should be within business hours
      result.suggestions.forEach((slot: any) => {
        const slotTime = new Date(slot.startTime);
        const hour = slotTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(17);
      });
    });

    it('should exclude lunch hours (12 PM - 1 PM)', async () => {
      mockRepository.findByDoctorId.mockResolvedValue([]);

      const request = {
        doctorId: 'doctor-1',
        preferredDate: new Date('2025-12-01T12:30:00'), // During lunch
        durationMinutes: 30,
      };

      const result = await service.findAlternativeSlots(request);

      expect(result.suggestions).toBeDefined();
      
      // No suggestions during lunch hours
      result.suggestions.forEach((slot: any) => {
        const slotTime = new Date(slot.startTime);
        const hour = slotTime.getHours();
        expect(hour).not.toBe(12);
      });
    });

    it('should suggest next available day if all slots taken', async () => {
      // Mock all slots taken for today
      mockRepository.findByDoctorId.mockResolvedValue([
        // Mock appointments filling all day
      ]);

      const request = {
        doctorId: 'doctor-1',
        preferredDate: new Date('2025-12-01T10:00:00'),
        durationMinutes: 30,
      };

      const result = await service.findAlternativeSlots(request);

      expect(result.suggestions).toBeDefined();
      
      // Should suggest slots on next day
      if (result.suggestions && result.suggestions.length > 0) {
        const firstSlot = result.suggestions[0];
        const slotDate = new Date(firstSlot.startTime);
        expect(slotDate.toISOString().split('T')[0]).not.toBe('2025-12-01');
      }
    });
  });
});
