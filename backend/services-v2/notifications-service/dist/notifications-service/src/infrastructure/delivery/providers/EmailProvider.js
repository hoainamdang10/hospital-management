"use strict";
/**
 * EmailProvider - SendGrid Email Delivery Provider
 * Sends emails via SendGrid with Vietnamese healthcare templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SendGrid Integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
class EmailProvider {
    constructor(config) {
        this.config = config;
        this.isConfigured = false;
        this.isSendGridReady = false;
        this.isConfigured = !!config.apiKey && config.enabled;
        if (this.isConfigured) {
            try {
                mail_1.default.setApiKey(config.apiKey);
                this.isSendGridReady = true;
                console.log('[EmailProvider] ✅ SendGrid initialized successfully');
            }
            catch (error) {
                console.error('[EmailProvider] ❌ Failed to initialize SendGrid:', error);
                this.isSendGridReady = false;
            }
        }
        else {
            console.warn('[EmailProvider] ⚠️ SendGrid not configured - email delivery disabled');
        }
    }
    getType() {
        return 'EMAIL';
    }
    async isAvailable() {
        // Check if SendGrid is configured and accessible
        return this.isConfigured && this.isSendGridReady;
    }
    async deliver(request) {
        try {
            const contactInfo = request.recipient.getContactInfo();
            const recipientEmail = contactInfo.email;
            if (!recipientEmail) {
                return {
                    status: 'FAILED',
                    failureReason: 'Recipient has no email address'
                };
            }
            // Validate email format
            if (!this.isValidEmail(recipientEmail)) {
                return {
                    status: 'FAILED',
                    failureReason: 'Invalid email address format'
                };
            }
            // Prepare email content
            const subject = request.content.getSubject() || 'Thông báo từ Bệnh viện';
            const body = request.content.getBody();
            // Mock SendGrid API call
            // In production: use @sendgrid/mail
            const messageId = `sendgrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`[EmailProvider] Sending email to ${recipientEmail}:`, {
                subject,
                bodyLength: body.length,
                messageId
            });
            // Simulate SendGrid API call
            const sendGridResponse = await this.sendViaSendGrid({
                to: recipientEmail,
                from: {
                    email: this.config.fromEmail,
                    name: this.config.fromName
                },
                subject,
                html: this.formatHtmlBody(body, request.recipient),
                text: body,
                customArgs: {
                    notificationId: request.metadata?.notificationId,
                    recipientId: request.recipient.getRecipientId()
                }
            });
            return {
                status: 'SENT',
                messageId,
                deliveredAt: new Date(),
                providerResponse: sendGridResponse
            };
        }
        catch (error) {
            return {
                status: 'FAILED',
                failureReason: error instanceof Error ? error.message : 'Email delivery failed',
                providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    async getDeliveryStatus(messageId) {
        // Mock status check
        // In production: query SendGrid activity API
        console.log(`[EmailProvider] Checking status for message ${messageId}`);
        return {
            status: 'DELIVERED',
            deliveredAt: new Date()
        };
    }
    /**
     * Send via SendGrid (real implementation)
     */
    async sendViaSendGrid(emailData) {
        if (!this.isSendGridReady) {
            console.warn('[EmailProvider] SendGrid not ready, using mock mode');
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                statusCode: 202,
                headers: { 'x-message-id': emailData.customArgs?.notificationId || 'mock-id' },
                body: { message: 'Email queued (mock)' }
            };
        }
        try {
            // Real SendGrid API call
            const [response] = await mail_1.default.send(emailData);
            console.log('[EmailProvider] ✅ Email sent successfully', {
                statusCode: response.statusCode,
                messageId: response.headers['x-message-id']
            });
            return {
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body
            };
        }
        catch (error) {
            console.error('[EmailProvider] ❌ SendGrid API error:', {
                code: error.code,
                message: error.message,
                response: error.response?.body
            });
            throw new Error(`SendGrid failed: ${error.message}`);
        }
    }
    /**
     * Format HTML body with Vietnamese healthcare template
     */
    formatHtmlBody(textBody, recipient) {
        const recipientName = recipient.getFullName();
        return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo từ Bệnh viện</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { color: #0066cc; margin: 0; }
          .content { margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
          .greeting { font-weight: bold; color: #0066cc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏥 Bệnh viện Đa khoa</h2>
          </div>
          <div class="content">
            <p class="greeting">Kính gửi ${recipientName},</p>
            <div>${textBody.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="footer">
            <p><strong>Bệnh viện Đa khoa</strong></p>
            <p>Hotline: 1900-xxxx | Email: contact@hospital.vn</p>
            <p><em>Đây là email tự động, vui lòng không trả lời trực tiếp.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.EmailProvider = EmailProvider;
//# sourceMappingURL=EmailProvider.js.map