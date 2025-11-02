/**
 * VoiceProvider - Twilio Voice Call Provider
 * Makes voice calls via Twilio for urgent notifications
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Twilio Voice
 */
import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';
interface TwilioVoiceConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    twimlUrl?: string;
}
export declare class VoiceProvider implements ChannelProvider {
    private readonly config;
    private isConfigured;
    constructor(config: TwilioVoiceConfig);
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
     * Make voice call via Twilio (mock)
     */
    private makeVoiceCall;
    /**
     * Generate TwiML for voice message
     */
    private generateTwiML;
    /**
     * Convert text notification to voice-friendly format
     */
    private convertToVoiceMessage;
    /**
     * Escape XML special characters
     */
    private escapeXml;
    /**
     * Validate phone number format
     */
    private _isValidVietnamesePhone;
}
export {};
//# sourceMappingURL=VoiceProvider.d.ts.map