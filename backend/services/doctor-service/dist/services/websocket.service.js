"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const socket_io_1 = require("socket.io");
class WebSocketManager {
    constructor() {
        this.io = null;
        this.clients = new Map();
        this.isInitialized = false;
    }
    async initialize(httpServer) {
        try {
            if (!httpServer) {
                logger_1.default.warn("⚠️ No HTTP server provided for WebSocket initialization");
                this.isInitialized = false;
                return;
            }
            this.io = new socket_io_1.Server(httpServer, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:3000",
                    methods: ["GET", "POST"],
                    credentials: true,
                },
                transports: ["websocket", "polling"],
                allowEIO3: true,
            });
            this.setupEventHandlers();
            this.isInitialized = true;
            logger_1.default.info("✅ Doctor WebSocket Manager initialized successfully on HTTP server");
        }
        catch (error) {
            logger_1.default.error("❌ Failed to initialize Doctor WebSocket Manager:", error);
            this.isInitialized = false;
            throw error;
        }
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on("connection", (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        logger_1.default.info("🔌 New Doctor WebSocket connection:", socket.id);
        const client = {
            id: socket.id,
            rooms: new Set(),
            connectedAt: new Date(),
        };
        this.clients.set(socket.id, client);
        this.setupSocketHandlers(socket, client);
        socket.emit("connected", {
            message: "Connected to Doctor Service",
            clientId: socket.id,
            timestamp: new Date().toISOString(),
        });
    }
    setupSocketHandlers(socket, client) {
        socket.on("authenticate", (data) => {
            this.handleAuthentication(socket, client, data);
        });
        socket.on("join_room", (roomName) => {
            this.joinRoom(socket, client, roomName);
        });
        socket.on("leave_room", (roomName) => {
            this.leaveRoom(socket, client, roomName);
        });
        socket.on("subscribe_doctor", (doctor_id) => {
            this.subscribeToDoctorUpdates(socket, client, doctor_id);
        });
        socket.on("subscribe_medical_staff", () => {
            this.subscribeToMedicalStaffUpdates(socket, client);
        });
        socket.on("subscribe_admin_dashboard", () => {
            this.subscribeToAdminDashboard(socket, client);
        });
        socket.on("subscribe_appointment_service", () => {
            this.subscribeToAppointmentService(socket, client);
        });
        socket.on("disconnect", (reason) => {
            this.handleDisconnection(socket, client, reason);
        });
        socket.on("error", (error) => {
            logger_1.default.error("❌ Doctor WebSocket error for client:", socket.id, error);
        });
    }
    handleAuthentication(socket, client, data) {
        try {
            const { userId, userRole, doctor_id, patient_id } = data;
            client.userId = userId;
            client.userRole = userRole;
            client.doctor_id = doctor_id;
            client.patient_id = patient_id;
            if (userRole === "doctor" && doctor_id) {
                this.joinRoom(socket, client, `doctor_${doctor_id}`);
                this.joinRoom(socket, client, "medical_staff");
            }
            else if (userRole === "admin") {
                this.joinRoom(socket, client, "admin_dashboard");
                this.joinRoom(socket, client, "medical_staff");
            }
            else if (userRole === "appointment_service") {
                this.joinRoom(socket, client, "appointment_service");
            }
            socket.emit("authenticated", {
                success: true,
                message: "Authentication successful",
                clientInfo: {
                    userId,
                    userRole,
                    rooms: Array.from(client.rooms),
                },
            });
            logger_1.default.info("✅ Doctor service client authenticated:", {
                socketId: socket.id,
                userId,
                userRole,
            });
        }
        catch (error) {
            socket.emit("authentication_error", {
                success: false,
                message: "Authentication failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            logger_1.default.error("❌ Doctor service authentication failed for client:", socket.id, error);
        }
    }
    joinRoom(socket, client, roomName) {
        try {
            socket.join(roomName);
            client.rooms.add(roomName);
            socket.emit("room_joined", {
                room: roomName,
                message: `Joined room: ${roomName}`,
            });
            logger_1.default.info("📥 Doctor service client joined room:", {
                socketId: socket.id,
                room: roomName,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error joining room:", error);
        }
    }
    leaveRoom(socket, client, roomName) {
        try {
            socket.leave(roomName);
            client.rooms.delete(roomName);
            socket.emit("room_left", {
                room: roomName,
                message: `Left room: ${roomName}`,
            });
            logger_1.default.info("📤 Doctor service client left room:", {
                socketId: socket.id,
                room: roomName,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error leaving room:", error);
        }
    }
    subscribeToDoctorUpdates(socket, client, doctor_id) {
        const roomName = `doctor_${doctor_id}`;
        this.joinRoom(socket, client, roomName);
        client.doctor_id = doctor_id;
        socket.emit("subscription_confirmed", {
            type: "doctor_updates",
            doctor_id,
            message: `Subscribed to updates for doctor: ${doctor_id}`,
        });
    }
    subscribeToMedicalStaffUpdates(socket, client) {
        const roomName = "medical_staff";
        this.joinRoom(socket, client, roomName);
        socket.emit("subscription_confirmed", {
            type: "medical_staff_updates",
            message: "Subscribed to medical staff updates",
        });
    }
    subscribeToAdminDashboard(socket, client) {
        const roomName = "admin_dashboard";
        this.joinRoom(socket, client, roomName);
        socket.emit("subscription_confirmed", {
            type: "admin_dashboard",
            message: "Subscribed to admin dashboard updates",
        });
    }
    subscribeToAppointmentService(socket, client) {
        const roomName = "appointment_service";
        this.joinRoom(socket, client, roomName);
        socket.emit("subscription_confirmed", {
            type: "appointment_service",
            message: "Subscribed to appointment service updates",
        });
    }
    handleDisconnection(socket, client, reason) {
        logger_1.default.info("🔌 Doctor service client disconnected:", {
            socketId: socket.id,
            userId: client.userId,
            reason,
            connectedDuration: Date.now() - client.connectedAt.getTime(),
        });
        this.clients.delete(socket.id);
    }
    broadcastToAll(event, data) {
        if (!this.io || !this.isInitialized) {
            logger_1.default.warn("⚠️ Doctor WebSocket not initialized - skipping broadcast");
            return;
        }
        try {
            this.io.emit(event, {
                ...data,
                broadcast: true,
                timestamp: new Date().toISOString(),
            });
            logger_1.default.info("📡 Doctor service broadcast to all clients:", {
                event,
                clientCount: this.clients.size,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error broadcasting to all clients:", error);
        }
    }
    broadcastToRoom(roomName, event, data) {
        if (!this.io || !this.isInitialized) {
            logger_1.default.warn("⚠️ Doctor WebSocket not initialized - skipping room broadcast");
            return;
        }
        try {
            this.io.to(roomName).emit(event, {
                ...data,
                room: roomName,
                timestamp: new Date().toISOString(),
            });
            logger_1.default.info("📡 Doctor service broadcast to room:", {
                room: roomName,
                event,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error broadcasting to room:", error);
        }
    }
    sendToClient(clientId, event, data) {
        if (!this.io || !this.isInitialized) {
            logger_1.default.warn("⚠️ Doctor WebSocket not initialized - skipping client message");
            return;
        }
        try {
            this.io.to(clientId).emit(event, {
                ...data,
                direct: true,
                timestamp: new Date().toISOString(),
            });
            logger_1.default.info("📡 Doctor service direct message to client:", {
                clientId,
                event,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error sending message to client:", error);
        }
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
    getClientsInRoom(roomName) {
        return Array.from(this.clients.values()).filter((client) => client.rooms.has(roomName));
    }
    isWebSocketReady() {
        return this.isInitialized && this.io !== null;
    }
    async disconnect() {
        try {
            if (this.io) {
                this.io.close();
                this.io = null;
            }
            this.clients.clear();
            this.isInitialized = false;
            logger_1.default.info("✅ Doctor WebSocket Manager disconnected");
        }
        catch (error) {
            logger_1.default.error("❌ Error disconnecting Doctor WebSocket Manager:", error);
        }
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=websocket.service.js.map