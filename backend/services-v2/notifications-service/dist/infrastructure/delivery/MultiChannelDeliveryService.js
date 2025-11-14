"use strict";
/**
 * MultiChannelDeliveryService - Infrastructure Delivery Service
 * Multi-channel notification delivery service with Vietnamese healthcare optimization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiChannelDeliveryService = void 0;
class MultiChannelDeliveryService {
    constructor(providers = []) {
        this.providers = new Map();
        this.deliveryHistory = new Map();
        providers.forEach(provider => {
            this.providers.set(provider.getType(), provider);
        });
    }
    /**
     * Register channel provider
     */
    registerProvider(provider) {
        this.providers.set(provider.getType(), provider);
    }
    /**
     * Deliver notification through multiple channels
     */
    async deliver(request) {
        try {
            const results = [];
            const deliveryPromises = [];
            // Process each channel
            for (const channel of request.channels) {
                const channelType = channel.getType();
                const provider = this.providers.get(channelType);
                if (!provider) {
                    results.push({
                        notificationId: request.notificationId,
                        channel: channelType,
                        success: false,
                        status: 'FAILED',
                        failureReason: `Không tìm thấy provider cho kênh ${channelType}`,
                        deliveryTime: 0,
                        retryable: false
                    });
                    continue;
                }
                // Check if provider is available
                const isAvailable = await provider.isAvailable();
                if (!isAvailable) {
                    results.push({
                        notificationId: request.notificationId,
                        channel: channelType,
                        success: false,
                        status: 'FAILED',
                        failureReason: `Provider ${channelType} không khả dụng`,
                        deliveryTime: 0,
                        retryable: true
                    });
                    continue;
                }
                // Create delivery promise
                const deliveryPromise = this.deliverToChannel(request.notificationId, request.recipient, request.content, channel);
                deliveryPromises.push(deliveryPromise);
            }
            // Wait for all deliveries to complete
            const channelResults = await Promise.allSettled(deliveryPromises);
            // Process results
            channelResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    const channelType = request.channels[index]?.getType() || 'UNKNOWN';
                    results.push({
                        notificationId: request.notificationId,
                        channel: channelType,
                        success: false,
                        status: 'FAILED',
                        failureReason: `Lỗi delivery: ${result.reason?.message || 'Lỗi không xác định'}`,
                        deliveryTime: 0,
                        retryable: true
                    });
                }
            });
            // Store delivery history
            this.deliveryHistory.set(request.notificationId, results);
            return results;
        }
        catch (error) {
            throw new Error(`Lỗi delivery service: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Deliver to single channel
     */
    async deliverToChannel(notificationId, recipient, content, channel) {
        const startTime = Date.now();
        const channelType = channel.getType();
        const provider = this.providers.get(channelType);
        if (!provider) {
            return {
                notificationId,
                channel: channelType,
                success: false,
                status: 'FAILED',
                failureReason: `Không tìm thấy provider cho kênh ${channelType}`,
                deliveryTime: 0,
                retryable: false
            };
        }
        try {
            // Validate content for channel
            const contentValidation = content.validateForChannel(channelType);
            if (!contentValidation.valid) {
                return {
                    notificationId,
                    channel: channelType,
                    success: false,
                    status: 'FAILED',
                    failureReason: `Nội dung không hợp lệ cho kênh ${channelType}: ${contentValidation.errors.join(', ')}`,
                    deliveryTime: 0,
                    retryable: false
                };
            }
            // Check recipient preferences
            if (!this.shouldDeliverToChannel(recipient, channel)) {
                return {
                    notificationId,
                    channel: channelType,
                    success: false,
                    status: 'FAILED',
                    failureReason: 'Người nhận đã tắt thông báo cho kênh này',
                    deliveryTime: 0,
                    retryable: false
                };
            }
            // Check quiet hours
            if (recipient.isInQuietHours()) {
                return {
                    notificationId,
                    channel: channelType,
                    success: false,
                    status: 'FAILED',
                    failureReason: 'Trong giờ nghỉ của người nhận',
                    deliveryTime: 0,
                    retryable: true
                };
            }
            // Attempt delivery
            const deliveryResult = await provider.deliver({
                recipient,
                content,
                channel,
                metadata: { notificationId }
            });
            const deliveryTime = Date.now() - startTime;
            return {
                notificationId,
                channel: channelType,
                success: deliveryResult.status === 'SENT' || deliveryResult.status === 'DELIVERED',
                status: deliveryResult.status,
                deliveredAt: deliveryResult.deliveredAt,
                failureReason: deliveryResult.failureReason,
                deliveryTime,
                retryable: deliveryResult.status === 'FAILED' && this.isRetryableFailure(deliveryResult.failureReason),
                providerResponse: deliveryResult.providerResponse
            };
        }
        catch (error) {
            const deliveryTime = Date.now() - startTime;
            return {
                notificationId,
                channel: channelType,
                success: false,
                status: 'FAILED',
                failureReason: error instanceof Error ? error.message : 'Lỗi không xác định',
                deliveryTime,
                retryable: true
            };
        }
    }
    /**
     * Check if should deliver to channel based on recipient preferences
     */
    shouldDeliverToChannel(recipient, channel) {
        const preferences = recipient.getPreferences();
        // Check if channel is enabled
        if (!preferences.preferredChannels.includes(channel.getType())) {
            return false;
        }
        // Check if recipient has opted out (marketing/reminders)
        if (preferences.optOut.marketing || preferences.optOut.reminders) {
            return false;
        }
        return true;
    }
    /**
     * Check if failure is retryable
     */
    isRetryableFailure(failureReason) {
        if (!failureReason)
            return true;
        const nonRetryableReasons = [
            'invalid phone number',
            'invalid email address',
            'recipient opted out',
            'content validation failed',
            'trong giờ nghỉ',
            'đã tắt thông báo'
        ];
        return !nonRetryableReasons.some(reason => failureReason.toLowerCase().includes(reason.toLowerCase()));
    }
    /**
     * Get delivery status for notification
     */
    async getDeliveryStatus(notificationId) {
        try {
            const cachedResults = this.deliveryHistory.get(notificationId);
            if (!cachedResults) {
                return [];
            }
            // Update status from providers for messages that might have been delivered
            const updatedResults = [];
            for (const result of cachedResults) {
                if (result.status === 'SENT' && result.providerId) {
                    const provider = this.providers.get(result.channel);
                    if (provider && result.providerId) {
                        try {
                            const status = await provider.getDeliveryStatus(result.providerId);
                            updatedResults.push({
                                ...result,
                                status: status.status,
                                deliveredAt: status.deliveredAt || result.deliveredAt,
                                failureReason: status.failureReason || result.failureReason
                            });
                        }
                        catch (error) {
                            // If status check fails, keep original result
                            updatedResults.push(result);
                        }
                    }
                    else {
                        updatedResults.push(result);
                    }
                }
                else {
                    updatedResults.push(result);
                }
            }
            // Update cache
            this.deliveryHistory.set(notificationId, updatedResults);
            return updatedResults;
        }
        catch (error) {
            throw new Error(`Lỗi khi lấy trạng thái delivery: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Get delivery analytics (STUB - Not implemented yet)
     */
    async getDeliveryAnalytics(_dateRange) {
        // TODO: Implement analytics when needed
        return {
            deliveryTrends: [],
            channelPerformance: {},
            peakHours: {},
            failureReasons: {},
            recipientEngagement: {
                deliveryRate: 0
            }
        };
    }
    /**
     * Get available channels
     */
    getAvailableChannels() {
        return Array.from(this.providers.keys());
    }
    /**
     * Check provider health
     */
    async checkProviderHealth() {
        const health = {};
        for (const [channelType, provider] of this.providers) {
            try {
                health[channelType] = await provider.isAvailable();
            }
            catch (error) {
                health[channelType] = false;
            }
        }
        return health;
    }
    // ==================== STUB METHODS (Not Implemented Yet) ====================
    async scheduleDelivery(_request) {
        throw new Error('scheduleDelivery not implemented - use Scheduler Service instead');
    }
    async cancelScheduledDelivery(_scheduleId) {
        throw new Error('cancelScheduledDelivery not implemented - use Scheduler Service instead');
    }
    async retryDelivery(_notificationId, _failedChannels, _maxRetries) {
        throw new Error('retryDelivery not implemented yet');
    }
    async getDeliveryAttempts(_notificationId) {
        return [];
    }
    async canDeliverToRecipient(_recipient, _channels, _currentTime) {
        return { canDeliver: true, availableChannels: [], blockedChannels: [], reasons: {} };
    }
    async validateDeliveryRequest(_request) {
        return { isValid: true, errors: [], warnings: [] };
    }
    async getOptimalChannels(_recipient, _priority, _contentType) {
        return [];
    }
    async getChannelHealth(_channel) {
        return [];
    }
    async getDeliveryMetrics(_dateRange, _filters) {
        return { totalDeliveries: 0, successfulDeliveries: 0, failedDeliveries: 0, successRate: 0, averageDeliveryTime: 0, deliveriesByChannel: {}, deliveriesByStatus: {}, costByChannel: {}, totalCost: 0 };
    }
    async getQueueStatus() {
        return { totalQueued: 0, queuedByPriority: {}, queuedByChannel: {}, averageWaitTime: 0 };
    }
    async processQueue(_batchSize) {
        return { processed: 0, successful: 0, failed: 0, remaining: 0 };
    }
    async pauseChannel(_channel, _reason) { }
    async resumeChannel(_channel) { }
    async getPausedChannels() { return []; }
    async setChannelRateLimit(_channel, _maxRequests, _windowMs) { }
    async getRateLimitStatus(_channel) { return { maxRequests: 0, windowMs: 0, remaining: 0, resetAt: new Date() }; }
    async testChannel(_channel) { return { isHealthy: true, responseTime: 0 }; }
    async estimateDeliveryCost(_channels, _recipientCount, _contentLength) { return { totalCost: 0, costByChannel: {}, currency: 'VND' }; }
    async getFailedDeliveriesRequiringAttention() { return []; }
    async bulkDeliver(_requests) { return []; }
    async getChannelTemplates(_channel) { return []; }
    async configureChannelProvider(_channel, _providerConfig) { }
    async getChannelProviderConfig(_channel) { return {}; }
    async switchChannelProvider(_channel, _newProvider, _config) { }
    async getAvailableProviders(_channel) { return []; }
    async monitorPerformance() { return { overallHealth: 'HEALTHY', channelHealth: {}, alerts: [], recommendations: [] }; }
    async getHealthCheck() { return { isHealthy: true, channels: {}, queueSize: 0, averageProcessingTime: 0, errors: [] }; }
    async cleanupOldRecords(_olderThanDays) { return 0; }
    async exportDeliveryData(_dateRange, _format) { return ''; }
    async getServiceStatistics() { return { totalDeliveries: 0, dailyAverage: 0, peakDeliveries: 0, uptimePercentage: 100, averageResponseTime: 0, errorRate: 0, costEfficiency: 0 }; }
}
exports.MultiChannelDeliveryService = MultiChannelDeliveryService;
//# sourceMappingURL=MultiChannelDeliveryService.js.map