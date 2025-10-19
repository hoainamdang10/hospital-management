/**
 * SendGridEmailService - Infrastructure Email Service
 * Implements IEmailService using SendGrid API
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import sgMail from '@sendgrid/mail';
import {
  IEmailService,
  EmailVerificationData,
  EmailSuccessData,
  StaffInvitationData
} from '../../application/services/IEmailService';
import { ILogger } from '../../application/services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface SendGridEmailServiceConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  frontendUrl: string;
}

export class SendGridEmailService implements IEmailService {
  private fromEmail: string;
  private fromName: string;
  private frontendUrl: string;

  constructor(
    config: SendGridEmailServiceConfig,
    private logger: ILogger
  ) {
    // Initialize SendGrid with API key
    sgMail.setApiKey(config.apiKey);
    
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.frontendUrl = config.frontendUrl;

    this.logger.info('SendGridEmailService initialized', {
      fromEmail: this.fromEmail,
      fromName: this.fromName
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    try {
      this.logger.info('Sending verification email', {
        email: data.email,
        userName: data.userName
      });

      const htmlContent = this.getVerificationEmailTemplate(
        data.userName,
        data.verificationUrl
      );

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Xác thực email - Hospital Management System',
        html: htmlContent
      };

      const result = await sgMail.send(msg);

      this.logger.info('Verification email sent successfully', {
        email: data.email,
        statusCode: result[0].statusCode,
        messageId: result[0].headers['x-message-id']
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', {
        email: data.email,
        error: getErrorMessage(error)
      });
      throw new Error(`Gửi email xác thực thất bại: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Send verification success notification
   */
  async sendVerificationSuccessEmail(data: EmailSuccessData): Promise<void> {
    try {
      this.logger.info('Sending verification success email', {
        email: data.email,
        userName: data.userName
      });

      const htmlContent = this.getVerificationSuccessTemplate(data.userName);

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Email đã được xác thực thành công - Hospital Management System',
        html: htmlContent
      };

      const result = await sgMail.send(msg);

      this.logger.info('Verification success email sent successfully', {
        email: data.email,
        statusCode: result[0].statusCode
      });
    } catch (error) {
      this.logger.error('Failed to send verification success email', {
        email: data.email,
        error: getErrorMessage(error)
      });
      // Don't throw error for success notification
      // This is not critical
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    userName: string
  ): Promise<void> {
    try {
      this.logger.info('Sending password reset email', {
        email,
        userName
      });

      const htmlContent = this.getPasswordResetTemplate(userName, resetUrl);

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Đặt lại mật khẩu - Hospital Management System',
        html: htmlContent
      };

      await sgMail.send(msg);

      this.logger.info('Password reset email sent successfully', {
        email
      });
    } catch (error) {
      this.logger.error('Failed to send password reset email', {
        email,
        error: getErrorMessage(error)
      });
      throw new Error(`Gửi email đặt lại mật khẩu thất bại: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    try {
      this.logger.info('Sending welcome email', {
        email,
        userName
      });

      const htmlContent = this.getWelcomeEmailTemplate(userName);

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Chào mừng đến với Hospital Management System',
        html: htmlContent
      };

      await sgMail.send(msg);

      this.logger.info('Welcome email sent successfully', {
        email
      });
    } catch (error) {
      this.logger.error('Failed to send welcome email', {
        email,
        error: getErrorMessage(error)
      });
      // Don't throw error for welcome email
      // This is not critical
    }
  }

  /**
   * Send staff invitation email
   */
  async sendStaffInvitationEmail(data: StaffInvitationData): Promise<void> {
    try {
      this.logger.info('Sending staff invitation email', {
        email: data.email,
        userName: data.userName,
        role: data.role
      });

      const htmlContent = this.getStaffInvitationTemplate(
        data.userName,
        data.role,
        data.invitationUrl,
        data.expiresAt
      );

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Lời mời kích hoạt tài khoản - Hospital Management System',
        html: htmlContent
      };

      await sgMail.send(msg);

      this.logger.info('Staff invitation email sent successfully', {
        email: data.email
      });
    } catch (error) {
      this.logger.error('Failed to send staff invitation email', {
        email: data.email,
        error: getErrorMessage(error)
      });
      throw new Error(`Gửi email lời mời thất bại: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(userName: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <h1 style="color: #2c3e50; text-align: center;">🏥 Hospital Management System</h1>
    
    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <h2 style="color: #3498db;">Xác thực Email</h2>
      
      <p>Xin chào <strong>${userName}</strong>,</p>
      
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Hospital Management System. Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Xác thực Email
        </a>
      </div>
      
      <p style="color: #7f8c8d; font-size: 14px;">
        Hoặc copy link sau vào trình duyệt:<br>
        <a href="${verificationUrl}" style="color: #3498db; word-break: break-all;">${verificationUrl}</a>
      </p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Lưu ý:</strong> Link xác thực này sẽ hết hạn sau 24 giờ. Nếu bạn không yêu cầu xác thực email này, vui lòng bỏ qua email này.
        </p>
      </div>
      
      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Trân trọng,<br>
        <strong>Hospital Management Team</strong>
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
      <p>© 2025 Hospital Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Verification success template
   */
  private getVerificationSuccessTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email đã được xác thực</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <h1 style="color: #2c3e50; text-align: center;">🏥 Hospital Management System</h1>

    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 60px;">✅</div>
      </div>

      <h2 style="color: #27ae60; text-align: center;">Email đã được xác thực thành công!</h2>

      <p>Xin chào <strong>${userName}</strong>,</p>

      <p>Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập vào hệ thống và sử dụng đầy đủ các tính năng.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/login"
           style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Đăng nhập ngay
        </a>
      </div>

      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Trân trọng,<br>
        <strong>Hospital Management Team</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
      <p>© 2025 Hospital Management System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Password reset template
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <h1 style="color: #2c3e50; text-align: center;">🏥 Hospital Management System</h1>

    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <h2 style="color: #e74c3c;">Yêu cầu đặt lại mật khẩu</h2>

      <p>Xin chào <strong>${userName}</strong>,</p>

      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Hospital Management System. Để tiếp tục, vui lòng nhấp vào nút bên dưới:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Đặt lại mật khẩu
        </a>
      </div>

      <p style="color: #7f8c8d; font-size: 14px;">
        Hoặc copy link sau vào trình duyệt:<br>
        <a href="${resetUrl}" style="color: #e74c3c; word-break: break-all;">${resetUrl}</a>
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Lưu ý bảo mật:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
          <li>Link đặt lại mật khẩu này sẽ hết hạn sau <strong>1 giờ</strong></li>
          <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
          <li>Không chia sẻ link này với bất kỳ ai</li>
          <li>Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</li>
        </ul>
      </div>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #721c24;">
          <strong>🔒 Bảo mật tài khoản:</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: #721c24; font-size: 14px;">
          Nếu bạn không thực hiện yêu cầu này, có thể ai đó đang cố gắng truy cập tài khoản của bạn.
          Vui lòng liên hệ với quản trị viên hệ thống ngay lập tức để bảo vệ tài khoản.
        </p>
      </div>

      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Trân trọng,<br>
        <strong>Hospital Management Team</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
      <p>© 2025 Hospital Management System. All rights reserved.</p>
      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng đến với Hospital Management System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <h1 style="color: #2c3e50; text-align: center;">🏥 Hospital Management System</h1>

    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 60px;">🎉</div>
      </div>

      <h2 style="color: #27ae60; text-align: center;">Chào mừng bạn đến với Hospital Management System!</h2>

      <p>Xin chào <strong>${userName}</strong>,</p>

      <p>Chúc mừng bạn đã hoàn tất quá trình đăng ký tài khoản! Chúng tôi rất vui mừng được chào đón bạn vào hệ thống quản lý bệnh viện của chúng tôi.</p>

      <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #2e7d32;">
          <strong>✨ Bạn có thể bắt đầu sử dụng các tính năng sau:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #2e7d32;">
          <li>Đặt lịch khám bệnh trực tuyến</li>
          <li>Xem lịch sử khám bệnh và kết quả xét nghiệm</li>
          <li>Quản lý hồ sơ sức khỏe cá nhân</li>
          <li>Nhận thông báo về lịch hẹn và kết quả khám</li>
          <li>Thanh toán viện phí trực tuyến</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.frontendUrl}/login"
           style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Đăng nhập ngay
        </a>
      </div>

      <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #1565c0;">
          <strong>📱 Hướng dẫn sử dụng:</strong>
        </p>
        <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1565c0;">
          <li>Đăng nhập vào hệ thống bằng email và mật khẩu</li>
          <li>Hoàn thiện thông tin hồ sơ cá nhân</li>
          <li>Khám phá các tính năng trong menu điều hướng</li>
          <li>Đặt lịch khám đầu tiên của bạn</li>
        </ol>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #856404;">
          <strong>💡 Mẹo hữu ích:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404; font-size: 14px;">
          <li>Cập nhật đầy đủ thông tin liên hệ để nhận thông báo kịp thời</li>
          <li>Thêm thông tin bảo hiểm y tế (BHYT/BHTN) để thanh toán nhanh hơn</li>
          <li>Lưu lại lịch sử khám bệnh để bác sĩ có thể tư vấn tốt hơn</li>
        </ul>
      </div>

      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua email hoặc hotline hỗ trợ.
      </p>

      <p style="margin-top: 20px; color: #7f8c8d; font-size: 14px;">
        Trân trọng,<br>
        <strong>Hospital Management Team</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
      <p>© 2025 Hospital Management System. All rights reserved.</p>
      <p>Hotline hỗ trợ: 1900-xxxx | Email: support@hospital.vn</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Staff invitation email template
   */
  private getStaffInvitationTemplate(
    userName: string,
    role: string,
    invitationUrl: string,
    expiresAt: Date
  ): string {
    // Format expiry date in Vietnamese
    const expiryDate = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(expiresAt);

    // Role display names in Vietnamese
    const roleNames: Record<string, string> = {
      'ADMIN': 'Quản trị viên',
      'DOCTOR': 'Bác sĩ',
      'NURSE': 'Y tá',
      'RECEPTIONIST': 'Lễ tân'
    };

    const roleDisplay = roleNames[role] || role;

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời kích hoạt tài khoản</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
    <h1 style="color: #2c3e50; text-align: center;">🏥 Hospital Management System</h1>

    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <h2 style="color: #3498db;">Lời mời kích hoạt tài khoản nhân viên</h2>

      <p>Xin chào <strong>${userName}</strong>,</p>

      <p>Bạn đã được mời tham gia vào hệ thống Hospital Management System với vai trò <strong>${roleDisplay}</strong>.</p>

      <p>Để kích hoạt tài khoản của bạn, vui lòng nhấp vào nút bên dưới và thiết lập mật khẩu:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}"
           style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Kích hoạt tài khoản
        </a>
      </div>

      <p style="color: #7f8c8d; font-size: 14px;">
        Hoặc copy link sau vào trình duyệt:<br>
        <a href="${invitationUrl}" style="color: #3498db; word-break: break-all;">${invitationUrl}</a>
      </p>

      <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #2e7d32;">
          <strong>ℹ️ Thông tin quan trọng:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #2e7d32;">
          <li>Vai trò: <strong>${roleDisplay}</strong></li>
          <li>Email đăng nhập: <strong>${userName.split(' ')[0].toLowerCase()}@hospital.vn</strong></li>
          <li>Link kích hoạt hết hạn vào: <strong>${expiryDate}</strong></li>
        </ul>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Lưu ý bảo mật:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
          <li>Link này chỉ sử dụng được <strong>1 lần duy nhất</strong></li>
          <li>Không chia sẻ link này với bất kỳ ai</li>
          <li>Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email</li>
          <li>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số</li>
        </ul>
      </div>

      <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #1565c0;">
          <strong>📋 Các bước kích hoạt:</strong>
        </p>
        <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #1565c0;">
          <li>Nhấp vào nút "Kích hoạt tài khoản" ở trên</li>
          <li>Nhập họ tên đầy đủ và số điện thoại (tùy chọn)</li>
          <li>Tạo mật khẩu mạnh theo yêu cầu</li>
          <li>Xác nhận mật khẩu</li>
          <li>Nhấp "Kích hoạt tài khoản"</li>
          <li>Đăng nhập vào hệ thống với email và mật khẩu vừa tạo</li>
        </ol>
      </div>

      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Nếu bạn gặp vấn đề khi kích hoạt tài khoản, vui lòng liên hệ với quản trị viên hệ thống.
      </p>

      <p style="margin-top: 30px; color: #7f8c8d; font-size: 14px;">
        Trân trọng,<br>
        <strong>Hospital Management Team</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px;">
      <p>© 2025 Hospital Management System. All rights reserved.</p>
      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
