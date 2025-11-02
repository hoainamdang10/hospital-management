/**
 * GetNotificationUseCase - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetNotificationUseCase } from '../../../../src/application/use-cases/GetNotificationUseCase';
import { TestMocks } from '../../../helpers/test-mocks';
import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';

describe('GetNotificationUseCase', () => {
  let useCase: GetNotificationUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = TestMocks.createMockNotificationRepository();
    useCase = new GetNotificationUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return notification when found', async () => {
      // Arrange
      const notificationId = 'NOT-202501-000001';
      const mockNotification = TestMocks.createMockNotification();
      mockRepository.findById.mockResolvedValue(mockNotification);

      // Act
      const result = await useCase.execute({ notificationId });

      // Assert
      expect(result.notification).not.toBeNull();
      expect(result.notification?.notificationId).toBe(mockNotification.id);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: notificationId })
      );
    });

    it('should return null when notification not found', async () => {
      // Arrange
      const notificationId = 'NOT-202501-999999';
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({ notificationId });

      // Assert
      expect(result.notification).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const notificationId = 'NOT-202501-000001';
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({ notificationId })).rejects.toThrow('Failed to get notification');
    });

    it('should include all notification details in result', async () => {
      // Arrange
      const mockNotification = TestMocks.createMockNotification({
        templateType: 'APPOINTMENT_CONFIRMATION',
        priority: 'HIGH'
      });
      mockRepository.findById.mockResolvedValue(mockNotification);

      // Act
      const result = await useCase.execute({ notificationId: 'NOT-202501-000001' });

      // Assert
      expect(result.notification).toMatchObject({
        templateType: 'APPOINTMENT_CONFIRMATION',
        priority: 'HIGH',
        status: expect.any(String)
      });
    });
  });
});


