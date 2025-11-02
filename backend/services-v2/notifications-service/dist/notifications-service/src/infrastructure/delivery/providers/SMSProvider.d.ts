/**
 * SMSProvider - Twilio SMS Delivery Provider
 * Sends SMS via Twilio with Vietnamese text support
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Twilio Integration
 */
import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';
interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enabled: boolean;
}
export declare class SMSProvider implements ChannelProvider {
    private readonly config;
    private isConfigured;
    private readonly MAX_SMS_LENGTH;
    private twilioClient;
    constructor(config: TwilioConfig);
    getType(): string;
    isAvailable(): Promise<boolean>;
    deliver(request: {
        recipient: RecipientInfo;
        content: NotificationContent;
        channel: NotificationChannel;
        metadata?: any;
    }): Promise<{
        status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
        messageId?: string;
        deliveredAt?: Date;
        failureReason?: string;
        providerResponse?: any;
    }>;
    getDeliveryStatus(messageId: string): Promise<{
        status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
        deliveredAt?: Date;
        failureReason?: string;
    }>;
    /**
     * Send via Twilio (real implementation)
     */
    private sendViaTwilio;
    /**
     * Validate Vietnamese phone number format
     * Supports: +84, 0, 84 prefixes
     */
    private isValidVietnamesePhone;
    /**
     * Normalize phone number to E.164 format (+84...)
     */
    private _normalizePhoneNumber;
    /**
     * Remove Vietnamese diacritics for SMS compatibility (optional)
     */
    private _normalizeVietnameseText;
    /**
     * Estimate SMS segments (Vietnamese chars count differently)
     */
    private _estimateSMSSegments;
}
export {};
//# sourceMappingURL=SMSProvider.d.ts.map