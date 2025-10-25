"use strict";
/**
 * PushProvider - Firebase Cloud Messaging Provider
 * Sends push notifications via FCM
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FCM Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushProvider = void 0;
class PushProvider {
    constructor(config) {
        this.config = config;
        this.isConfigured = false;
        this.isConfigured = !!config.projectId;
    }
    getType() {
        return 'PUSH';
    }
    async isAvailable() {
        return this.isConfigured;
    }
    async deliver(request) {
        try {
            // Get push token from recipient (would come from preferences)
            const pushToken = 'mock-fcm-token'; // In production: get from recipient preferences
            if (!pushToken) {
                return {
                    status: 'FAILED',
                    failureReason: 'Recipient has no push token registered'
                };
            }
            const title = request.content.getSubject() || 'Thông báo';
            const body = request.content.getBody();
            // Truncate body for push notification (max ~200 chars)
            const truncatedBody = body.length > 200 ? body.substring(0, 197) + '...' : body;
            const messageId = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`[PushProvider] Sending push to token ${pushToken.substring(0, 20)}...`);
            // Mock FCM API call
            const fcmResponse = await this.sendViaFCM({
                token: pushToken,
                notification: {
                    title,
                    body: truncatedBody
                },
                data: {
                    notificationId: request.metadata?.notificationId || '',
                    recipientId: request.recipient.getRecipientId(),
                    type: 'healthcare_notification'
                },
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'notification_icon',
                        color: '#0066cc',
                        sound: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title,
                                body: truncatedBody
                            },
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            });
            return {
                status: 'SENT',
                messageId,
                deliveredAt: new Date(),
                providerResponse: fcmResponse
            };
        }
        catch (error) {
            return {
                status: 'FAILED',
                failureReason: error instanceof Error ? error.message : 'Push notification failed',
                providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    async getDeliveryStatus(messageId) {
        console.log(`[PushProvider] Checking status for message ${messageId}`);
        return {
            status: 'DELIVERED',
            deliveredAt: new Date()
        };
    }
    /**
     * Send via Firebase Cloud Messaging (mock)
     */
    async sendViaFCM(message) {
        // In production:
        // const admin = require('firebase-admin');
        // const response = await admin.messaging().send(message);
        // return response;
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
            messageId: message.data?.notificationId || 'mock-fcm-message-id',
            success: true
        };
    }
}
exports.PushProvider = PushProvider;
//# sourceMappingURL=PushProvider.js.map