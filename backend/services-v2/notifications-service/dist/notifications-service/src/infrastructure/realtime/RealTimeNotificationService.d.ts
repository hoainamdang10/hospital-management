/**
 * RealTimeNotificationService - Real-time Notification Service
 * WebSocket-based real-time notification delivery with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Real-time Communication, Vietnamese Healthcare Standards
 */
import { Server as HTTPServer } from 'http';
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
export interface RealTimeNotification {
    notificationId: string;
    recipientId: string;
    recipientType: string;
    type: 'APPOINTMENT' | 'MEDICAL_RECORD' | 'BILLING' | 'EMERGENCY' | 'MEDICATION' | 'SYSTEM';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    title: string;
    message: string;
    data?: any;
    timestamp: Date;
    expiresAt?: Date;
    actionRequired?: boolean;
    actionUrl?: string;
    healthcareContext?: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
    };
}
export interface ConnectedUser {
    userId: string;
    userRole: string;
    socketId: string;
    connectedAt: Date;
    lastActivity: Date;
    rooms: string[];
    deviceInfo?: {
        type: 'web' | 'mobile' | 'tablet';
        os?: string;
        browser?: string;
    };
}
export declare class RealTimeNotificationService {
    private readonly notificationService;
    private io;
    private connectedUsers;
    private userSockets;
    constructor(server: HTTPServer, notificationService: NotificationApplicationService);
    /**
     * Setup Socket.IO event handlers
     */
    private setupSocketHandlers;
    /**
     * Authenticate user from JWT token
     */
    private authenticateUser;
    /**
     * Handle user connection
     */
    private handleUserConnection;
    /**
     * Handle user disconnection
     */
    private handleUserDisconnection;
    /**
     * Send real-time notification to user
     */
    sendRealTimeNotification(notification: RealTimeNotification): Promise<boolean>;
    /**
     * Send notification to room (healthcare context)
     */
    sendRoomNotification(room: string, notification: RealTimeNotification): Promise<void>;
    /**
     * Send emergency alert to all connected users of specific role
     */
    sendEmergencyAlert(alert: RealTimeNotification, targetRoles?: string[]): Promise<void>;
    /**
     * Send pending notifications to newly connected user
     */
    private sendPendingNotifications;
    /**
     * Handle notification acknowledgment
     */
    private handleNotificationAcknowledgment;
    /**
     * Handle notification read
     */
    private handleNotificationRead;
    /**
     * Handle join room
     */
    private handleJoinRoom;
    /**
     * Handle leave room
     */
    private handleLeaveRoom;
    /**
     * Update user activity timestamp
     */
    private updateUserActivity;
    /**
     * Get user socket by user ID
     */
    private getUserSocket;
    /**
     * Map template type to notification type
     */
    private mapTemplateTypeToNotificationType;
    /**
     * Get connected users statistics
     */
    getConnectionStats(): {
        totalConnections: number;
        uniqueUsers: number;
        connectionsByRole: Record<string, number>;
        connectionsByDevice: Record<string, number>;
    };
    /**
     * Broadcast system announcement
     */
    broadcastSystemAnnouncement(announcement: {
        title: string;
        message: string;
        priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        targetRoles?: string[];
        expiresAt?: Date;
    }): Promise<void>;
}
//# sourceMappingURL=RealTimeNotificationService.d.ts.map