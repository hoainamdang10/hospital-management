/**
 * RealTimeNotificationService - Simplified for Demo
 * Real-time notification delivery using WebSockets
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, WebSocket, Vietnamese Healthcare Standards
 */
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
export declare class RealTimeNotificationService {
    private io;
    private connectedUsers;
    constructor();
    /**
     * Initialize WebSocket server
     */
    initialize(server: HTTPServer): void;
    /**
     * Send notification to specific user
     */
    sendToUser(userId: string, notification: RealTimeNotification): Promise<void>;
    /**
     * Send emergency alert
     */
    sendEmergencyAlert(notification: RealTimeNotification): Promise<void>;
    /**
     * Get connection statistics
     */
    getConnectionStats(): {
        totalConnections: number;
        connectedUsers: number;
    };
}
//# sourceMappingURL=RealTimeNotificationService.d.ts.map