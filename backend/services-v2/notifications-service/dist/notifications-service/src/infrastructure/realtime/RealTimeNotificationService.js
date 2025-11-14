"use strict";
/**
 * RealTimeNotificationService - Simplified for Demo
 * Real-time notification delivery using WebSockets
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, WebSocket, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeNotificationService = void 0;
const socket_io_1 = require("socket.io");
class RealTimeNotificationService {
    constructor() {
        this.connectedUsers = new Map();
        this.io = new socket_io_1.Server();
    }
    /**
     * Initialize WebSocket server
     */
    initialize(server) {
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
                }
                catch (error) {
                    socket.emit('authentication_error', { error: 'Authentication failed' });
                }
            });
            socket.on('disconnect', () => {
                console.log('Client disconnected from real-time notifications');
            });
        });
        console.log('🔌 Real-time notification service initialized');
    }
    /**
     * Send notification to specific user
     */
    async sendToUser(userId, notification) {
        try {
            this.io.to(`user_${userId}`).emit('notification', notification);
            console.log(`📱 Real-time notification sent to user ${userId}`);
        }
        catch (error) {
            console.error('Error sending real-time notification:', error);
        }
    }
    /**
     * Send emergency alert
     */
    async sendEmergencyAlert(notification) {
        try {
            this.io.emit('emergency_alert', notification);
            console.log('🚨 Emergency alert broadcasted');
        }
        catch (error) {
            console.error('Error sending emergency alert:', error);
        }
    }
    /**
     * Get connection statistics
     */
    getConnectionStats() {
        return {
            totalConnections: this.io.engine.clientsCount,
            connectedUsers: this.connectedUsers.size
        };
    }
}
exports.RealTimeNotificationService = RealTimeNotificationService;
//# sourceMappingURL=RealTimeNotificationService.js.map