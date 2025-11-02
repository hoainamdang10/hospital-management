/**
 * CancelNotificationUseCase - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CancelNotificationUseCase } from '../../../../src/application/use-cases/CancelNotificationUseCase';
import { TestMocks } from '../../../helpers/test-mocks';

describe('CancelNotificationUseCase', () => {
  let useCase: CancelNotificationUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = TestMocks.createMockNotificationRepository();
    useCase = new CancelNotificationUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should cancel notification successfully', async () => {
      // Arrange
      const command = {
        notificationId: 'NOT-202501-000001',
        reason: 'Appointment rescheduled',
        userId: 'user-123'
      };
      const mockNotification = TestMocks.createMockNotification();
      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.updateStatus.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.status).toBe('CANCELLED');
      expect(result.message).toContain('successfully');
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        expect.anything(),
        'CANCELLED'
      );
    });

    it('should throw error when notification not found', async () => {
      // Arrange
      const command = {
        notificationId: 'NOT-202501-999999',
        reason: 'Test'
      };
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Notification not found');
      expect(mockRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle repository update failure', async () => {
      // Arrange
      const command = { notificationId: 'NOT-202501-000001' };
      const mockNotification = TestMocks.createMockNotification();
      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.updateStatus.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Failed to cancel notification');
    });
  });
});


