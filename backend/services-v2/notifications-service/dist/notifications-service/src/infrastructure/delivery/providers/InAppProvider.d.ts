/**
 * InAppProvider - Socket.IO In-App Notification Provider
 * Sends real-time notifications via WebSocket
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Real-time Notifications
 */
import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';
export declare class InAppProvider implements ChannelProvider {
    private socketServer;
    constructor(socketServer?: any);
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
     * Set Socket.IO server instance
     */
    setSocketServer(server: any): void;
}
//# sourceMappingURL=InAppProvider.d.ts.map