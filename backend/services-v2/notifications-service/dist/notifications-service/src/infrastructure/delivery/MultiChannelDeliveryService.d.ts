/**
 * MultiChannelDeliveryService - Infrastructure Delivery Service
 * Multi-channel notification delivery service with Vietnamese healthcare optimization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
import { IDeliveryService, DeliveryRequest, DeliveryResult } from '../../domain/services/IDeliveryService';
import { NotificationChannel } from '../../domain/value-objects/NotificationChannel';
import { RecipientInfo } from '../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';
export interface ChannelProvider {
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
}
export declare class MultiChannelDeliveryService implements IDeliveryService {
    private readonly providers;
    private readonly deliveryHistory;
    constructor(providers?: ChannelProvider[]);
    /**
     * Register channel provider
     */
    registerProvider(provider: ChannelProvider): void;
    /**
     * Deliver notification through multiple channels
     */
    deliver(request: DeliveryRequest): Promise<DeliveryResult[]>;
    /**
     * Deliver to single channel
     */
    deliverToChannel(notificationId: string, recipient: RecipientInfo, content: NotificationContent, channel: NotificationChannel): Promise<DeliveryResult>;
    /**
     * Check if should deliver to channel based on recipient preferences
     */
    private shouldDeliverToChannel;
    /**
     * Check if failure is retryable
     */
    private isRetryableFailure;
    /**
     * Get delivery status for notification
     */
    getDeliveryStatus(notificationId: string): Promise<DeliveryResult[]>;
    /**
     * Get delivery analytics (STUB - Not implemented yet)
     */
    getDeliveryAnalytics(_dateRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
    /**
     * Get available channels
     */
    getAvailableChannels(): string[];
    /**
     * Check provider health
     */
    checkProviderHealth(): Promise<Record<string, boolean>>;
    scheduleDelivery(_request: DeliveryRequest): Promise<string>;
    cancelScheduledDelivery(_scheduleId: string): Promise<boolean>;
    retryDelivery(_notificationId: string, _failedChannels: string[], _maxRetries?: number): Promise<DeliveryResult[]>;
    getDeliveryAttempts(_notificationId: string): Promise<any[]>;
    canDeliverToRecipient(_recipient: RecipientInfo, _channels: NotificationChannel[], _currentTime?: Date): Promise<any>;
    validateDeliveryRequest(_request: DeliveryRequest): Promise<any>;
    getOptimalChannels(_recipient: RecipientInfo, _priority: any, _contentType?: string): Promise<NotificationChannel[]>;
    getChannelHealth(_channel?: string): Promise<any[]>;
    getDeliveryMetrics(_dateRange?: any, _filters?: any): Promise<any>;
    getQueueStatus(): Promise<any>;
    processQueue(_batchSize?: number): Promise<any>;
    pauseChannel(_channel: string, _reason?: string): Promise<void>;
    resumeChannel(_channel: string): Promise<void>;
    getPausedChannels(): Promise<any[]>;
    setChannelRateLimit(_channel: string, _maxRequests: number, _windowMs: number): Promise<void>;
    getRateLimitStatus(_channel: string): Promise<any>;
    testChannel(_channel: string): Promise<any>;
    estimateDeliveryCost(_channels: string[], _recipientCount: number, _contentLength?: number): Promise<any>;
    getFailedDeliveriesRequiringAttention(): Promise<any[]>;
    bulkDeliver(_requests: DeliveryRequest[]): Promise<DeliveryResult[]>;
    getChannelTemplates(_channel: string): Promise<any[]>;
    configureChannelProvider(_channel: string, _providerConfig: Record<string, any>): Promise<void>;
    getChannelProviderConfig(_channel: string): Promise<Record<string, any>>;
    switchChannelProvider(_channel: string, _newProvider: string, _config: Record<string, any>): Promise<void>;
    getAvailableProviders(_channel: string): Promise<any[]>;
    monitorPerformance(): Promise<any>;
    getHealthCheck(): Promise<any>;
    cleanupOldRecords(_olderThanDays: number): Promise<number>;
    exportDeliveryData(_dateRange: any, _format: any): Promise<string>;
    getServiceStatistics(): Promise<any>;
}
//# sourceMappingURL=MultiChannelDeliveryService.d.ts.map