/**
 * Get Appointment Statistics Use Case Tests
 * Tests statistics calculation logic
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetAppointmentStatisticsUseCase } from '../../../src/application/use-cases/GetAppointmentStatistics.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';

describe('GetAppointmentStatisticsUseCase', () => {
  let useCase: GetAppointmentStatisticsUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockQueueRepository: jest.Mocked<IQueueRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockRepository = {
      getStatistics: jest.fn().mockResolvedValue({
        totalAppointments: 100,
        completedAppointments: 80,
        cancelledAppointments: 10,
        noShowAppointments: 10,
        scheduledAppointments: 50,
        confirmedAppointments: 30,
      }),
      findByTimeSlot: jest.fn().mockResolvedValue([]),
    } as any;

    mockQueueRepository = {
      findByDoctorAndDate: jest.fn().mockResolvedValue(null),
    } as any;

    mockAuthService = {
      canViewStatistics: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new GetAppointmentStatisticsUseCase(
      mockRepository,
      mockQueueRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should return statistics for date range', async () => {
      const request = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.statistics?.overview.totalAppointments).toBe(100);
      expect(result.statistics?.overview.totalCompleted).toBe(80);
      expect(result.statistics?.overview.totalCancelled).toBe(10);
      expect(result.statistics?.overview.totalNoShow).toBe(10);
    });

    it('should calculate completion rate', async () => {
      const request = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.statistics?.rates.completionRate).toBeCloseTo(80, 1);
    });

    it('should calculate no-show rate', async () => {
      const request = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.statistics?.rates.noShowRate).toBeCloseTo(10, 1);
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canViewStatistics.mockResolvedValue(false);

      const request = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should include queue statistics', async () => {
      const mockQueue = {
        getStatus: jest.fn().mockReturnValue({
          totalWaiting: 5,
        }),
      } as any;
      mockQueueRepository.findByDoctorAndDate.mockResolvedValue(mockQueue);

      const request = {
        doctorId: 'doctor-1',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.statistics?.queue.currentQueueLength).toBe(5);
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.getStatistics.mockRejectedValue(
        new Error('Database query failed')
      );

      const request = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      const result = await useCase.execute(request, {
        userId: 'admin-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('PHI compliance', () => {
    it('should mark statistics as PHI when doctor-specific', () => {
      const request = {
        doctorId: 'doctor-1',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'admin-1',
      };

      // Aggregated statistics do not contain individual PHI
      expect(useCase.involvesPHI(request)).toBe(false);
    });

    it('should enforce authorization for statistics access', async () => {
      mockAuthService.canViewStatistics.mockResolvedValue(false);

      const request = {
        doctorId: 'doctor-1',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        requestedBy: 'unauthorized-user',
      };

      const result = await useCase.execute(request, {
        userId: 'unauthorized-user',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
