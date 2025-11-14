"use strict";
/**
 * NotificationChannel - Domain Value Object
 * Represents different notification delivery channels with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannel = void 0;
class NotificationChannel {
    constructor(type, configuration, metadata = {}) {
        this.type = type;
        this.configuration = configuration;
        this.metadata = metadata;
    }
    /**
     * Create Email notification channel
     */
    static createEmail(config) {
        const defaultConfig = {
            enabled: true,
            priority: 2,
            retryAttempts: 3,
            retryDelay: 5000,
            timeout: 30000,
            requiresConfirmation: false,
            vietnameseSupport: true
        };
        const metadata = {
            provider: 'SMTP',
            formatting: {
                maxLength: 10000,
                allowHtml: true,
                encoding: 'UTF-8'
            },
            rateLimit: {
                maxRequests: 100,
                windowMs: 60000 // 1 minute
            }
        };
        return new NotificationChannel('EMAIL', { ...defaultConfig, ...config }, metadata);
    }
    /**
     * Create SMS notification channel
     */
    static createSMS(config) {
        const defaultConfig = {
            enabled: true,
            priority: 1, // Highest priority for urgent healthcare notifications
            retryAttempts: 2,
            retryDelay: 3000,
            timeout: 15000,
            requiresConfirmation: true,
            vietnameseSupport: true
        };
        const metadata = {
            provider: 'TWILIO',
            formatting: {
                maxLength: 160, // Standard SMS length
                allowHtml: false,
                encoding: 'UTF-8'
            },
            rateLimit: {
                maxRequests: 50,
                windowMs: 60000
            }
        };
        return new NotificationChannel('SMS', { ...defaultConfig, ...config }, metadata);
    }
    /**
     * Create Push notification channel
     */
    static createPush(config) {
        const defaultConfig = {
            enabled: true,
            priority: 1,
            retryAttempts: 3,
            retryDelay: 2000,
            timeout: 10000,
            requiresConfirmation: false,
            vietnameseSupport: true
        };
        const metadata = {
            provider: 'FCM',
            formatting: {
                maxLength: 4000,
                allowHtml: false,
                encoding: 'UTF-8'
            },
            rateLimit: {
                maxRequests: 1000,
                windowMs: 60000
            }
        };
        return new NotificationChannel('PUSH', { ...defaultConfig, ...config }, metadata);
    }
    /**
     * Create In-App notification channel
     */
    static createInApp(config) {
        const defaultConfig = {
            enabled: true,
            priority: 3,
            retryAttempts: 1,
            retryDelay: 1000,
            timeout: 5000,
            requiresConfirmation: false,
            vietnameseSupport: true
        };
        const metadata = {
            provider: 'WEBSOCKET',
            formatting: {
                maxLength: 2000,
                allowHtml: true,
                encoding: 'UTF-8'
            },
            rateLimit: {
                maxRequests: 500,
                windowMs: 60000
            }
        };
        return new NotificationChannel('IN_APP', { ...defaultConfig, ...config }, metadata);
    }
    /**
     * Create Voice notification channel (for urgent healthcare notifications)
     */
    static createVoice(config) {
        const defaultConfig = {
            enabled: false, // Disabled by default, enable for critical notifications
            priority: 1,
            retryAttempts: 2,
            retryDelay: 10000,
            timeout: 60000,
            requiresConfirmation: true,
            vietnameseSupport: true
        };
        const metadata = {
            provider: 'TWILIO_VOICE',
            formatting: {
                maxLength: 500, // Voice message length limit
                allowHtml: false,
                encoding: 'UTF-8'
            },
            rateLimit: {
                maxRequests: 10,
                windowMs: 60000
            }
        };
        return new NotificationChannel('VOICE', { ...defaultConfig, ...config }, metadata);
    }
    /**
     * Create channel from type string (simple factory)
     */
    static create(channelType) {
        const type = channelType.toUpperCase();
        switch (type) {
            case 'EMAIL':
                return NotificationChannel.createEmail();
            case 'SMS':
                return NotificationChannel.createSMS();
            case 'PUSH':
                return NotificationChannel.createPush();
            case 'IN_APP':
                return NotificationChannel.createInApp();
            case 'VOICE':
                return NotificationChannel.createVoice();
            default:
                throw new Error(`Unsupported channel type: ${channelType}`);
        }
    }
    /**
     * Create multi-channel configuration for healthcare notifications
     */
    static createHealthcareChannels() {
        return [
            NotificationChannel.createSMS({ priority: 1 }), // Highest priority
            NotificationChannel.createPush({ priority: 1 }),
            NotificationChannel.createEmail({ priority: 2 }),
            NotificationChannel.createInApp({ priority: 3 })
        ];
    }
    /**
     * Get channel type
     */
    getType() {
        return this.type;
    }
    /**
     * Get channel configuration
     */
    getConfiguration() {
        return { ...this.configuration };
    }
    /**
     * Get channel metadata
     */
    getMetadata() {
        return { ...this.metadata };
    }
    /**
     * Check if channel is enabled
     */
    isEnabled() {
        return this.configuration.enabled;
    }
    /**
     * Check if channel supports Vietnamese
     */
    supportsVietnamese() {
        return this.configuration.vietnameseSupport;
    }
    /**
     * Check if channel requires confirmation
     */
    requiresConfirmation() {
        return this.configuration.requiresConfirmation;
    }
    /**
     * Get channel priority (1 = highest)
     */
    getPriority() {
        return this.configuration.priority;
    }
    /**
     * Get maximum content length for this channel
     */
    getMaxContentLength() {
        return this.metadata.formatting?.maxLength || 1000;
    }
    /**
     * Check if channel allows HTML content
     */
    allowsHtml() {
        return this.metadata.formatting?.allowHtml || false;
    }
    /**
     * Get retry configuration
     */
    getRetryConfig() {
        return {
            attempts: this.configuration.retryAttempts,
            delay: this.configuration.retryDelay
        };
    }
    /**
     * Get timeout configuration
     */
    getTimeout() {
        return this.configuration.timeout;
    }
    /**
     * Get rate limit configuration
     */
    getRateLimit() {
        return this.metadata.rateLimit;
    }
    /**
     * Validate content for this channel
     */
    validateContent(content) {
        const errors = [];
        const maxLength = this.getMaxContentLength();
        if (!content || content.trim().length === 0) {
            errors.push('Nội dung thông báo không được để trống');
        }
        if (content.length > maxLength) {
            errors.push(`Nội dung vượt quá giới hạn ${maxLength} ký tự cho kênh ${this.getVietnameseName()}`);
        }
        if (!this.allowsHtml() && /<[^>]*>/g.test(content)) {
            errors.push(`Kênh ${this.getVietnameseName()} không hỗ trợ HTML`);
        }
        // Vietnamese character validation
        if (this.supportsVietnamese()) {
            const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
            if (vietnameseRegex.test(content)) {
                // Content has Vietnamese characters, which is good for Vietnamese support
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get Vietnamese name for the channel
     */
    getVietnameseName() {
        const names = {
            EMAIL: 'Email',
            SMS: 'Tin nhắn SMS',
            PUSH: 'Thông báo đẩy',
            IN_APP: 'Thông báo trong ứng dụng',
            VOICE: 'Cuộc gọi thoại'
        };
        return names[this.type];
    }
    /**
     * Get Vietnamese description
     */
    getVietnameseDescription() {
        const descriptions = {
            EMAIL: 'Gửi thông báo qua email với nội dung chi tiết',
            SMS: 'Gửi tin nhắn SMS ngắn gọn và nhanh chóng',
            PUSH: 'Thông báo đẩy trên thiết bị di động',
            IN_APP: 'Hiển thị thông báo trong ứng dụng',
            VOICE: 'Cuộc gọi thoại tự động cho thông báo khẩn cấp'
        };
        return descriptions[this.type];
    }
    /**
     * Check if suitable for urgent healthcare notifications
     */
    isSuitableForUrgent() {
        return this.configuration.priority <= 2 && this.configuration.enabled;
    }
    /**
     * Create channel with custom configuration
     */
    withConfiguration(config) {
        return new NotificationChannel(this.type, { ...this.configuration, ...config }, this.metadata);
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.type === other.type;
    }
    /**
     * String representation
     */
    toString() {
        return `${this.type}(priority=${this.configuration.priority}, enabled=${this.configuration.enabled})`;
    }
    /**
     * JSON serialization
     */
    toJSON() {
        return {
            type: this.type,
            configuration: this.configuration,
            metadata: this.metadata
        };
    }
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new NotificationChannel(json.type, json.configuration, json.metadata);
    }
}
exports.NotificationChannel = NotificationChannel;
//# sourceMappingURL=NotificationChannel.js.map