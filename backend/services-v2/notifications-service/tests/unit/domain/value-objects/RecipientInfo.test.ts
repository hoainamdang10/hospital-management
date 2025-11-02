/**
 * RecipientInfo - Unit Tests
 * Tests Vietnamese healthcare recipient value object
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RecipientInfo } from '../../../../src/domain/value-objects/RecipientInfo';

describe('RecipientInfo', () => {
  describe('create', () => {
    it('should create valid recipient info', () => {
      // Arrange
      const data = {
        recipientId: 'patient-123',
        recipientType: 'PATIENT' as const,
        fullName: 'Nguyễn Văn Anh',
        contactInfo: {
          email: 'patient@example.com',
          phoneNumber: '+84912345678'
        },
        preferences: {
          preferredChannels: ['EMAIL', 'SMS'],
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi' as const,
          optOut: {
            marketing: false,
            reminders: false,
            emergency: false
          }
        }
      };

      // Act
      const recipient = RecipientInfo.create(data);

      // Assert
      expect(recipient.getRecipientId()).toBe('patient-123');
      expect(recipient.getFullName()).toBe('Nguyễn Văn Anh');
      expect(recipient.getPreferredLanguage()).toBe('vi');
    });

    it('should validate Vietnamese name format', () => {
      // Arrange
      const data = {
        recipientId: 'patient-123',
        recipientType: 'PATIENT' as const,
        fullName: 'X', // Too short
        contactInfo: {
          email: 'patient@example.com',
          phoneNumber: '+84912345678'
        },
        preferences: {
          preferredChannels: ['EMAIL'],
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi' as const,
          optOut: { marketing: false, reminders: false, emergency: false }
        }
      };

      // Act & Assert
      expect(() => RecipientInfo.create(data)).toThrow();
    });

    it('should accept Vietnamese names with diacritics', () => {
      // Arrange
      const vietnameseNames = [
        'Nguyễn Văn Anh',
        'Trần Thị Bình',
        'Lê Hoàng Cường',
        'Phạm Thị Diễm'
      ];

      // Act & Assert
      vietnameseNames.forEach(name => {
        const recipient = RecipientInfo.create({
          recipientId: 'test',
          recipientType: 'PATIENT',
          fullName: name,
          contactInfo: { email: 'test@test.com', phoneNumber: '+84912345678' },
          preferences: {
            preferredChannels: ['EMAIL'],
            timezone: 'Asia/Ho_Chi_Minh',
            language: 'vi',
            optOut: { marketing: false, reminders: false, emergency: false }
          }
        });
        expect(recipient.getFullName()).toBe(name);
      });
    });
  });

  describe('canReceiveOnChannel', () => {
    it('should check if recipient can receive on channel', () => {
      // Arrange
      const recipient = RecipientInfo.create({
        recipientId: 'patient-123',
        recipientType: 'PATIENT',
        fullName: 'Nguyễn Văn Anh',
        contactInfo: {
          email: 'patient@example.com',
          phoneNumber: '+84912345678'
        },
        preferences: {
          preferredChannels: ['EMAIL', 'SMS'],
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi',
          optOut: { marketing: false, reminders: false, emergency: false }
        }
      });

      // Act & Assert
      expect(recipient.canReceiveOnChannel('EMAIL')).toBe(true);
      expect(recipient.canReceiveOnChannel('SMS')).toBe(true);
      expect(recipient.canReceiveOnChannel('PUSH')).toBe(false);
    });
  });

  describe('getPreferredLanguage', () => {
    it('should return Vietnamese as preferred language', () => {
      // Arrange
      const recipient = RecipientInfo.create({
        recipientId: 'patient-123',
        recipientType: 'PATIENT',
        fullName: 'Nguyễn Văn Anh',
        contactInfo: { email: 'test@test.com', phoneNumber: '+84912345678' },
        preferences: {
          preferredChannels: ['EMAIL'],
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi',
          optOut: { marketing: false, reminders: false, emergency: false }
        }
      });

      // Act
      const language = recipient.getPreferredLanguage();

      // Assert
      expect(language).toBe('vi');
    });
  });
});


