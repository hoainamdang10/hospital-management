/**
 * Email Service for Hospital Management System
 * Handles sending various types of emails including invitations
 */

import nodemailer from "nodemailer";
import { AuditLogger } from "../security/audit";
import { vaultService } from "./vault.service";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface InvitationEmailData {
  email: string;
  role: string;
  inviteUrl: string;
  invitedBy: string;
  departmentName?: string;
  message?: string;
  expiresAt: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Lazy initialization when first used
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeTransporter();
    }
    return this.initializationPromise;
  }

  private async initializeTransporter() {
    try {
      // Get configuration from Vault with fallback to environment variables
      const [host, port, secure, user, pass, systemName] = await Promise.all([
        vaultService.getConfig("smtp_host", "SMTP_HOST"),
        vaultService.getConfig("smtp_port", "SMTP_PORT"),
        vaultService.getConfig("smtp_secure", "SMTP_SECURE"),
        vaultService.getConfig("smtp_user", "SMTP_USER"),
        vaultService.getConfig("smtp_pass", "SMTP_PASS"),
        vaultService.getConfig("hospital_system_name", "SYSTEM_NAME"),
      ]);

      const config: EmailConfig = {
        host: host || "smtp.gmail.com",
        port: parseInt(port || "587"),
        secure: secure === "true",
        auth: {
          user: user || "",
          pass: pass || "",
        },
      };

      if (!config.auth.user || !config.auth.pass) {
        console.warn("Email service not configured: Missing SMTP credentials");
        return;
      }

      this.transporter = nodemailer.createTransporter(config);
      this.isConfigured = true;

      console.log("📧 Email service initialized with Vault configuration");

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Email service verification failed:", error);
          this.isConfigured = false;
        } else {
          console.log("✅ Email service ready (Vault + SMTP)");
        }
      });
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      this.isConfigured = false;
    }
  }

  private generateInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const roleDisplayName =
      {
        doctor: "Bác sĩ",
        staff: "Nhân viên",
        admin: "Quản trị viên",
      }[data.role] || data.role;

    const expiresDate = new Date(data.expiresAt).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subject = `Lời mời tham gia Hệ thống Quản lý Bệnh viện - ${roleDisplayName}`;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lời mời tham gia hệ thống</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #218838; }
        .info-box { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Hệ thống Quản lý Bệnh viện</h1>
            <p>Lời mời tham gia hệ thống</p>
        </div>
        
        <div class="content">
            <h2>Xin chào!</h2>
            
            <p>Bạn đã được <strong>${data.invitedBy}</strong> mời tham gia Hệ thống Quản lý Bệnh viện với vai trò <strong>${roleDisplayName}</strong>.</p>
            
            ${
              data.departmentName
                ? `<div class="info-box">
                <strong>Khoa/Phòng:</strong> ${data.departmentName}
            </div>`
                : ""
            }
            
            ${
              data.message
                ? `<div class="info-box">
                <strong>Tin nhắn từ người mời:</strong><br>
                ${data.message}
            </div>`
                : ""
            }
            
            <p>Để chấp nhận lời mời và tạo tài khoản, vui lòng nhấp vào nút bên dưới:</p>
            
            <div style="text-align: center;">
                <a href="${data.inviteUrl}" class="button">Chấp nhận lời mời</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul>
                    <li>Lời mời này sẽ hết hạn vào <strong>${expiresDate}</strong></li>
                    <li>Chỉ sử dụng được một lần duy nhất</li>
                    <li>Không chia sẻ liên kết này với người khác</li>
                </ul>
            </div>
            
            <p>Nếu bạn không thể nhấp vào nút, hãy sao chép và dán liên kết sau vào trình duyệt:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${data.inviteUrl}
            </p>
            
            <p>Nếu bạn không mong đợi email này hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên hệ thống.</p>
        </div>
        
        <div class="footer">
            <p>© 2024 Hệ thống Quản lý Bệnh viện. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Lời mời tham gia Hệ thống Quản lý Bệnh viện

Xin chào!

Bạn đã được ${data.invitedBy} mời tham gia Hệ thống Quản lý Bệnh viện với vai trò ${roleDisplayName}.

${data.departmentName ? `Khoa/Phòng: ${data.departmentName}\n` : ""}
${data.message ? `Tin nhắn từ người mời: ${data.message}\n` : ""}

Để chấp nhận lời mời và tạo tài khoản, vui lòng truy cập liên kết sau:
${data.inviteUrl}

LƯU Ý QUAN TRỌNG:
- Lời mời này sẽ hết hạn vào ${expiresDate}
- Chỉ sử dụng được một lần duy nhất
- Không chia sẻ liên kết này với người khác

Nếu bạn không mong đợi email này hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên hệ thống.

© 2024 Hệ thống Quản lý Bệnh viện. Tất cả quyền được bảo lưu.
Email này được gửi tự động, vui lòng không trả lời.
    `;

    return { subject, html, text };
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    await this.ensureInitialized();

    if (!this.isConfigured || !this.transporter) {
      console.warn("Email service not configured, skipping email send");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const template = this.generateInvitationTemplate(data);

      const mailOptions = {
        from: {
          name: "Hệ thống Quản lý Bệnh viện",
          address:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER ||
            "noreply@hospital.com",
        },
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      // Log successful email send
      await AuditLogger.log({
        actorId: undefined,
        action: "invitation_email_sent",
        resourceType: "email",
        resourceId: data.email,
        details: {
          email: data.email,
          role: data.role,
          messageId: result.messageId,
        },
        severity: "info",
        ipAddress: "",
        userAgent: "",
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("Failed to send invitation email:", error);

      // Log email send failure
      await AuditLogger.logSecurityEvent(
        "invitation_email_failed",
        undefined,
        {
          ipAddress: "",
          userAgent: "",
        },
        {
          reason: "email_send_failed",
          email: data.email,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendTestEmail(to: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    await this.ensureInitialized();

    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      const mailOptions = {
        from: {
          name: "Hệ thống Quản lý Bệnh viện",
          address:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER ||
            "noreply@hospital.com",
        },
        to,
        subject: "Test Email - Hệ thống Quản lý Bệnh viện",
        html: "<h1>Test Email</h1><p>Email service is working correctly!</p>",
        text: "Test Email\n\nEmail service is working correctly!",
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("Failed to send test email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isReady(): Promise<boolean> {
    await this.ensureInitialized();
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
