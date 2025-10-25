"use strict";
/**
 * SMSProvider - Twilio SMS Delivery Provider
 * Sends SMS via Twilio with Vietnamese text support
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Twilio Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSProvider = void 0;
class SMSProvider {
    constructor(config) {
        this.config = config;
        this.isConfigured = false;
        this.MAX_SMS_LENGTH = 160;
        this.isConfigured = !!config.accountSid && !!config.authToken;
    }
    getType() {
        return 'SMS';
    }
    async isAvailable() {
        return this.isConfigured;
    }
    async deliver(request) {
        try {
            const contactInfo = request.recipient.getContactInfo();
            const phoneNumber = contactInfo.phoneNumber;
            if (!phoneNumber) {
                return {
                    status: 'FAILED',
                    failureReason: 'Recipient has no phone number'
                };
            }
            // Validate Vietnamese phone number
            if (!this.isValidVietnamesePhone(phoneNumber)) {
                return {
                    status: 'FAILED',
                    failureReason: 'Invalid Vietnamese phone number format'
                };
            }
            // Prepare SMS content (max 160 chars for single SMS)
            let smsBody = request.content.getBody();
            // Truncate if too long and add indicator
            if (smsBody.length > this.MAX_SMS_LENGTH) {
                smsBody = smsBody.substring(0, this.MAX_SMS_LENGTH - 10) + '... (cont)';
            }
            // Remove Vietnamese diacritics if needed for better compatibility
            // const normalizedBody = this.normalizeVietnameseText(smsBody);
            // Mock Twilio API call
            const messageId = `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`[SMSProvider] Sending SMS to ${phoneNumber}:`, {
                bodyLength: smsBody.length,
                messageId
            });
            // Simulate Twilio API call
            const twilioResponse = await this.sendViaTwilio({
                to: phoneNumber,
                from: this.config.fromNumber,
                body: smsBody
            });
            return {
                status: 'SENT',
                messageId,
                deliveredAt: new Date(),
                providerResponse: twilioResponse
            };
        }
        catch (error) {
            return {
                status: 'FAILED',
                failureReason: error instanceof Error ? error.message : 'SMS delivery failed',
                providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    async getDeliveryStatus(messageId) {
        // Mock status check
        console.log(`[SMSProvider] Checking status for message ${messageId}`);
        return {
            status: 'DELIVERED',
            deliveredAt: new Date()
        };
    }
    /**
     * Send via Twilio (mock implementation)
     */
    async sendViaTwilio(smsData) {
        // In production, use Twilio SDK:
        // const twilio = require('twilio');
        // const client = twilio(this.config.accountSid, this.config.authToken);
        // const message = await client.messages.create(smsData);
        // return message;
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
        return {
            sid: `SM${Math.random().toString(36).substr(2, 32)}`,
            status: 'queued',
            to: smsData.to,
            from: smsData.from,
            body: smsData.body,
            dateCreated: new Date(),
            price: '-0.00750', // $0.0075 per SMS
            priceUnit: 'USD'
        };
    }
    /**
     * Validate Vietnamese phone number format
     * Supports: +84, 0, 84 prefixes
     */
    isValidVietnamesePhone(phone) {
        const vietnamesePhoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return vietnamesePhoneRegex.test(cleanPhone);
    }
    /**
     * Normalize phone number to E.164 format (+84...)
     */
    normalizePhoneNumber(phone) {
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '+84' + cleanPhone.substring(1);
        }
        else if (cleanPhone.startsWith('84')) {
            cleanPhone = '+' + cleanPhone;
        }
        return cleanPhone;
    }
    /**
     * Remove Vietnamese diacritics for SMS compatibility (optional)
     */
    normalizeVietnameseText(text) {
        // Keep Vietnamese diacritics by default
        // Only normalize if carrier doesn't support UTF-8
        return text;
    }
    /**
     * Estimate SMS segments (Vietnamese chars count differently)
     */
    estimateSMSSegments(text) {
        // Vietnamese SMS: ~70 chars per segment (UCS-2 encoding)
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
        if (hasVietnamese) {
            return Math.ceil(text.length / 70);
        }
        else {
            return Math.ceil(text.length / 160);
        }
    }
}
exports.SMSProvider = SMSProvider;
//# sourceMappingURL=SMSProvider.js.map