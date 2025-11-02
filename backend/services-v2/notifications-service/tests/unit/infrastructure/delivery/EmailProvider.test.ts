/**
 * EmailProvider - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { EmailProvider } from '../../../../src/infrastructure/delivery/providers/EmailProvider';
import { TestMocks } from '../../../helpers/test-mocks';
import { NotificationChannel } from '../../../../src/domain/value-objects/NotificationChannel';

describe('EmailProvider', () => {
  let provider: EmailProvider;

  beforeEach(() => {
    provider = new EmailProvider({
      apiKey: 'test-api-key',
      fromEmail: 'noreply@hospital.vn',
      fromName: 'Bệnh viện Đa khoa'
    });
  });

  describe('getType', () => {
    it('should return EMAIL as type', () => {
      expect(provider.getType()).toBe('EMAIL');
    });
  });

  describe('isAvailable', () => {
    it('should return true when configured', async () => {
      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false when not configured', async () => {
      const unconfiguredProvider = new EmailProvider({
        apiKey: '',
        fromEmail: '',
        fromName: ''
      });
      const isAvailable = await unconfiguredProvider.isAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('deliver', () => {
    it('should deliver email successfully', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({
        email: 'patient@example.com'
      });
      const content = TestMocks.createMockContent({
        subject: 'Test Email',
        body: 'This is a test email'
      });
      const channel = NotificationChannel.create('EMAIL');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel,
        metadata: { notificationId: 'test-123' }
      });

      // Assert
      expect(result.status).toBe('SENT');
      expect(result.messageId).toBeDefined();
      expect(result.deliveredAt).toBeDefined();
    });

    it('should fail when recipient has no email', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({
        email: null
      });
      const content = TestMocks.createMockContent();
      const channel = NotificationChannel.create('EMAIL');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('no email');
    });

    it('should validate email format', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({
        email: 'invalid-email-format'
      });
      const content = TestMocks.createMockContent();
      const channel = NotificationChannel.create('EMAIL');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('Invalid email');
    });
  });

  describe('getDeliveryStatus', () => {
    it('should return delivery status', async () => {
      // Arrange
      const messageId = 'sendgrid-message-123';

      // Act
      const status = await provider.getDeliveryStatus(messageId);

      // Assert
      expect(status.status).toBe('DELIVERED');
      expect(status.deliveredAt).toBeDefined();
    });
  });
});


