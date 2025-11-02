/**
 * SearchNotificationsUseCase - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SearchNotificationsUseCase } from '../../../../src/application/use-cases/SearchNotificationsUseCase';
import { TestMocks } from '../../../helpers/test-mocks';

describe('SearchNotificationsUseCase', () => {
  let useCase: SearchNotificationsUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = TestMocks.createMockNotificationRepository();
    useCase = new SearchNotificationsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should search notifications by recipient', async () => {
      // Arrange
      const command = {
        recipientId: 'patient-123',
        limit: 20,
        offset: 0
      };
      const mockNotifications = [
        TestMocks.createMockNotification(),
        TestMocks.createMockNotification()
      ];
      mockRepository.findByCriteria.mockResolvedValue(mockNotifications);
      mockRepository.countByCriteria.mockResolvedValue(2);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(mockRepository.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'patient-123',
          limit: 21 // +1 for hasMore check
        })
      );
    });

    it('should indicate hasMore when more results available', async () => {
      // Arrange
      const command = { recipientId: 'patient-123', limit: 5 };
      const mockNotifications = Array(6).fill(null).map(() => TestMocks.createMockNotification());
      mockRepository.findByCriteria.mockResolvedValue(mockNotifications);
      mockRepository.countByCriteria.mockResolvedValue(10);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.notifications).toHaveLength(5);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(10);
    });

    it('should filter by status and priority', async () => {
      // Arrange
      const command = {
        recipientId: 'patient-123',
        status: 'SENT',
        priority: 'HIGH'
      };
      mockRepository.findByCriteria.mockResolvedValue([]);
      mockRepository.countByCriteria.mockResolvedValue(0);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SENT',
          priority: 'HIGH'
        })
      );
    });

    it('should filter by healthcare context', async () => {
      // Arrange
      const command = {
        healthcareContext: {
          patientId: 'PAT-202501-000001',
          appointmentId: 'APT-202501-000001'
        }
      };
      mockRepository.findByCriteria.mockResolvedValue([]);
      mockRepository.countByCriteria.mockResolvedValue(0);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({
          healthcareContext: {
            patientId: 'PAT-202501-000001',
            appointmentId: 'APT-202501-000001'
          }
        })
      );
    });
  });
});


