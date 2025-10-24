"use strict";
/**
 * RealTimeNotificationService - Real-time Notification Service
 * WebSocket-based real-time notification delivery with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Real-time Communication, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeNotificationService = void 0;
const socket_io_1 = require("socket.io");
class RealTimeNotificationService {
    constructor(server, notificationService) {
        this.notificationService = notificationService;
        this.connectedUsers = new Map();
        this.userSockets = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupSocketHandlers();
    }
    /**
     * Setup Socket.IO event handlers
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Socket connected: ${socket.id}`);
            // Handle user authentication
            socket.on('authenticate', async (data) => {
                try {
                    const user = await this.authenticateUser(data.token);
                    if (user) {
                        await this.handleUserConnection(socket, user, data.deviceInfo);
                    }
                    else {
                        socket.emit('auth_error', { message: 'Token xác thực không hợp lệ' });
                        socket.disconnect();
                    }
                }
                catch (error) {
                    socket.emit('auth_error', { message: 'Lỗi xác thực' });
                    socket.disconnect();
                }
            });
            // Handle user disconnection
            socket.on('disconnect', () => {
                this.handleUserDisconnection(socket);
            });
            // Handle notification acknowledgment
            socket.on('notification_ack', async (data) => {
                await this.handleNotificationAcknowledgment(socket, data.notificationId);
            });
            // Handle notification read
            socket.on('notification_read', async (data) => {
                await this.handleNotificationRead(socket, data.notificationId);
            });
            // Handle join room (for healthcare context)
            socket.on('join_room', (data) => {
                this.handleJoinRoom(socket, data.room);
            });
            // Handle leave room
            socket.on('leave_room', (data) => {
                this.handleLeaveRoom(socket, data.room);
            });
            // Handle ping for connection health
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: new Date().toISOString() });
                this.updateUserActivity(socket.id);
            });
        });
    }
    /**
     * Authenticate user from JWT token
     */
    async authenticateUser(token) {
        try {
            // This would integrate with your JWT authentication service
            // For now, we'll return a mock user
            return {
                id: 'user123',
                email: 'user@hospital.com',
                role: 'PATIENT',
                permissions: ['read_notifications']
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Handle user connection
     */
    async handleUserConnection(socket, user, deviceInfo) {
        const connectedUser = {
            userId: user.id,
            userRole: user.role,
            socketId: socket.id,
            connectedAt: new Date(),
            lastActivity: new Date(),
            rooms: [],
            deviceInfo
        };
        // Store user connection
        if (!this.connectedUsers.has(user.id)) {
            this.connectedUsers.set(user.id, []);
        }
        this.connectedUsers.get(user.id).push(connectedUser);
        this.userSockets.set(socket.id, socket);
        // Join user to their personal room
        socket.join(`user:${user.id}`);
        socket.join(`role:${user.role}`);
        // Send authentication success
        socket.emit('authenticated', {
            userId: user.id,
            userRole: user.role,
            message: 'Kết nối thành công'
        });
        // Send pending notifications
        await this.sendPendingNotifications(user.id);
        console.log(`✅ User ${user.id} (${user.role}) connected via ${socket.id}`);
    }
    /**
     * Handle user disconnection
     */
    handleUserDisconnection(socket) {
        const socketId = socket.id;
        // Find and remove user connection
        for (const [userId, connections] of this.connectedUsers.entries()) {
            const connectionIndex = connections.findIndex(conn => conn.socketId === socketId);
            if (connectionIndex !== -1) {
                connections.splice(connectionIndex, 1);
                // Remove user entry if no more connections
                if (connections.length === 0) {
                    this.connectedUsers.delete(userId);
                }
                console.log(`❌ User ${userId} disconnected from ${socketId}`);
                break;
            }
        }
        this.userSockets.delete(socketId);
    }
    /**
     * Send real-time notification to user
     */
    async sendRealTimeNotification(notification) {
        try {
            const recipientId = notification.recipientId;
            const userConnections = this.connectedUsers.get(recipientId);
            if (!userConnections || userConnections.length === 0) {
                console.log(`📱 User ${recipientId} not connected, skipping real-time notification`);
                return false;
            }
            // Send to all user connections
            let sent = false;
            for (const connection of userConnections) {
                const socket = this.userSockets.get(connection.socketId);
                if (socket) {
                    socket.emit('notification', {
                        ...notification,
                        timestamp: notification.timestamp.toISOString()
                    });
                    sent = true;
                }
            }
            if (sent) {
                console.log(`📨 Real-time notification sent to user ${recipientId}: ${notification.title}`);
            }
            return sent;
        }
        catch (error) {
            console.error('Lỗi khi gửi real-time notification:', error);
            return false;
        }
    }
    /**
     * Send notification to room (healthcare context)
     */
    async sendRoomNotification(room, notification) {
        try {
            this.io.to(room).emit('notification', {
                ...notification,
                timestamp: notification.timestamp.toISOString()
            });
            console.log(`📢 Room notification sent to ${room}: ${notification.title}`);
        }
        catch (error) {
            console.error('Lỗi khi gửi room notification:', error);
        }
    }
    /**
     * Send emergency alert to all connected users of specific role
     */
    async sendEmergencyAlert(alert, targetRoles = ['DOCTOR', 'NURSE']) {
        try {
            for (const role of targetRoles) {
                this.io.to(`role:${role}`).emit('emergency_alert', {
                    ...alert,
                    timestamp: alert.timestamp.toISOString()
                });
            }
            console.log(`🚨 Emergency alert sent to roles: ${targetRoles.join(', ')}`);
        }
        catch (error) {
            console.error('Lỗi khi gửi emergency alert:', error);
        }
    }
    /**
     * Send pending notifications to newly connected user
     */
    async sendPendingNotifications(userId) {
        try {
            // Get unread notifications from the last 24 hours
            const notifications = await this.notificationService.getNotificationsByRecipient(userId, {
                limit: 50,
                offset: 0,
                dateRange: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            if (notifications.notifications.length > 0) {
                const socket = this.getUserSocket(userId);
                if (socket) {
                    socket.emit('pending_notifications', {
                        count: notifications.notifications.length,
                        notifications: notifications.notifications.map(n => ({
                            notificationId: n.notificationId,
                            type: this.mapTemplateTypeToNotificationType(n.templateType),
                            priority: n.priority,
                            title: n.content?.subject || 'Thông báo',
                            message: n.content?.preview || '',
                            timestamp: n.createdAt,
                            actionRequired: n.templateType.includes('REMINDER') || n.templateType.includes('ALERT'),
                            healthcareContext: n.metadata.healthcareContext
                        }))
                    });
                }
            }
        }
        catch (error) {
            console.error('Lỗi khi gửi pending notifications:', error);
        }
    }
    /**
     * Handle notification acknowledgment
     */
    async handleNotificationAcknowledgment(socket, notificationId) {
        try {
            // Update notification status to acknowledged
            // This would integrate with your notification service
            console.log(`✅ Notification ${notificationId} acknowledged by ${socket.id}`);
            socket.emit('notification_ack_success', { notificationId });
        }
        catch (error) {
            console.error('Lỗi khi xử lý notification acknowledgment:', error);
            socket.emit('notification_ack_error', { notificationId, error: 'Lỗi xử lý' });
        }
    }
    /**
     * Handle notification read
     */
    async handleNotificationRead(socket, notificationId) {
        try {
            // Mark notification as read
            console.log(`👁️ Notification ${notificationId} read by ${socket.id}`);
            socket.emit('notification_read_success', { notificationId });
        }
        catch (error) {
            console.error('Lỗi khi xử lý notification read:', error);
            socket.emit('notification_read_error', { notificationId, error: 'Lỗi xử lý' });
        }
    }
    /**
     * Handle join room
     */
    handleJoinRoom(socket, room) {
        socket.join(room);
        // Update user's room list
        for (const [userId, connections] of this.connectedUsers.entries()) {
            const connection = connections.find(conn => conn.socketId === socket.id);
            if (connection) {
                if (!connection.rooms.includes(room)) {
                    connection.rooms.push(room);
                }
                break;
            }
        }
        console.log(`🏠 Socket ${socket.id} joined room: ${room}`);
        socket.emit('room_joined', { room });
    }
    /**
     * Handle leave room
     */
    handleLeaveRoom(socket, room) {
        socket.leave(room);
        // Update user's room list
        for (const [userId, connections] of this.connectedUsers.entries()) {
            const connection = connections.find(conn => conn.socketId === socket.id);
            if (connection) {
                const roomIndex = connection.rooms.indexOf(room);
                if (roomIndex !== -1) {
                    connection.rooms.splice(roomIndex, 1);
                }
                break;
            }
        }
        console.log(`🚪 Socket ${socket.id} left room: ${room}`);
        socket.emit('room_left', { room });
    }
    /**
     * Update user activity timestamp
     */
    updateUserActivity(socketId) {
        for (const [userId, connections] of this.connectedUsers.entries()) {
            const connection = connections.find(conn => conn.socketId === socketId);
            if (connection) {
                connection.lastActivity = new Date();
                break;
            }
        }
    }
    /**
     * Get user socket by user ID
     */
    getUserSocket(userId) {
        const userConnections = this.connectedUsers.get(userId);
        if (userConnections && userConnections.length > 0) {
            // Return the most recent connection
            const latestConnection = userConnections[userConnections.length - 1];
            return this.userSockets.get(latestConnection.socketId) || null;
        }
        return null;
    }
    /**
     * Map template type to notification type
     */
    mapTemplateTypeToNotificationType(templateType) {
        if (templateType.includes('APPOINTMENT'))
            return 'APPOINTMENT';
        if (templateType.includes('MEDICAL') || templateType.includes('TEST'))
            return 'MEDICAL_RECORD';
        if (templateType.includes('PAYMENT') || templateType.includes('INVOICE'))
            return 'BILLING';
        if (templateType.includes('EMERGENCY'))
            return 'EMERGENCY';
        if (templateType.includes('MEDICATION'))
            return 'MEDICATION';
        return 'SYSTEM';
    }
    /**
     * Get connected users statistics
     */
    getConnectionStats() {
        let totalConnections = 0;
        const connectionsByRole = {};
        const connectionsByDevice = {};
        for (const [userId, connections] of this.connectedUsers.entries()) {
            totalConnections += connections.length;
            connections.forEach(conn => {
                connectionsByRole[conn.userRole] = (connectionsByRole[conn.userRole] || 0) + 1;
                const deviceType = conn.deviceInfo?.type || 'unknown';
                connectionsByDevice[deviceType] = (connectionsByDevice[deviceType] || 0) + 1;
            });
        }
        return {
            totalConnections,
            uniqueUsers: this.connectedUsers.size,
            connectionsByRole,
            connectionsByDevice
        };
    }
    /**
     * Broadcast system announcement
     */
    async broadcastSystemAnnouncement(announcement) {
        try {
            const notification = {
                notificationId: `system_${Date.now()}`,
                recipientId: 'all',
                recipientType: 'SYSTEM',
                type: 'SYSTEM',
                priority: announcement.priority,
                title: announcement.title,
                message: announcement.message,
                timestamp: new Date(),
                expiresAt: announcement.expiresAt
            };
            if (announcement.targetRoles && announcement.targetRoles.length > 0) {
                // Send to specific roles
                for (const role of announcement.targetRoles) {
                    this.io.to(`role:${role}`).emit('system_announcement', notification);
                }
            }
            else {
                // Broadcast to all connected users
                this.io.emit('system_announcement', notification);
            }
            console.log(`📢 System announcement broadcasted: ${announcement.title}`);
        }
        catch (error) {
            console.error('Lỗi khi broadcast system announcement:', error);
        }
    }
}
exports.RealTimeNotificationService = RealTimeNotificationService;
//# sourceMappingURL=RealTimeNotificationService.js.map