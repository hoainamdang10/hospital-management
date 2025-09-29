import logger from "@hospital/shared/dist/utils/logger";
import { Server as HttpServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

export interface ConnectedClient {
  id: string;
  userId?: string;
  userRole?: string;
  doctor_id?: string;
  patient_id?: string;
  rooms: Set<string>;
  connectedAt: Date;
}

export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize WebSocket server
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      if (!httpServer) {
        logger.warn("⚠️ No HTTP server provided for WebSocket initialization");
        this.isInitialized = false;
        return;
      }

      this.io = new SocketIOServer(httpServer, {
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

      logger.info(
        "✅ Doctor WebSocket Manager initialized successfully on HTTP server"
      );
    } catch (error) {
      logger.error("❌ Failed to initialize Doctor WebSocket Manager:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    logger.info("🔌 New Doctor WebSocket connection:", socket.id);

    // Create client record
    const client: ConnectedClient = {
      id: socket.id,
      rooms: new Set(),
      connectedAt: new Date(),
    };

    this.clients.set(socket.id, client);

    // Setup socket event handlers
    this.setupSocketHandlers(socket, client);

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to Doctor Service",
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketHandlers(socket: Socket, client: ConnectedClient): void {
    // Authentication
    socket.on("authenticate", (data) => {
      this.handleAuthentication(socket, client, data);
    });

    // Join specific rooms
    socket.on("join_room", (roomName: string) => {
      this.joinRoom(socket, client, roomName);
    });

    // Leave specific rooms
    socket.on("leave_room", (roomName: string) => {
      this.leaveRoom(socket, client, roomName);
    });

    // Subscribe to doctor updates
    socket.on("subscribe_doctor", (doctor_id: string) => {
      this.subscribeToDoctorUpdates(socket, client, doctor_id);
    });

    // Subscribe to medical staff updates
    socket.on("subscribe_medical_staff", () => {
      this.subscribeToMedicalStaffUpdates(socket, client);
    });

    // Subscribe to admin dashboard
    socket.on("subscribe_admin_dashboard", () => {
      this.subscribeToAdminDashboard(socket, client);
    });

    // Subscribe to appointment service updates
    socket.on("subscribe_appointment_service", () => {
      this.subscribeToAppointmentService(socket, client);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, client, reason);
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error("❌ Doctor WebSocket error for client:", socket.id, error);
    });
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(
    socket: Socket,
    client: ConnectedClient,
    data: any
  ): void {
    try {
      const { userId, userRole, doctor_id, patient_id } = data;

      // Update client information
      client.userId = userId;
      client.userRole = userRole;
      client.doctor_id = doctor_id;
      client.patient_id = patient_id;

      // Auto-join relevant rooms based on role
      if (userRole === "doctor" && doctor_id) {
        this.joinRoom(socket, client, `doctor_${doctor_id}`);
        this.joinRoom(socket, client, "medical_staff");
      } else if (userRole === "admin") {
        this.joinRoom(socket, client, "admin_dashboard");
        this.joinRoom(socket, client, "medical_staff");
      } else if (userRole === "appointment_service") {
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

      logger.info("✅ Doctor service client authenticated:", {
        socketId: socket.id,
        userId,
        userRole,
      });
    } catch (error) {
      socket.emit("authentication_error", {
        success: false,
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      logger.error(
        "❌ Doctor service authentication failed for client:",
        socket.id,
        error
      );
    }
  }

  /**
   * Join a room
   */
  private joinRoom(
    socket: Socket,
    client: ConnectedClient,
    roomName: string
  ): void {
    try {
      socket.join(roomName);
      client.rooms.add(roomName);

      socket.emit("room_joined", {
        room: roomName,
        message: `Joined room: ${roomName}`,
      });

      logger.info("📥 Doctor service client joined room:", {
        socketId: socket.id,
        room: roomName,
      });
    } catch (error) {
      logger.error("❌ Error joining room:", error);
    }
  }

  /**
   * Leave a room
   */
  private leaveRoom(
    socket: Socket,
    client: ConnectedClient,
    roomName: string
  ): void {
    try {
      socket.leave(roomName);
      client.rooms.delete(roomName);

      socket.emit("room_left", {
        room: roomName,
        message: `Left room: ${roomName}`,
      });

      logger.info("📤 Doctor service client left room:", {
        socketId: socket.id,
        room: roomName,
      });
    } catch (error) {
      logger.error("❌ Error leaving room:", error);
    }
  }

  /**
   * Subscribe to doctor updates
   */
  private subscribeToDoctorUpdates(
    socket: Socket,
    client: ConnectedClient,
    doctor_id: string
  ): void {
    const roomName = `doctor_${doctor_id}`;
    this.joinRoom(socket, client, roomName);

    client.doctor_id = doctor_id;

    socket.emit("subscription_confirmed", {
      type: "doctor_updates",
      doctor_id,
      message: `Subscribed to updates for doctor: ${doctor_id}`,
    });
  }

  /**
   * Subscribe to medical staff updates
   */
  private subscribeToMedicalStaffUpdates(
    socket: Socket,
    client: ConnectedClient
  ): void {
    const roomName = "medical_staff";
    this.joinRoom(socket, client, roomName);

    socket.emit("subscription_confirmed", {
      type: "medical_staff_updates",
      message: "Subscribed to medical staff updates",
    });
  }

  /**
   * Subscribe to admin dashboard
   */
  private subscribeToAdminDashboard(
    socket: Socket,
    client: ConnectedClient
  ): void {
    const roomName = "admin_dashboard";
    this.joinRoom(socket, client, roomName);

    socket.emit("subscription_confirmed", {
      type: "admin_dashboard",
      message: "Subscribed to admin dashboard updates",
    });
  }

  /**
   * Subscribe to appointment service updates
   */
  private subscribeToAppointmentService(
    socket: Socket,
    client: ConnectedClient
  ): void {
    const roomName = "appointment_service";
    this.joinRoom(socket, client, roomName);

    socket.emit("subscription_confirmed", {
      type: "appointment_service",
      message: "Subscribed to appointment service updates",
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(
    socket: Socket,
    client: ConnectedClient,
    reason: string
  ): void {
    logger.info("🔌 Doctor service client disconnected:", {
      socketId: socket.id,
      userId: client.userId,
      reason,
      connectedDuration: Date.now() - client.connectedAt.getTime(),
    });

    // Remove client from tracking
    this.clients.delete(socket.id);
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcastToAll(event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn("⚠️ Doctor WebSocket not initialized - skipping broadcast");
      return;
    }

    try {
      this.io.emit(event, {
        ...data,
        broadcast: true,
        timestamp: new Date().toISOString(),
      });

      logger.info("📡 Doctor service broadcast to all clients:", {
        event,
        clientCount: this.clients.size,
      });
    } catch (error) {
      logger.error("❌ Error broadcasting to all clients:", error);
    }
  }

  /**
   * Broadcast message to specific room
   */
  public broadcastToRoom(roomName: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn(
        "⚠️ Doctor WebSocket not initialized - skipping room broadcast"
      );
      return;
    }

    try {
      this.io.to(roomName).emit(event, {
        ...data,
        room: roomName,
        timestamp: new Date().toISOString(),
      });

      logger.info("📡 Doctor service broadcast to room:", {
        room: roomName,
        event,
      });
    } catch (error) {
      logger.error("❌ Error broadcasting to room:", error);
    }
  }

  /**
   * Send message to specific client
   */
  public sendToClient(clientId: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn(
        "⚠️ Doctor WebSocket not initialized - skipping client message"
      );
      return;
    }

    try {
      this.io.to(clientId).emit(event, {
        ...data,
        direct: true,
        timestamp: new Date().toISOString(),
      });

      logger.info("📡 Doctor service direct message to client:", {
        clientId,
        event,
      });
    } catch (error) {
      logger.error("❌ Error sending message to client:", error);
    }
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients in specific room
   */
  public getClientsInRoom(roomName: string): ConnectedClient[] {
    return Array.from(this.clients.values()).filter((client) =>
      client.rooms.has(roomName)
    );
  }

  /**
   * Get connection status
   */
  public isWebSocketReady(): boolean {
    return this.isInitialized && this.io !== null;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      if (this.io) {
        this.io.close();
        this.io = null;
      }

      this.clients.clear();
      this.isInitialized = false;

      logger.info("✅ Doctor WebSocket Manager disconnected");
    } catch (error) {
      logger.error("❌ Error disconnecting Doctor WebSocket Manager:", error);
    }
  }
}
