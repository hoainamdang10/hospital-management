/**
 * RealTimeNotificationService - Simplified for Demo
 * Real-time notification delivery using WebSockets
 * 
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, WebSocket, Vietnamese Healthcare Standards
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface RealTimeNotification {
  id: string;
  type: 'appointment' | 'medical' | 'billing' | 'system' | 'emergency';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired?: boolean;
  healthcareContext?: any;
}

export class RealTimeNotificationService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, any[]>();

  constructor() {
    this.io = new SocketIOServer();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    this.io.attach(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected to real-time notifications');

      socket.on('authenticate', async (data) => {
        try {
          const { userId } = data;
          // Simplified authentication for demo
          socket.join(`user_${userId}`);
          this.connectedUsers.set(userId, [...(this.connectedUsers.get(userId) || []), socket]);
          
          socket.emit('authenticated', { success: true });
          console.log(`User ${userId} authenticated for real-time notifications`);
        } catch (error) {
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from real-time notifications');
      });
    });

    console.log(' Real-time notification service initialized');
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, notification: RealTimeNotification): Promise<void> {
    try {
      this.io.to(`user_${userId}`).emit('notification', notification);
      console.log(` Real-time notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(notification: RealTimeNotification): Promise<void> {
    try {
      this.io.emit('emergency_alert', notification);
      console.log(' Emergency alert broadcasted');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    totalConnections: number;
    connectedUsers: number;
  } {
    return {
      totalConnections: this.io.engine.clientsCount,
      connectedUsers: this.connectedUsers.size
    };
  }
}
