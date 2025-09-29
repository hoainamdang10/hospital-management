"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const socket_io_1 = require("socket.io");
const shared_1 = require("@hospital/shared");
class WebSocketManager {
    constructor() {
        this.io = null;
        this.clients = new Map();
        this.isInitialized = false;
    }
    /**
     * Initialize WebSocket server
     */
    async initialize(httpServer) {
        try {
            if (!httpServer) {
                shared_1.logger.warn('⚠️ No HTTP server provided for WebSocket initialization');
                this.isInitialized = false;
                return;
            }
            this.io = new socket_io_1.Server(httpServer, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:3000",
                    methods: ["GET", "POST"],
                    credentials: true
                },
                transports: ['websocket', 'polling'],
                allowEIO3: true
            });
            this.setupEventHandlers();
            this.isInitialized = true;
            shared_1.logger.info('✅ Medical Records WebSocket Manager initialized successfully on HTTP server');
        }
        catch (error) {
            shared_1.logger.error('❌ Failed to initialize Medical Records WebSocket Manager:', error);
            this.isInitialized = false;
            throw error;
        }
    }
    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(socket) {
        shared_1.logger.info('🔌 New Medical Records WebSocket connection:', socket.id);
        // Create client record
        const client = {
            id: socket.id,
            rooms: new Set(),
            connectedAt: new Date()
        };
        this.clients.set(socket.id, client);
        // Setup socket event handlers
        this.setupSocketHandlers(socket, client);
        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to Medical Records Service',
            clientId: socket.id,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Setup individual socket event handlers
     */
    setupSocketHandlers(socket, client) {
        // Handle authentication
        socket.on('authenticate', (data) => {
            this.handleAuthentication(socket, client, data);
        });
        // Handle room joining
        socket.on('join_room', (roomName) => {
            this.handleJoinRoom(socket, client, roomName);
        });
        // Handle room leaving
        socket.on('leave_room', (roomName) => {
            this.handleLeaveRoom(socket, client, roomName);
        });
        // Handle medical record subscription
        socket.on('subscribe_medical_record', (recordId) => {
            this.handleSubscribeMedicalRecord(socket, client, recordId);
        });
        // Handle patient subscription
        socket.on('subscribe_patient', (patient_id) => {
            this.handleSubscribePatient(socket, client, patient_id);
        });
        // Handle doctor subscription
        socket.on('subscribe_doctor', (doctor_id) => {
            this.handleSubscribeDoctor(socket, client, doctor_id);
        });
        // Handle ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, client, reason);
        });
        // Handle errors
        socket.on('error', (error) => {
            shared_1.logger.error('❌ Medical Records WebSocket error:', { socketId: socket.id, error });
        });
    }
    /**
     * Handle client authentication
     */
    handleAuthentication(socket, client, data) {
        try {
            // TODO: Validate token with auth service
            client.userId = data.userId;
            client.userRole = data.userRole;
            // Join role-based room
            socket.join(`role_${data.userRole}`);
            client.rooms.add(`role_${data.userRole}`);
            // Join user-specific room
            socket.join(`user_${data.userId}`);
            client.rooms.add(`user_${data.userId}`);
            socket.emit('authenticated', {
                success: true,
                userId: data.userId,
                userRole: data.userRole,
                timestamp: new Date().toISOString()
            });
            shared_1.logger.info('✅ Medical Records client authenticated:', {
                socketId: socket.id,
                userId: data.userId,
                userRole: data.userRole
            });
        }
        catch (error) {
            socket.emit('authentication_error', {
                success: false,
                error: 'Authentication failed',
                timestamp: new Date().toISOString()
            });
            shared_1.logger.error('❌ Medical Records authentication error:', error);
        }
    }
    /**
     * Handle joining a room
     */
    handleJoinRoom(socket, client, roomName) {
        socket.join(roomName);
        client.rooms.add(roomName);
        socket.emit('room_joined', {
            room: roomName,
            timestamp: new Date().toISOString()
        });
        shared_1.logger.info('📥 Medical Records client joined room:', {
            socketId: socket.id,
            room: roomName,
            userId: client.userId
        });
    }
    /**
     * Handle leaving a room
     */
    handleLeaveRoom(socket, client, roomName) {
        socket.leave(roomName);
        client.rooms.delete(roomName);
        socket.emit('room_left', {
            room: roomName,
            timestamp: new Date().toISOString()
        });
        shared_1.logger.info('📤 Medical Records client left room:', {
            socketId: socket.id,
            room: roomName,
            userId: client.userId
        });
    }
    /**
     * Handle medical record subscription
     */
    handleSubscribeMedicalRecord(socket, client, recordId) {
        const roomName = `medical_record_${recordId}`;
        this.handleJoinRoom(socket, client, roomName);
    }
    /**
     * Handle patient subscription
     */
    handleSubscribePatient(socket, client, patient_id) {
        const roomName = `patient_${patient_id}`;
        this.handleJoinRoom(socket, client, roomName);
    }
    /**
     * Handle doctor subscription
     */
    handleSubscribeDoctor(socket, client, doctor_id) {
        const roomName = `doctor_${doctor_id}`;
        this.handleJoinRoom(socket, client, roomName);
    }
    /**
     * Handle client disconnection
     */
    handleDisconnection(socket, client, reason) {
        shared_1.logger.info('🔌 Medical Records service client disconnected:', {
            socketId: socket.id,
            userId: client.userId,
            reason,
            connectedDuration: Date.now() - client.connectedAt.getTime()
        });
        this.clients.delete(socket.id);
    }
    /**
     * Broadcast message to all connected clients
     */
    broadcastToAll(event, data) {
        if (!this.io || !this.isInitialized) {
            shared_1.logger.warn('⚠️ Medical Records WebSocket not initialized - skipping broadcast');
            return;
        }
        try {
            this.io.emit(event, {
                ...data,
                broadcast: true,
                timestamp: new Date().toISOString()
            });
            shared_1.logger.info('📡 Medical Records service broadcast to all clients:', {
                event,
                clientCount: this.clients.size
            });
        }
        catch (error) {
            shared_1.logger.error('❌ Error broadcasting to all clients:', error);
        }
    }
    /**
     * Broadcast message to specific room
     */
    broadcastToRoom(roomName, event, data) {
        if (!this.io || !this.isInitialized) {
            shared_1.logger.warn('⚠️ Medical Records WebSocket not initialized - skipping room broadcast');
            return;
        }
        try {
            this.io.to(roomName).emit(event, {
                ...data,
                room: roomName,
                timestamp: new Date().toISOString()
            });
            shared_1.logger.info('📡 Medical Records service broadcast to room:', {
                room: roomName,
                event
            });
        }
        catch (error) {
            shared_1.logger.error('❌ Error broadcasting to room:', error);
        }
    }
    /**
     * Send message to specific client
     */
    sendToClient(clientId, event, data) {
        if (!this.io || !this.isInitialized) {
            shared_1.logger.warn('⚠️ Medical Records WebSocket not initialized - skipping client message');
            return;
        }
        try {
            this.io.to(clientId).emit(event, {
                ...data,
                direct: true,
                timestamp: new Date().toISOString()
            });
            shared_1.logger.info('📡 Medical Records service direct message to client:', {
                clientId,
                event
            });
        }
        catch (error) {
            shared_1.logger.error('❌ Error sending message to client:', error);
        }
    }
    /**
     * Get connected clients count
     */
    getConnectedClientsCount() {
        return this.clients.size;
    }
    /**
     * Get connection status
     */
    isWebSocketReady() {
        return this.isInitialized && this.io !== null;
    }
    /**
     * Disconnect and cleanup
     */
    async disconnect() {
        try {
            if (this.io) {
                this.io.close();
                this.io = null;
            }
            this.clients.clear();
            this.isInitialized = false;
            shared_1.logger.info('✅ Medical Records WebSocket Manager disconnected');
        }
        catch (error) {
            shared_1.logger.error('❌ Error disconnecting Medical Records WebSocket Manager:', error);
        }
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=websocket.service.js.map