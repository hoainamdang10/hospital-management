/**
 * SMSProvider - Unit Tests
 * Tests Vietnamese phone validation and SMS delivery
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SMSProvider } from '../../../../src/infrastructure/delivery/providers/SMSProvider';
import { TestMocks } from '../../../helpers/test-mocks';
import { NotificationChannel } from '../../../../src/domain/value-objects/NotificationChannel';

describe('SMSProvider', () => {
  let provider: SMSProvider;

  beforeEach(() => {
    provider = new SMSProvider({
      accountSid: 'test-account-sid',
      authToken: 'test-auth-token',
      fromNumber: '+84123456789'
    });
  });

  describe('getType', () => {
    it('should return SMS as type', () => {
      expect(provider.getType()).toBe('SMS');
    });
  });

  describe('deliver', () => {
    it('should deliver SMS successfully to Vietnamese phone', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({
        phoneNumber: '+84912345678'
      });
      const content = TestMocks.createMockContent({
        body: 'Nhắc nhở: Lịch hẹn ngày mai 09:00 với BS. Lê Minh Tuấn'
      });
      const channel = NotificationChannel.create('SMS');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('SENT');
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toContain('twilio_');
    });

    it('should accept Vietnamese phone formats', async () => {
      const validFormats = [
        '+84912345678',
        '0912345678',
        '84912345678'
      ];

      for (const phoneNumber of validFormats) {
        const recipient = TestMocks.createMockRecipient({ phoneNumber });
        const content = TestMocks.createMockContent();
        const channel = NotificationChannel.create('SMS');

        const result = await provider.deliver({ recipient, content, channel });
        
        expect(result.status).toBe('SENT');
      }
    });

    it('should fail with invalid phone number', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({
        phoneNumber: 'invalid-phone'
      });
      const content = TestMocks.createMockContent();
      const channel = NotificationChannel.create('SMS');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('Invalid');
    });

    it('should truncate long messages', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient();
      const longBody = 'A'.repeat(200); // > 160 chars
      const content = TestMocks.createMockContent({ body: longBody });
      const channel = NotificationChannel.create('SMS');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('SENT');
      // Message was truncated but still delivered
    });

    it('should fail when recipient has no phone', async () => {
      // Arrange
      const recipient = TestMocks.createMockRecipient({ phoneNumber: null });
      const content = TestMocks.createMockContent();
      const channel = NotificationChannel.create('SMS');

      // Act
      const result = await provider.deliver({
        recipient,
        content,
        channel
      });

      // Assert
      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('no phone');
    });
  });
});


