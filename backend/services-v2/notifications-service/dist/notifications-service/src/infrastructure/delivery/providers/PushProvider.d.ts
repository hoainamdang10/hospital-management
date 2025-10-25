/**
 * PushProvider - Firebase Cloud Messaging Provider
 * Sends push notifications via FCM
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FCM Integration
 */
import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';
interface FirebaseConfig {
    projectId: string;
    privateKey: string;
    clientEmail: string;
}
export declare class PushProvider implements ChannelProvider {
    private readonly config;
    private isConfigured;
    constructor(config: FirebaseConfig);
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
     * Send via Firebase Cloud Messaging (mock)
     */
    private sendViaFCM;
}
export {};
//# sourceMappingURL=PushProvider.d.ts.map