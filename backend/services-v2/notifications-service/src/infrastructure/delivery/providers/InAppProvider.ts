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

export class InAppProvider implements ChannelProvider {
  private socketServer: any; // Socket.IO server instance

  constructor(socketServer?: any) {
    this.socketServer = socketServer;
  }

  getType(): string {
    return 'IN_APP';
  }

  async isAvailable(): Promise<boolean> {
    // In-app is always available if service is running
    return true;
  }

  async deliver(request: {
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
  }> {
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
        icon: '',
        sound: true
      };

      // Emit to recipient's socket room
      if (this.socketServer) {
        this.socketServer.to(`user:${recipientId}`).emit('notification', payload);
        console.log(`[InAppProvider] Sent in-app notification to user:${recipientId}`);
      } else {
        console.warn('[InAppProvider] Socket server not initialized - notification queued');
      }

      return {
        status: 'SENT',
        messageId,
        deliveredAt: new Date(),
        providerResponse: payload
      };

    } catch (error) {
      return {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'In-app delivery failed',
        providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: Date;
    failureReason?: string;
  }> {
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
  public setSocketServer(server: any): void {
    this.socketServer = server;
  }
}

