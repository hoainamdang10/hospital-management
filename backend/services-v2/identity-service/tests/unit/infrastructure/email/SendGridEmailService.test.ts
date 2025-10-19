/**
 * SendGridEmailService Unit Tests
 * Tests email template generation and SendGrid integration
 */

import { SendGridEmailService } from '@infrastructure/email/SendGridEmailService';
import { ILogger } from '@application/services/ILogger';
import sgMail from '@sendgrid/mail';

// Mock SendGrid
jest.mock('@sendgrid/mail');

describe('SendGridEmailService', () => {
  let emailService: SendGridEmailService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockSgMailSend: jest.Mock;

  const testConfig = {
    apiKey: 'SG.test-api-key-1234567890',
    fromEmail: 'test@hospital.vn',
    fromName: 'Hospital Test System',
    frontendUrl: 'http://localhost:3000'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Mock SendGrid send method
    mockSgMailSend = jest.fn().mockResolvedValue([
      {
        statusCode: 202,
        headers: {
          'x-message-id': 'test-message-id-123'
        }
      }
    ]);
    (sgMail.send as jest.Mock) = mockSgMailSend;

    // Create service instance
    emailService = new SendGridEmailService(testConfig, mockLogger);
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(sgMail.setApiKey).toHaveBeenCalledWith(testConfig.apiKey);
    });
  });

  describe('sendVerificationEmail', () => {
    const testData = {
      email: 'patient@test.com',
      userName: 'Nguyễn Văn A',
      verificationUrl: 'http://localhost:3000/verify?token=abc123'
    };

    it('should send verification email with HTML template', async () => {
      await emailService.sendVerificationEmail(testData);

      expect(mockSgMailSend).toHaveBeenCalledTimes(1);
      const sentMessage = mockSgMailSend.mock.calls[0][0];

      expect(sentMessage.to).toBe(testData.email);
      expect(sentMessage.from.email).toBe(testConfig.fromEmail);
      expect(sentMessage.from.name).toBe(testConfig.fromName);
      expect(sentMessage.subject).toBe('Xác thực email - Hospital Management System');
      expect(sentMessage.html).toContain('Xác thực Email');
      expect(sentMessage.html).toContain(testData.userName);
      expect(sentMessage.html).toContain(testData.verificationUrl);
      expect(sentMessage.html).toContain('<!DOCTYPE html>');
    });

    it('should log success when email sent', async () => {
      await emailService.sendVerificationEmail(testData);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Sending verification email',
        expect.objectContaining({
          email: testData.email,
          userName: testData.userName
        })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Verification email sent successfully',
        expect.objectContaining({
          email: testData.email,
          statusCode: 202
        })
      );
    });

    it('should throw error when SendGrid fails', async () => {
      const sendGridError = new Error('SendGrid API error');
      mockSgMailSend.mockRejectedValueOnce(sendGridError);

      await expect(emailService.sendVerificationEmail(testData)).rejects.toThrow(
        'Gửi email xác thực thất bại'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send verification email',
        expect.objectContaining({
          email: testData.email
        })
      );
    });
  });

  describe('sendVerificationSuccessEmail', () => {
    const testData = {
      email: 'patient@test.com',
      userName: 'Nguyễn Văn B'
    };

    it('should send verification success email with HTML template', async () => {
      await emailService.sendVerificationSuccessEmail(testData);

      expect(mockSgMailSend).toHaveBeenCalledTimes(1);
      const sentMessage = mockSgMailSend.mock.calls[0][0];

      expect(sentMessage.to).toBe(testData.email);
      expect(sentMessage.subject).toBe('Email đã được xác thực thành công - Hospital Management System');
      expect(sentMessage.html).toContain('Email đã được xác thực thành công');
      expect(sentMessage.html).toContain(testData.userName);
      expect(sentMessage.html).toContain('✅');
      expect(sentMessage.html).toContain('Đăng nhập ngay');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'patient@test.com';
    const testUserName = 'Nguyễn Văn C';
    const testResetUrl = 'http://localhost:3000/reset-password?token=xyz789';

    it('should send password reset email with HTML template', async () => {
      await emailService.sendPasswordResetEmail(testEmail, testResetUrl, testUserName);

      expect(mockSgMailSend).toHaveBeenCalledTimes(1);
      const sentMessage = mockSgMailSend.mock.calls[0][0];

      expect(sentMessage.to).toBe(testEmail);
      expect(sentMessage.subject).toBe('Đặt lại mật khẩu - Hospital Management System');
      expect(sentMessage.html).toContain('Yêu cầu đặt lại mật khẩu');
      expect(sentMessage.html).toContain(testUserName);
      expect(sentMessage.html).toContain(testResetUrl);
      expect(sentMessage.html).toContain('Đặt lại mật khẩu');
      expect(sentMessage.html).toContain('<!DOCTYPE html>');
    });

    it('should include security warnings in password reset email', async () => {
      await emailService.sendPasswordResetEmail(testEmail, testResetUrl, testUserName);

      const sentMessage = mockSgMailSend.mock.calls[0][0];
      expect(sentMessage.html).toContain('Lưu ý bảo mật');
      expect(sentMessage.html).toContain('1 giờ');
      expect(sentMessage.html).toContain('Bảo mật tài khoản');
    });

    it('should throw error when SendGrid fails (password reset is critical)', async () => {
      mockSgMailSend.mockRejectedValueOnce(new Error('SendGrid error'));

      await expect(
        emailService.sendPasswordResetEmail(testEmail, testResetUrl, testUserName)
      ).rejects.toThrow('Gửi email đặt lại mật khẩu thất bại');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendWelcomeEmail', () => {
    const testEmail = 'patient@test.com';
    const testUserName = 'Nguyễn Văn D';

    it('should send welcome email with HTML template', async () => {
      await emailService.sendWelcomeEmail(testEmail, testUserName);

      expect(mockSgMailSend).toHaveBeenCalledTimes(1);
      const sentMessage = mockSgMailSend.mock.calls[0][0];

      expect(sentMessage.to).toBe(testEmail);
      expect(sentMessage.subject).toBe('Chào mừng đến với Hospital Management System');
      expect(sentMessage.html).toContain('Chào mừng bạn đến với Hospital Management System');
      expect(sentMessage.html).toContain(testUserName);
      expect(sentMessage.html).toContain('🎉');
      expect(sentMessage.html).toContain('Đăng nhập ngay');
      expect(sentMessage.html).toContain('<!DOCTYPE html>');
    });

    it('should include feature list in welcome email', async () => {
      await emailService.sendWelcomeEmail(testEmail, testUserName);

      const sentMessage = mockSgMailSend.mock.calls[0][0];
      expect(sentMessage.html).toContain('Đặt lịch khám bệnh trực tuyến');
      expect(sentMessage.html).toContain('Xem lịch sử khám bệnh');
      expect(sentMessage.html).toContain('Quản lý hồ sơ sức khỏe');
      expect(sentMessage.html).toContain('Thanh toán viện phí');
    });

    it('should not throw error when SendGrid fails (graceful degradation)', async () => {
      mockSgMailSend.mockRejectedValueOnce(new Error('SendGrid error'));

      await expect(
        emailService.sendWelcomeEmail(testEmail, testUserName)
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendStaffInvitationEmail', () => {
    const testData = {
      email: 'doctor@test.com',
      userName: 'Bác sĩ Nguyễn Văn E',
      role: 'DOCTOR',
      invitationUrl: 'http://localhost:3000/auth/activate?token=inv123',
      expiresAt: new Date('2025-01-15T10:00:00Z')
    };

    it('should send staff invitation email with HTML template', async () => {
      await emailService.sendStaffInvitationEmail(testData);

      expect(mockSgMailSend).toHaveBeenCalledTimes(1);
      const sentMessage = mockSgMailSend.mock.calls[0][0];

      expect(sentMessage.to).toBe(testData.email);
      expect(sentMessage.subject).toBe('Lời mời kích hoạt tài khoản - Hospital Management System');
      expect(sentMessage.html).toContain('Lời mời kích hoạt tài khoản nhân viên');
      expect(sentMessage.html).toContain(testData.userName);
      expect(sentMessage.html).toContain('Bác sĩ'); // Role display name
      expect(sentMessage.html).toContain(testData.invitationUrl);
      expect(sentMessage.html).toContain('<!DOCTYPE html>');
    });

    it('should include role-specific information', async () => {
      await emailService.sendStaffInvitationEmail(testData);

      const sentMessage = mockSgMailSend.mock.calls[0][0];
      expect(sentMessage.html).toContain('Vai trò');
      expect(sentMessage.html).toContain('Bác sĩ');
    });

    it('should include security warnings and activation steps', async () => {
      await emailService.sendStaffInvitationEmail(testData);

      const sentMessage = mockSgMailSend.mock.calls[0][0];
      expect(sentMessage.html).toContain('Lưu ý bảo mật');
      expect(sentMessage.html).toContain('1 lần duy nhất');
      expect(sentMessage.html).toContain('Các bước kích hoạt');
    });

    it('should throw error when SendGrid fails', async () => {
      mockSgMailSend.mockRejectedValueOnce(new Error('SendGrid error'));

      await expect(emailService.sendStaffInvitationEmail(testData)).rejects.toThrow(
        'Gửi email lời mời thất bại'
      );
    });
  });

  describe('Email Template Quality', () => {
    it('all email templates should be valid HTML', async () => {
      const templates = [
        () => emailService.sendVerificationEmail({
          email: 'test@test.com',
          userName: 'Test User',
          verificationUrl: 'http://test.com'
        }),
        () => emailService.sendVerificationSuccessEmail({
          email: 'test@test.com',
          userName: 'Test User'
        }),
        () => emailService.sendPasswordResetEmail('test@test.com', 'http://test.com', 'Test User'),
        () => emailService.sendWelcomeEmail('test@test.com', 'Test User'),
        () => emailService.sendStaffInvitationEmail({
          email: 'test@test.com',
          userName: 'Test User',
          role: 'DOCTOR',
          invitationUrl: 'http://test.com',
          expiresAt: new Date()
        })
      ];

      for (const sendEmail of templates) {
        await sendEmail();
        const sentMessage = mockSgMailSend.mock.calls[mockSgMailSend.mock.calls.length - 1][0];
        
        expect(sentMessage.html).toContain('<!DOCTYPE html>');
        expect(sentMessage.html).toContain('<html lang="vi">');
        expect(sentMessage.html).toContain('</html>');
        expect(sentMessage.html).toContain('Hospital Management System');
      }
    });
  });
});

