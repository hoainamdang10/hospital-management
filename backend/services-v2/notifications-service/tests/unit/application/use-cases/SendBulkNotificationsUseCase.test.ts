/**
 * SendBulkNotificationsUseCase - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SendBulkNotificationsUseCase } from '../../../../src/application/use-cases/SendBulkNotificationsUseCase';
import { SendNotificationUseCase } from '../../../../src/application/use-cases/SendNotificationUseCase';
import { TestMocks } from '../../../helpers/test-mocks';

describe('SendBulkNotificationsUseCase', () => {
  let useCase: SendBulkNotificationsUseCase;
  let mockSendNotificationUseCase: any;

  beforeEach(() => {
    mockSendNotificationUseCase = {
      execute: jest.fn()
    };
    useCase = new SendBulkNotificationsUseCase(mockSendNotificationUseCase);
  });

  describe('execute', () => {
    it('should send notifications to all recipients', async () => {
      // Arrange
      const command = {
        recipientIds: ['patient-1', 'patient-2', 'patient-3'],
        recipientType: 'PATIENT' as const,
        templateType: 'APPOINTMENT_REMINDER',
        templateData: { test: 'data' },
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL' as const
      };
      mockSendNotificationUseCase.execute.mockResolvedValue({
        notificationId: 'test-123',
        status: 'SENT',
        deliveryResults: []
      });

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.totalRequested).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const command = {
        recipientIds: ['patient-1', 'patient-2'],
        recipientType: 'PATIENT' as const,
        templateType: 'TEST',
        templateData: {},
        channels: ['EMAIL']
      };
      mockSendNotificationUseCase.execute
        .mockResolvedValueOnce({ notificationId: 'test-1', status: 'SENT', deliveryResults: [] })
        .mockRejectedValueOnce(new Error('Failed to send'));

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.totalRequested).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('SUCCESS');
      expect(result.results[1].status).toBe('FAILED');
      expect(result.results[1].error).toBeDefined();
    });

    it('should include metadata for bulk operation', async () => {
      // Arrange
      const command = {
        recipientIds: ['patient-1'],
        recipientType: 'PATIENT' as const,
        templateType: 'TEST',
        templateData: {},
        channels: ['EMAIL'],
        metadata: { customField: 'value' }
      };
      mockSendNotificationUseCase.execute.mockResolvedValue({
        notificationId: 'test',
        status: 'SENT',
        deliveryResults: []
      });

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockSendNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            bulkOperation: true,
            customField: 'value'
          })
        })
      );
    });
  });
});


