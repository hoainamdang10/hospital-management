/**
 * Email Sender Service
 * Handles email sending with templates for Free Tier compatibility
 */

import { Resend } from 'resend'

// Email configuration
const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'noreply@hospital.local'
const appName = process.env.APP_NAME || 'Hospital Management System'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Email templates
const templates: Record<string, (data: any) => EmailTemplate> = {
  // Welcome email for new users
  welcome: (data: { name: string; role: string; loginUrl: string }) => ({
    subject: `Chào mừng đến với ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chào mừng</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <h2>Chào mừng ${data.name}!</h2>
              <p>Tài khoản của bạn đã được tạo thành công với vai trò <strong>${data.role}</strong>.</p>
              <p>Bạn có thể đăng nhập vào hệ thống để bắt đầu sử dụng các tính năng.</p>
              <p style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Đăng nhập ngay</a>
              </p>
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Chào mừng ${data.name}!
      
      Tài khoản của bạn đã được tạo thành công với vai trò ${data.role}.
      
      Bạn có thể đăng nhập tại: ${data.loginUrl}
      
      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ.
      
      ${appName}
    `,
  }),

  // Staff invitation email
  invitation: (data: { role: string; inviteUrl: string; expiresAt: string; invitedBy: string }) => ({
    subject: `Lời mời tham gia ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lời mời tham gia</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <h2>Bạn được mời tham gia hệ thống</h2>
              <p>Bạn đã được <strong>${data.invitedBy}</strong> mời tham gia ${appName} với vai trò <strong>${data.role}</strong>.</p>
              <p>Để kích hoạt tài khoản và bắt đầu sử dụng hệ thống, vui lòng nhấp vào nút bên dưới:</p>
              <p style="text-align: center;">
                <a href="${data.inviteUrl}" class="button">Kích hoạt tài khoản</a>
              </p>
              <div class="warning">
                <strong>Lưu ý:</strong> Lời mời này sẽ hết hạn vào ${new Date(data.expiresAt).toLocaleString('vi-VN')}.
              </div>
              <p>Nếu bạn không yêu cầu lời mời này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bạn được mời tham gia ${appName}
      
      Bạn đã được ${data.invitedBy} mời tham gia hệ thống với vai trò ${data.role}.
      
      Để kích hoạt tài khoản, vui lòng truy cập: ${data.inviteUrl}
      
      Lời mời sẽ hết hạn vào: ${new Date(data.expiresAt).toLocaleString('vi-VN')}
      
      Nếu bạn không yêu cầu lời mời này, vui lòng bỏ qua email này.
      
      ${appName}
    `,
  }),

  // Password reset email
  passwordReset: (data: { name: string; resetUrl: string; expiresAt: string }) => ({
    subject: `Đặt lại mật khẩu - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đặt lại mật khẩu</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
              <p style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Đặt lại mật khẩu</a>
              </p>
              <div class="warning">
                <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn vào ${new Date(data.expiresAt).toLocaleString('vi-VN')}.
              </div>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Đặt lại mật khẩu - ${appName}
      
      Xin chào ${data.name},
      
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
      
      Để đặt lại mật khẩu, vui lòng truy cập: ${data.resetUrl}
      
      Liên kết sẽ hết hạn vào: ${new Date(data.expiresAt).toLocaleString('vi-VN')}
      
      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      
      ${appName}
    `,
  }),

  // Email verification
  emailVerification: (data: { name: string; verificationUrl: string }) => ({
    subject: `Xác thực email - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác thực email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác thực email</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${data.name},</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}.</p>
              <p>Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
              <p style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Xác thực email</a>
              </p>
              <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Xác thực email - ${appName}
      
      Xin chào ${data.name},
      
      Cảm ơn bạn đã đăng ký tài khoản tại ${appName}.
      
      Để hoàn tất quá trình đăng ký, vui lòng xác thực email tại: ${data.verificationUrl}
      
      Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
      
      ${appName}
    `,
  }),
}

/**
 * Send email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Get template
    const templateFn = templates[options.template]
    if (!templateFn) {
      throw new Error(`Email template '${options.template}' not found`)
    }

    const template = templateFn(options.data)

    // Send email based on environment
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      // Log email in development
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: template.subject,
        template: options.template,
        data: options.data,
      })
      return
    }

    // Send via Resend in production
    await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments: options.attachments,
    })

    console.log('✅ Email sent successfully:', {
      to: options.to,
      subject: template.subject,
      template: options.template,
    })
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

/**
 * Send bulk emails (for notifications, newsletters, etc.)
 */
export async function sendBulkEmails(
  recipients: string[],
  template: string,
  data: Record<string, any>
): Promise<void> {
  const batchSize = 50 // Resend limit
  const batches = []

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    await sendEmail({
      to: batch,
      subject: '', // Will be set by template
      template,
      data,
    })

    // Add delay between batches to avoid rate limiting
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get email template preview (for testing)
 */
export function getEmailPreview(template: string, data: Record<string, any>): EmailTemplate | null {
  const templateFn = templates[template]
  if (!templateFn) {
    return null
  }
  return templateFn(data)
}

export default sendEmail
