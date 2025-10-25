/**
 * EmailProvider - SendGrid Email Delivery Provider
 * Sends emails via SendGrid with Vietnamese healthcare templates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SendGrid Integration
 */
import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';
interface SendGridConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
}
export declare class EmailProvider implements ChannelProvider {
    private readonly config;
    private isConfigured;
    constructor(config: SendGridConfig);
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
     * Send via SendGrid (mock implementation)
     */
    private sendViaSendGrid;
    /**
     * Format HTML body with Vietnamese healthcare template
     */
    private formatHtmlBody;
    /**
     * Validate email format
     */
    private isValidEmail;
}
export {};
//# sourceMappingURL=EmailProvider.d.ts.map