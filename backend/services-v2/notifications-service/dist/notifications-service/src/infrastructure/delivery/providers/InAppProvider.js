"use strict";
/**
 * InAppProvider - Socket.IO In-App Notification Provider
 * Sends real-time notifications via WebSocket
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Real-time Notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppProvider = void 0;
class InAppProvider {
    constructor(socketServer) {
        this.socketServer = socketServer;
    }
    getType() {
        return 'IN_APP';
    }
    async isAvailable() {
        // In-app is always available if service is running
        return true;
    }
    async deliver(request) {
        try {
            const recipientId = request.recipient.getRecipientId();
            const messageId = `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Prepare notification payload
            const payload = {
                notificationId: request.metadata?.notificationId,
                recipientId,
                title: request.content.getSubject() || 'Thông báo',
                message: request.content.getBody(),
                timestamp: new Date(),
                priority: request.metadata?.priority || 'NORMAL',
                category: request.metadata?.category,
                actionUrl: request.metadata?.actionUrl,
                icon: '🏥',
                sound: true
            };
            // Emit to recipient's socket room
            if (this.socketServer) {
                this.socketServer.to(`user:${recipientId}`).emit('notification', payload);
                console.log(`[InAppProvider] Sent in-app notification to user:${recipientId}`);
            }
            else {
                console.warn('[InAppProvider] Socket server not initialized - notification queued');
            }
            return {
                status: 'SENT',
                messageId,
                deliveredAt: new Date(),
                providerResponse: payload
            };
        }
        catch (error) {
            return {
                status: 'FAILED',
                failureReason: error instanceof Error ? error.message : 'In-app delivery failed',
                providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    async getDeliveryStatus(messageId) {
        // In-app notifications are instant - always delivered if sent
        console.log(`[InAppProvider] Status check for ${messageId} - instant delivery`);
        return {
            status: 'DELIVERED',
            deliveredAt: new Date()
        };
    }
    /**
     * Set Socket.IO server instance
     */
    setSocketServer(server) {
        this.socketServer = server;
    }
}
exports.InAppProvider = InAppProvider;
//# sourceMappingURL=InAppProvider.js.map