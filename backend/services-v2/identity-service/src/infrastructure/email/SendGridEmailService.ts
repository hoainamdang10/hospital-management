/**
 * SendGridEmailService - Infrastructure Email Service
 * Implements IEmailService using SendGrid API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import sgMail from "@sendgrid/mail";
import {
  IEmailService,
  EmailVerificationData,
  EmailSuccessData,
  StaffInvitationData,
} from "../../application/services/IEmailService";
import { ILogger } from "../../application/services/ILogger";
import { getErrorMessage } from "../../utils/error-helper";

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
    private logger: ILogger,
  ) {
    // Initialize SendGrid with API key
    sgMail.setApiKey(config.apiKey);

    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.frontendUrl = config.frontendUrl;

    this.logger.info("SendGridEmailService initialized", {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    try {
      this.logger.info("Sending verification email", {
        email: data.email,
        userName: data.userName,
      });

      const htmlContent = this.getVerificationEmailTemplate(
        data.userName,
        data.verificationUrl,
      );

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: "Xác thực email - Hospital Management System",
        html: htmlContent,
      };

      const result = await sgMail.send(msg);

      this.logger.info("Verification email sent successfully", {
        email: data.email,
        statusCode: result[0].statusCode,
        messageId: result[0].headers["x-message-id"],
      });
    } catch (error) {
      this.logger.error("Failed to send verification email", {
        email: data.email,
        error: getErrorMessage(error),
      });
      throw new Error(`Gửi email xác thực thất bại: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Send verification success notification
   */
  async sendVerificationSuccessEmail(data: EmailSuccessData): Promise<void> {
    try {
      this.logger.info("Sending verification success email", {
        email: data.email,
        userName: data.userName,
      });

      const htmlContent = this.getVerificationSuccessTemplate(data.userName);

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject:
          "Email đã được xác thực thành công - Hospital Management System",
        html: htmlContent,
      };

      const result = await sgMail.send(msg);

      this.logger.info("Verification success email sent successfully", {
        email: data.email,
        statusCode: result[0].statusCode,
      });
    } catch (error) {
      this.logger.error("Failed to send verification success email", {
        email: data.email,
        error: getErrorMessage(error),
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
    userName: string,
  ): Promise<void> {
    try {
      this.logger.info("Sending password reset email", {
        email,
        userName,
      });

      const htmlContent = this.getPasswordResetTemplate(userName, resetUrl);

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: "Đặt lại mật khẩu - Hospital Management System",
        html: htmlContent,
      };

      await sgMail.send(msg);

      this.logger.info("Password reset email sent successfully", {
        email,
      });
    } catch (error) {
      this.logger.error("Failed to send password reset email", {
        email,
        error: getErrorMessage(error),
      });
      throw new Error(
        `Gửi email đặt lại mật khẩu thất bại: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    try {
      this.logger.info("Sending welcome email", {
        email,
        userName,
      });

      const htmlContent = this.getWelcomeEmailTemplate(userName);

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: "Chào mừng đến với Hospital Management System",
        html: htmlContent,
      };

      await sgMail.send(msg);

      this.logger.info("Welcome email sent successfully", {
        email,
      });
    } catch (error) {
      this.logger.error("Failed to send welcome email", {
        email,
        error: getErrorMessage(error),
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
      this.logger.info("Sending staff invitation email", {
        email: data.email,
        userName: data.userName,
        role: data.role,
      });

      const htmlContent = this.getStaffInvitationTemplate(
        data.userName,
        data.role,
        data.invitationUrl,
        data.expiresAt,
      );

      const msg = {
        to: data.email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: "Lời mời kích hoạt tài khoản - Hospital Management System",
        html: htmlContent,
      };

      await sgMail.send(msg);

      this.logger.info("Staff invitation email sent successfully", {
        email: data.email,
      });
    } catch (error) {
      this.logger.error("Failed to send staff invitation email", {
        email: data.email,
        error: getErrorMessage(error),
      });
      throw new Error(`Gửi email lời mời thất bại: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Email verification template - Modern Healthcare Design
   */
  private getVerificationEmailTemplate(
    userName: string,
    verificationUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực Email</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%); font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%); width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 10px 25px rgba(8, 145, 178, 0.3);">
                    <span style="font-size: 28px; line-height: 56px;"></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px;">Hospital Management</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">Hệ thống quản lý bệnh viện thông minh</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Accent Top Border -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #0891B2 0%, #22D3EE 50%, #059669 100%);"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="width: 80px; height: 80px; background: linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="font-size: 36px; line-height: 80px;">✉</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #0F172A; text-align: center; letter-spacing: -0.5px;">Xác thực Email</h2>
                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748B; text-align: center;">Chỉ còn một bước nữa để hoàn tất đăng ký</p>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">Xin chào <strong style="color: #0891B2;">${userName}</strong>,</p>

                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                      Cảm ơn bạn đã đăng ký tài khoản tại Hospital Management System. Để hoàn tất quá trình đăng ký và bảo vệ tài khoản của bạn, vui lòng xác thực địa chỉ email bằng cách nhấp vào nút bên dưới:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 32px auto;">
                      <tr>
                        <td style="border-radius: 14px; background: linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%); box-shadow: 0 10px 25px rgba(8, 145, 178, 0.35), 0 4px 6px rgba(8, 145, 178, 0.2);">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                            ✓ Xác thực Email ngay
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #F8FAFC; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B; font-weight: 500;">
                            Hoặc copy link sau vào trình duyệt:
                          </p>
                          <a href="${verificationUrl}" style="font-size: 13px; color: #0891B2; word-break: break-all; text-decoration: none;">${verificationUrl}</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid #F59E0B;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <span style="font-size: 20px;"></span>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 600;">Lưu ý quan trọng</p>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #A16207; line-height: 1.5;">
                                  Link xác thực này sẽ hết hạn sau <strong>24 giờ</strong>. Nếu bạn không yêu cầu xác thực email này, vui lòng bỏ qua email này.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 500;">Trân trọng,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A; font-weight: 600;">Hospital Management Team</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #CBD5E1);"></td>
                  <td style="padding: 0 16px;">
                    <span style="font-size: 12px; color: #94A3B8;">●</span>
                  </td>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, #CBD5E1, transparent);"></td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8;">
                © 2025 Hospital Management System. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #CBD5E1;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Verification success template - Modern Healthcare Design
   */
  private getVerificationSuccessTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email đã được xác thực</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfdf5 100%); font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfdf5 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #059669 0%, #10B981 100%); width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);">
                    <span style="font-size: 28px; line-height: 56px;"></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px;">Hospital Management</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">Hệ thống quản lý bệnh viện thông minh</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Accent Top Border -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #059669 0%, #10B981 50%, #34D399 100%);"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Success Icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="width: 100px; height: 100px; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);">
                          <span style="font-size: 48px; line-height: 100px;"></span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #059669; text-align: center; letter-spacing: -0.5px;">Xác thực thành công!</h2>
                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748B; text-align: center;">Email của bạn đã được xác thực</p>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">Xin chào <strong style="color: #059669;">${userName}</strong>,</p>

                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                      Chúc mừng! Email của bạn đã được xác thực thành công. Bây giờ bạn có thể đăng nhập vào hệ thống và sử dụng đầy đủ các tính năng y tế thông minh của chúng tôi.
                    </p>

                    <!-- Success Features Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #047857;"> Bạn đã có thể sử dụng:</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #065F46;">
                                <span style="margin-right: 8px;">✓</span> Đặt lịch khám bệnh trực tuyến
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #065F46;">
                                <span style="margin-right: 8px;">✓</span> Xem lịch sử khám và kết quả xét nghiệm
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #065F46;">
                                <span style="margin-right: 8px;">✓</span> Quản lý hồ sơ sức khỏe cá nhân
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px; color: #065F46;">
                                <span style="margin-right: 8px;">✓</span> Thanh toán viện phí trực tuyến
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 14px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); box-shadow: 0 10px 25px rgba(5, 150, 105, 0.35), 0 4px 6px rgba(5, 150, 105, 0.2);">
                          <a href="${this.frontendUrl}/login" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                            → Đăng nhập ngay
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 500;">Trân trọng,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A; font-weight: 600;">Hospital Management Team</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #CBD5E1);"></td>
                  <td style="padding: 0 16px;">
                    <span style="font-size: 12px; color: #94A3B8;">●</span>
                  </td>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, #CBD5E1, transparent);"></td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8;">
                © 2025 Hospital Management System. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Password reset template - Modern Healthcare Design
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fef3c7 100%); font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fef3c7 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);">
                    <span style="font-size: 28px; line-height: 56px;"></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px;">Hospital Management</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">Hệ thống quản lý bệnh viện thông minh</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Accent Top Border -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #DC2626 0%, #EF4444 50%, #F97316 100%);"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="width: 80px; height: 80px; background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                          <span style="font-size: 36px; line-height: 80px;">🔐</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #DC2626; text-align: center; letter-spacing: -0.5px;">Đặt lại mật khẩu</h2>
                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748B; text-align: center;">Yêu cầu khôi phục mật khẩu tài khoản</p>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">Xin chào <strong style="color: #DC2626;">${userName}</strong>,</p>

                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Hospital Management System. Để tiếp tục, vui lòng nhấp vào nút bên dưới:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 32px auto;">
                      <tr>
                        <td style="border-radius: 14px; background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); box-shadow: 0 10px 25px rgba(220, 38, 38, 0.35), 0 4px 6px rgba(220, 38, 38, 0.2);">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                             Đặt lại mật khẩu
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #F8FAFC; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B; font-weight: 500;">
                            Hoặc copy link sau vào trình duyệt:
                          </p>
                          <a href="${resetUrl}" style="font-size: 13px; color: #DC2626; word-break: break-all; text-decoration: none;">${resetUrl}</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Warning Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <span style="font-size: 20px;"></span>
                              </td>
                              <td>
                                <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; font-weight: 600;">Lưu ý bảo mật</p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Link hết hạn sau <strong>1 giờ</strong></td></tr>
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Không chia sẻ link này với bất kỳ ai</td></tr>
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Mật khẩu mới cần ít nhất 8 ký tự</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Danger Alert Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 12px; border-left: 4px solid #DC2626;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <span style="font-size: 20px;"></span>
                              </td>
                              <td>
                                <p style="margin: 0 0 4px 0; font-size: 14px; color: #991B1B; font-weight: 600;">Bảo vệ tài khoản</p>
                                <p style="margin: 0; font-size: 13px; color: #B91C1C; line-height: 1.5;">
                                  Nếu bạn không yêu cầu đặt lại mật khẩu, có thể ai đó đang cố truy cập tài khoản của bạn. Vui lòng liên hệ quản trị viên ngay.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 500;">Trân trọng,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A; font-weight: 600;">Hospital Management Team</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #CBD5E1);"></td>
                  <td style="padding: 0 16px;">
                    <span style="font-size: 12px; color: #94A3B8;">●</span>
                  </td>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, #CBD5E1, transparent);"></td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8;">
                © 2025 Hospital Management System. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #CBD5E1;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Welcome email template - Modern Healthcare Design
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào mừng đến với Hospital Management System</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%); font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);">
                    <span style="font-size: 28px; line-height: 56px;"></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px;">Hospital Management</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">Hệ thống quản lý bệnh viện thông minh</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Accent Top Border -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #2563EB 0%, #3B82F6 33%, #059669 66%, #10B981 100%);"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Welcome Icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="width: 100px; height: 100px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);">
                          <span style="font-size: 48px; line-height: 100px;"></span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2563EB; text-align: center; letter-spacing: -0.5px;">Chào mừng bạn!</h2>
                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748B; text-align: center;">Tài khoản của bạn đã sẵn sàng sử dụng</p>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">Xin chào <strong style="color: #2563EB;">${userName}</strong>,</p>

                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                      Chúc mừng bạn đã hoàn tất quá trình đăng ký tài khoản! Chúng tôi rất vui mừng được chào đón bạn vào hệ thống quản lý bệnh viện thông minh của chúng tôi.
                    </p>

                    <!-- Features Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 16px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #047857;"> Bạn có thể bắt đầu sử dụng:</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <span style="display: inline-block; width: 24px; height: 24px; background: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; font-size: 12px;">✓</span>
                                Đặt lịch khám bệnh trực tuyến
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <span style="display: inline-block; width: 24px; height: 24px; background: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; font-size: 12px;">✓</span>
                                Xem lịch sử khám bệnh và kết quả xét nghiệm
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <span style="display: inline-block; width: 24px; height: 24px; background: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; font-size: 12px;">✓</span>
                                Quản lý hồ sơ sức khỏe cá nhân
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <span style="display: inline-block; width: 24px; height: 24px; background: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 24px; margin-right: 10px; font-size: 12px;">✓</span>
                                Nhận thông báo lịch hẹn và thanh toán trực tuyến
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="border-radius: 14px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35), 0 4px 6px rgba(37, 99, 235, 0.2);">
                          <a href="${this.frontendUrl}/login" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                            → Đăng nhập ngay
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Getting Started Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 16px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #1D4ED8;"> Hướng dẫn bắt đầu:</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #1E40AF;"><strong>1.</strong> Đăng nhập bằng email và mật khẩu</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #1E40AF;"><strong>2.</strong> Hoàn thiện thông tin hồ sơ cá nhân</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #1E40AF;"><strong>3.</strong> Khám phá các tính năng</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #1E40AF;"><strong>4.</strong> Đặt lịch khám đầu tiên!</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Tips Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid #F59E0B;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <span style="font-size: 20px;"></span>
                              </td>
                              <td>
                                <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; font-weight: 600;">Mẹo hữu ích</p>
                                <p style="margin: 0; font-size: 13px; color: #A16207; line-height: 1.5;">
                                  Thêm thông tin bảo hiểm y tế (BHYT/BHTN) để thanh toán nhanh hơn và được hưởng ưu đãi!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 500;">Trân trọng,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A; font-weight: 600;">Hospital Management Team</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #CBD5E1);"></td>
                  <td style="padding: 0 16px;">
                    <span style="font-size: 12px; color: #94A3B8;">●</span>
                  </td>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, #CBD5E1, transparent);"></td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8;">
                © 2025 Hospital Management System. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #CBD5E1;">
                Hotline hỗ trợ: 1900-xxxx | Email: support@hospital.vn
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Staff invitation email template - Modern Healthcare Design
   */
  private getStaffInvitationTemplate(
    userName: string,
    role: string,
    invitationUrl: string,
    expiresAt: Date,
  ): string {
    // Format expiry date in Vietnamese
    const expiryDate = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(expiresAt);

    // Role display names and colors
    const roleConfig: Record<string, { name: string; color: string; bgColor: string; iconBg: string }> = {
      ADMIN: {
        name: "Quản trị viên",
        color: "#7C3AED",
        bgColor: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        iconBg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)"
      },
      DOCTOR: {
        name: "Bác sĩ",
        color: "#0891B2",
        bgColor: "linear-gradient(135deg, #0EA5E9 0%, #0891B2 100%)",
        iconBg: "linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)"
      },
      PATIENT: {
        name: "Bệnh nhân",
        color: "#059669",
        bgColor: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        iconBg: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
      },
    };

    const config = roleConfig[role] || roleConfig.DOCTOR;
    const roleDisplay = config.name;

    // Role icons
    const roleIcons: Record<string, string> = {
      ADMIN: "👨‍💼",
      DOCTOR: "👨‍⚕",
      PATIENT: "",
    };
    const roleIcon = roleIcons[role] || "";

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời kích hoạt tài khoản</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0f2fe 100%); font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0f2fe 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: ${config.bgColor}; width: 56px; height: 56px; border-radius: 16px; text-align: center; vertical-align: middle; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);">
                    <span style="font-size: 28px; line-height: 56px;"></span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px;">Hospital Management</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748B; font-weight: 500;">Hệ thống quản lý bệnh viện thông minh</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02); overflow: hidden;">
                
                <!-- Accent Top Border -->
                <tr>
                  <td style="height: 4px; background: ${config.bgColor};"></td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Icon with Role Badge -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px auto;">
                      <tr>
                        <td style="width: 100px; height: 100px; background: ${config.iconBg}; border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.2);">
                          <span style="font-size: 48px; line-height: 100px;">${roleIcon}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: ${config.color}; text-align: center; letter-spacing: -0.5px;">Lời mời tham gia</h2>
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #64748B; text-align: center;">Bạn được mời trở thành nhân viên của hệ thống</p>

                    <!-- Role Badge -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 32px auto;">
                      <tr>
                        <td style="background: ${config.bgColor}; padding: 12px 28px; border-radius: 50px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);">
                          <span style="font-size: 15px; font-weight: 600; color: #ffffff; letter-spacing: 0.5px;">${roleIcon} ${roleDisplay}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">Xin chào <strong style="color: ${config.color};">${userName}</strong>,</p>

                    <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; line-height: 1.7;">
                      Bạn đã được mời tham gia vào hệ thống Hospital Management System với vai trò <strong style="color: ${config.color};">${roleDisplay}</strong>. Để kích hoạt tài khoản của bạn, vui lòng nhấp vào nút bên dưới và thiết lập mật khẩu:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 32px auto;">
                      <tr>
                        <td style="border-radius: 14px; background: ${config.bgColor}; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.35), 0 4px 6px rgba(124, 58, 237, 0.2);">
                          <a href="${invitationUrl}" target="_blank" style="display: inline-block; padding: 18px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">
                             Kích hoạt tài khoản ngay
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #F8FAFC; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B; font-weight: 500;">
                            Hoặc copy link sau vào trình duyệt:
                          </p>
                          <a href="${invitationUrl}" style="font-size: 13px; color: ${config.color}; word-break: break-all; text-decoration: none;">${invitationUrl}</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 16px; margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #047857;">ℹ Thông tin quan trọng</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <strong>Vai trò:</strong> ${roleDisplay}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 14px; color: #065F46;">
                                <strong>Link hết hạn:</strong> ${expiryDate}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Warning Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 12px;">
                                <span style="font-size: 20px;"></span>
                              </td>
                              <td>
                                <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; font-weight: 600;">Lưu ý bảo mật</p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Link chỉ sử dụng được <strong>1 lần duy nhất</strong></td></tr>
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Không chia sẻ link này với bất kỳ ai</td></tr>
                                  <tr><td style="padding: 3px 0; font-size: 13px; color: #A16207;">• Mật khẩu cần ít nhất 8 ký tự</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Steps Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 16px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1D4ED8;"> Các bước kích hoạt</p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr><td style="padding: 4px 0; font-size: 13px; color: #1E40AF;"><strong>1.</strong> Nhấp vào nút "Kích hoạt tài khoản"</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 13px; color: #1E40AF;"><strong>2.</strong> Tạo mật khẩu mạnh theo yêu cầu</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 13px; color: #1E40AF;"><strong>3.</strong> Xác nhận mật khẩu</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 13px; color: #1E40AF;"><strong>4.</strong> Đăng nhập và bắt đầu làm việc!</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 500;">Trân trọng,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A; font-weight: 600;">Hospital Management Team</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #CBD5E1);"></td>
                  <td style="padding: 0 16px;">
                    <span style="font-size: 12px; color: #94A3B8;">●</span>
                  </td>
                  <td style="width: 40px; height: 1px; background: linear-gradient(90deg, #CBD5E1, transparent);"></td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8;">
                © 2025 Hospital Management System. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #CBD5E1;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
