/**
 * NotificationChannel - Domain Value Object
 * Represents different notification delivery channels with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
export type ChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'VOICE';
export interface ChannelConfiguration {
    enabled: boolean;
    priority: number;
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    requiresConfirmation: boolean;
    vietnameseSupport: boolean;
}
export interface ChannelMetadata {
    provider?: string;
    endpoint?: string;
    credentials?: Record<string, any>;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
    formatting?: {
        maxLength: number;
        allowHtml: boolean;
        encoding: string;
    };
}
export declare class NotificationChannel {
    private readonly type;
    private readonly configuration;
    private readonly metadata;
    private constructor();
    /**
     * Create Email notification channel
     */
    static createEmail(config?: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Create SMS notification channel
     */
    static createSMS(config?: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Create Push notification channel
     */
    static createPush(config?: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Create In-App notification channel
     */
    static createInApp(config?: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Create Voice notification channel (for urgent healthcare notifications)
     */
    static createVoice(config?: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Create channel from type string (simple factory)
     */
    static create(channelType: string): NotificationChannel;
    /**
     * Create multi-channel configuration for healthcare notifications
     */
    static createHealthcareChannels(): NotificationChannel[];
    /**
     * Get channel type
     */
    getType(): ChannelType;
    /**
     * Get channel configuration
     */
    getConfiguration(): ChannelConfiguration;
    /**
     * Get channel metadata
     */
    getMetadata(): ChannelMetadata;
    /**
     * Check if channel is enabled
     */
    isEnabled(): boolean;
    /**
     * Check if channel supports Vietnamese
     */
    supportsVietnamese(): boolean;
    /**
     * Check if channel requires confirmation
     */
    requiresConfirmation(): boolean;
    /**
     * Get channel priority (1 = highest)
     */
    getPriority(): number;
    /**
     * Get maximum content length for this channel
     */
    getMaxContentLength(): number;
    /**
     * Check if channel allows HTML content
     */
    allowsHtml(): boolean;
    /**
     * Get retry configuration
     */
    getRetryConfig(): {
        attempts: number;
        delay: number;
    };
    /**
     * Get timeout configuration
     */
    getTimeout(): number;
    /**
     * Get rate limit configuration
     */
    getRateLimit(): {
        maxRequests: number;
        windowMs: number;
    } | undefined;
    /**
     * Validate content for this channel
     */
    validateContent(content: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get Vietnamese name for the channel
     */
    getVietnameseName(): string;
    /**
     * Get Vietnamese description
     */
    getVietnameseDescription(): string;
    /**
     * Check if suitable for urgent healthcare notifications
     */
    isSuitableForUrgent(): boolean;
    /**
     * Create channel with custom configuration
     */
    withConfiguration(config: Partial<ChannelConfiguration>): NotificationChannel;
    /**
     * Equality comparison
     */
    equals(other: NotificationChannel): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): object;
    /**
     * Create from JSON
     */
    static fromJSON(json: any): NotificationChannel;
}
//# sourceMappingURL=NotificationChannel.d.ts.map