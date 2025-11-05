/**
 * Patient History API Integration Tests
 *
 * Tests the GET /api/v1/patients/:patientId/history endpoint
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetPatientHistoryUseCase } from '../../src/application/use-cases/GetPatientHistoryUseCase';
import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { PatientId } from '../../src/domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';

// Mock logger
const mockLogger: ILogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn()
};

// Mock repository
const mockRepository = {
  findById: jest.fn(),
  getPatientHistory: jest.fn()
} as unknown as IPatientRepository;

describe('Patient History API Integration Tests', () => {
  let getPatientHistoryUseCase: GetPatientHistoryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize use case
    getPatientHistoryUseCase = new GetPatientHistoryUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('GET /api/v1/patients/:patientId/history', () => {
    const validPatientId = 'PAT-202501-001';
    const mockPatient = {
      id: PatientId.create(validPatientId),
      getPersonalInfo: () => ({ fullName: 'Test Patient' })
    };

    it('should return patient history successfully', async () => {
      // Arrange
      const mockHistory = {
        history: [
          {
            eventId: 'evt-001',
            eventType: 'PATIENT_REGISTERED',
            action: 'CREATE',
            userId: 'USR-202501-001',
            userRole: 'ADMIN',
            timestamp: new Date('2025-01-01T10:00:00Z'),
            changes: { status: 'ACTIVE' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          }
        ],
        total: 1
      };

      (mockRepository.findById as jest.Mock).mockResolvedValue(mockPatient as any);
      (mockRepository.getPatientHistory as jest.Mock).mockResolvedValue(mockHistory);

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: validPatientId,
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.history).toHaveLength(1);
      expect(result.data?.history[0].eventType).toBe('PATIENT_REGISTERED');
      expect(mockRepository.findById).toHaveBeenCalledWith(expect.any(Object));
      expect(mockRepository.getPatientHistory).toHaveBeenCalled();
    });

    it('should return 404 for non-existent patient', async () => {
      // Arrange
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: 'PAT-202501-999',
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
    });

    it('should support pagination', async () => {
      // Arrange
      const mockHistory = {
        history: Array(10).fill(null).map((_, i) => ({
          eventId: `evt-${i}`,
          eventType: 'PATIENT_UPDATED',
          action: 'UPDATE',
          userId: 'USR-202501-001',
          timestamp: new Date(),
        })),
        total: 100
      };

      (mockRepository.findById as jest.Mock).mockResolvedValue(mockPatient as any);
      (mockRepository.getPatientHistory as jest.Mock).mockResolvedValue(mockHistory);

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: validPatientId,
        limit: 10,
        offset: 20,
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pagination.limit).toBe(10);
      expect(result.data?.pagination.offset).toBe(20);
      expect(result.data?.pagination.total).toBe(100);
      expect(result.data?.pagination.hasMore).toBe(true);
    });

    it('should filter by date range', async () => {
      // Arrange
      const mockHistory = {
        history: [
          {
            eventId: 'evt-001',
            eventType: 'PATIENT_UPDATED',
            action: 'UPDATE',
            userId: 'USR-202501-001',
            timestamp: new Date('2025-01-15T10:00:00Z'),
          }
        ],
        total: 1
      };

      (mockRepository.findById as jest.Mock).mockResolvedValue(mockPatient as any);
      (mockRepository.getPatientHistory as jest.Mock).mockResolvedValue(mockHistory);

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: validPatientId,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.getPatientHistory).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date)
        })
      );
    });

    it('should filter by event types', async () => {
      // Arrange
      const mockHistory = {
        history: [
          {
            eventId: 'evt-001',
            eventType: 'PATIENT_REGISTERED',
            action: 'CREATE',
            userId: 'USR-202501-001',
            timestamp: new Date(),
          }
        ],
        total: 1
      };

      (mockRepository.findById as jest.Mock).mockResolvedValue(mockPatient as any);
      (mockRepository.getPatientHistory as jest.Mock).mockResolvedValue(mockHistory);

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: validPatientId,
        eventTypes: ['PATIENT_REGISTERED', 'PATIENT_UPDATED'],
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.getPatientHistory).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          eventTypes: ['PATIENT_REGISTERED', 'PATIENT_UPDATED']
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockPatient as any);
      (mockRepository.getPatientHistory as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await getPatientHistoryUseCase.execute({
        patientId: validPatientId,
        requestedBy: 'USR-202501-001'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

