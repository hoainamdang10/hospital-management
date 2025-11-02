/**
 * Create Recurring Appointment Series Use Case Unit Tests
 * Tests RRULE recurring appointment generation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import {
  CreateRecurringAppointmentSeriesUseCase,
  RecurrenceType,
} from '../../../src/application/use-cases/CreateRecurringAppointmentSeries.use-case';
import { ScheduleAppointmentUseCase } from '../../../src/application/use-cases/ScheduleAppointment.use-case';

describe('CreateRecurringAppointmentSeriesUseCase', () => {
  let useCase: CreateRecurringAppointmentSeriesUseCase;
  let mockScheduleUseCase: jest.Mocked<ScheduleAppointmentUseCase>;
  let appointmentIdCounter = 0;

  beforeEach(() => {
    appointmentIdCounter = 0;
    
    mockScheduleUseCase = {
      execute: jest.fn().mockImplementation(async (request) => {
        appointmentIdCounter++;
        const appointmentId = `APT-${String(appointmentIdCounter).padStart(3, '0')}`;
        
        return {
          success: true,
          appointmentId,
          message: 'Đặt lịch thành công',
          appointment: {
            id: appointmentId,
            appointmentId,
            patientId: request.patientId,
            doctorId: request.doctorId,
            appointmentDate: request.appointmentDate,
            appointmentTime: request.appointmentTime,
            durationMinutes: request.durationMinutes,
            type: request.type,
            priority: request.priority,
            status: 'SCHEDULED',
            consultationFee: request.consultationFee,
          },
        };
      }),
    } as any;

    useCase = new CreateRecurringAppointmentSeriesUseCase(
      mockScheduleUseCase
    );
  });

  describe('execute - DAILY recurrence', () => {
    it('should create daily appointments', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1, // Every day
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Daily therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBe(5); // Dec 1-5
      expect(mockScheduleUseCase.execute).toHaveBeenCalledTimes(5);
    });

    it('should create appointments every N days', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 2, // Every 2 days
        startDate: '2025-12-01',
        endDate: '2025-12-10',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBe(5); // Dec 1, 3, 5, 7, 9
    });
  });

  describe('execute - WEEKLY recurrence', () => {
    it('should create weekly appointments', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceInterval: 1, // Every week
        recurrenceDaysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        startDate: '2025-12-01',
        maxOccurrences: 9, // 3 weeks * 3 days
        appointmentTime: '09:00:00',
        durationMinutes: 45,
        type: 'CONSULTATION',
        priority: 'NORMAL',
        reason: 'Weekly checkup',
        consultationFee: 75000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBeLessThanOrEqual(9);
      expect(mockScheduleUseCase.execute).toHaveBeenCalled();
    });

    it('should create appointments every N weeks', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceInterval: 2, // Every 2 weeks
        recurrenceDaysOfWeek: [1], // Monday only
        startDate: '2025-12-01',
        maxOccurrences: 4,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Bi-weekly checkup',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBeLessThanOrEqual(4);
    });
  });

  describe('execute - MONTHLY recurrence', () => {
    it('should create monthly appointments', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.MONTHLY,
        recurrenceInterval: 1, // Every month
        recurrenceDayOfMonth: 15, // 15th of every month
        startDate: '2025-12-15',
        maxOccurrences: 6, // 6 months
        appointmentTime: '14:00:00',
        durationMinutes: 60,
        type: 'CONSULTATION',
        priority: 'NORMAL',
        reason: 'Monthly review',
        consultationFee: 100000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBe(6);
    });

    it('should handle month-end dates correctly', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.MONTHLY,
        recurrenceInterval: 1,
        recurrenceDayOfMonth: 31, // 31st
        startDate: '2025-12-31',
        maxOccurrences: 3,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Monthly checkup',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      // Should handle months with < 31 days (e.g., Feb)
    });
  });

  describe('execute - YEARLY recurrence', () => {
    it('should create yearly appointments', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.YEARLY,
        recurrenceInterval: 1, // Every year
        startDate: '2025-12-01',
        maxOccurrences: 3, // 3 years
        appointmentTime: '11:00:00',
        durationMinutes: 90,
        type: 'CONSULTATION',
        priority: 'NORMAL',
        reason: 'Annual checkup',
        consultationFee: 150000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.series?.totalAppointments).toBe(3);
    });
  });

  describe('Validation', () => {
    it('should fail when recurrenceInterval is invalid', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 0, // Invalid
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Daily therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Recurrence interval must be positive');
    });

    it('should fail when no end date or max occurrences provided', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        // No endDate or maxOccurrences
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Either end date or max occurrences must be specified');
    });

    it('should fail when start date is in the past', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2020-01-01', // Past date
        endDate: '2020-01-05',
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Start date cannot be in the past');
    });

    it('should fail when maxOccurrences exceeds limit', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        maxOccurrences: 1000, // Too many
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Max occurrences exceeds limit');
    });
  });

  describe('Partial failures', () => {
    it('should handle individual appointment failures gracefully', async () => {
      mockScheduleUseCase.execute
        .mockResolvedValueOnce({ 
          success: true, 
          appointmentId: 'APT-001', 
          message: 'Đặt lịch thành công',
          appointment: {
            id: 'APT-001',
            appointmentId: 'APT-001',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            appointmentDate: '2025-12-01',
            appointmentTime: '10:00:00',
            durationMinutes: 30,
            type: 'FOLLOW_UP',
            priority: 'NORMAL',
            status: 'SCHEDULED',
            consultationFee: 50000,
          }
        })
        .mockResolvedValueOnce({ success: false, appointmentId: '', message: 'Xung đột lịch hẹn', errors: ['Conflict'] })
        .mockResolvedValueOnce({ 
          success: true, 
          appointmentId: 'APT-003', 
          message: 'Đặt lịch thành công',
          appointment: {
            id: 'APT-003',
            appointmentId: 'APT-003',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            appointmentDate: '2025-12-03',
            appointmentTime: '10:00:00',
            durationMinutes: 30,
            type: 'FOLLOW_UP',
            priority: 'NORMAL',
            status: 'SCHEDULED',
            consultationFee: 50000,
          }
        });

      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        maxOccurrences: 3,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true); // Partial success
      expect(result.series?.generatedAppointments).toHaveLength(2);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Series management', () => {
    it('should generate unique series ID', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        maxOccurrences: 3,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result1 = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      const result2 = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result1.series?.seriesId).toBeDefined();
      expect(result2.series?.seriesId).toBeDefined();
      expect(result1.series?.seriesId).not.toBe(result2.series?.seriesId);
    });

    it('should return list of generated appointment IDs', async () => {
      mockScheduleUseCase.execute
        .mockResolvedValueOnce({ 
          success: true, 
          appointmentId: 'APT-001', 
          message: 'Đặt lịch thành công',
          appointment: {
            id: 'APT-001',
            appointmentId: 'APT-001',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            appointmentDate: '2025-12-01',
            appointmentTime: '10:00:00',
            durationMinutes: 30,
            type: 'FOLLOW_UP',
            priority: 'NORMAL',
            status: 'SCHEDULED',
            consultationFee: 50000,
          }
        })
        .mockResolvedValueOnce({ 
          success: true, 
          appointmentId: 'APT-002', 
          message: 'Đặt lịch thành công',
          appointment: {
            id: 'APT-002',
            appointmentId: 'APT-002',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            appointmentDate: '2025-12-02',
            appointmentTime: '10:00:00',
            durationMinutes: 30,
            type: 'FOLLOW_UP',
            priority: 'NORMAL',
            status: 'SCHEDULED',
            consultationFee: 50000,
          }
        })
        .mockResolvedValueOnce({ 
          success: true, 
          appointmentId: 'APT-003', 
          message: 'Đặt lịch thành công',
          appointment: {
            id: 'APT-003',
            appointmentId: 'APT-003',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            appointmentDate: '2025-12-03',
            appointmentTime: '10:00:00',
            durationMinutes: 30,
            type: 'FOLLOW_UP',
            priority: 'NORMAL',
            status: 'SCHEDULED',
            consultationFee: 50000,
          }
        });

      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        maxOccurrences: 3,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.series?.generatedAppointments).toEqual([
        'APT-001',
        'APT-002',
        'APT-003',
      ]);
    });
  });

  describe('PHI compliance', () => {
    it('should mark recurring series as PHI', () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        recurrenceType: RecurrenceType.DAILY,
        recurrenceInterval: 1,
        startDate: '2025-12-01',
        maxOccurrences: 3,
        appointmentTime: '10:00:00',
        durationMinutes: 30,
        type: 'FOLLOW_UP',
        priority: 'NORMAL',
        reason: 'Therapy',
        consultationFee: 50000,
        createdBy: 'doctor-1',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
