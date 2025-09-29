import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@hospital/shared';

interface ConnectedClient {
  id: string;
  rooms: Set<string>;
  connectedAt: Date;
  userId?: string;
  userRole?: string;
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
        logger.warn('⚠️ No HTTP server provided for WebSocket initialization');
        this.isInitialized = false;
        return;
      }

      this.io = new SocketIOServer(httpServer, {
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

      logger.info('✅ Medical Records WebSocket Manager initialized successfully on HTTP server');
    } catch (error) {
      logger.error('❌ Failed to initialize Medical Records WebSocket Manager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    logger.info('🔌 New Medical Records WebSocket connection:', socket.id);

    // Create client record
    const client: ConnectedClient = {
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
  private setupSocketHandlers(socket: Socket, client: ConnectedClient): void {
    // Handle authentication
    socket.on('authenticate', (data: { userId: string; userRole: string; token: string }) => {
      this.handleAuthentication(socket, client, data);
    });

    // Handle room joining
    socket.on('join_room', (roomName: string) => {
      this.handleJoinRoom(socket, client, roomName);
    });

    // Handle room leaving
    socket.on('leave_room', (roomName: string) => {
      this.handleLeaveRoom(socket, client, roomName);
    });

    // Handle medical record subscription
    socket.on('subscribe_medical_record', (recordId: string) => {
      this.handleSubscribeMedicalRecord(socket, client, recordId);
    });

    // Handle patient subscription
    socket.on('subscribe_patient', (patient_id: string) => {
      this.handleSubscribePatient(socket, client, patient_id);
    });

    // Handle doctor subscription
    socket.on('subscribe_doctor', (doctor_id: string) => {
      this.handleSubscribeDoctor(socket, client, doctor_id);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, client, reason);
    });

    // Handle errors
    socket.on('error', (error: any) => {
      logger.error('❌ Medical Records WebSocket error:', { socketId: socket.id, error });
    });
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(socket: Socket, client: ConnectedClient, data: { userId: string; userRole: string; token: string }): void {
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

      logger.info('✅ Medical Records client authenticated:', {
        socketId: socket.id,
        userId: data.userId,
        userRole: data.userRole
      });
    } catch (error) {
      socket.emit('authentication_error', {
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString()
      });
      logger.error('❌ Medical Records authentication error:', error);
    }
  }

  /**
   * Handle joining a room
   */
  private handleJoinRoom(socket: Socket, client: ConnectedClient, roomName: string): void {
    socket.join(roomName);
    client.rooms.add(roomName);
    
    socket.emit('room_joined', {
      room: roomName,
      timestamp: new Date().toISOString()
    });

    logger.info('📥 Medical Records client joined room:', {
      socketId: socket.id,
      room: roomName,
      userId: client.userId
    });
  }

  /**
   * Handle leaving a room
   */
  private handleLeaveRoom(socket: Socket, client: ConnectedClient, roomName: string): void {
    socket.leave(roomName);
    client.rooms.delete(roomName);
    
    socket.emit('room_left', {
      room: roomName,
      timestamp: new Date().toISOString()
    });

    logger.info('📤 Medical Records client left room:', {
      socketId: socket.id,
      room: roomName,
      userId: client.userId
    });
  }

  /**
   * Handle medical record subscription
   */
  private handleSubscribeMedicalRecord(socket: Socket, client: ConnectedClient, recordId: string): void {
    const roomName = `medical_record_${recordId}`;
    this.handleJoinRoom(socket, client, roomName);
  }

  /**
   * Handle patient subscription
   */
  private handleSubscribePatient(socket: Socket, client: ConnectedClient, patient_id: string): void {
    const roomName = `patient_${patient_id}`;
    this.handleJoinRoom(socket, client, roomName);
  }

  /**
   * Handle doctor subscription
   */
  private handleSubscribeDoctor(socket: Socket, client: ConnectedClient, doctor_id: string): void {
    const roomName = `doctor_${doctor_id}`;
    this.handleJoinRoom(socket, client, roomName);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: Socket, client: ConnectedClient, reason: string): void {
    logger.info('🔌 Medical Records service client disconnected:', {
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
  public broadcastToAll(event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ Medical Records WebSocket not initialized - skipping broadcast');
      return;
    }

    try {
      this.io.emit(event, {
        ...data,
        broadcast: true,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Medical Records service broadcast to all clients:', {
        event,
        clientCount: this.clients.size
      });
    } catch (error) {
      logger.error('❌ Error broadcasting to all clients:', error);
    }
  }

  /**
   * Broadcast message to specific room
   */
  public broadcastToRoom(roomName: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ Medical Records WebSocket not initialized - skipping room broadcast');
      return;
    }

    try {
      this.io.to(roomName).emit(event, {
        ...data,
        room: roomName,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Medical Records service broadcast to room:', {
        room: roomName,
        event
      });
    } catch (error) {
      logger.error('❌ Error broadcasting to room:', error);
    }
  }

  /**
   * Send message to specific client
   */
  public sendToClient(clientId: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ Medical Records WebSocket not initialized - skipping client message');
      return;
    }

    try {
      this.io.to(clientId).emit(event, {
        ...data,
        direct: true,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Medical Records service direct message to client:', {
        clientId,
        event
      });
    } catch (error) {
      logger.error('❌ Error sending message to client:', error);
    }
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
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
  public async disconnect(): Promise<void> {
    try {
      if (this.io) {
        this.io.close();
        this.io = null;
      }

      this.clients.clear();
      this.isInitialized = false;

      logger.info('✅ Medical Records WebSocket Manager disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Medical Records WebSocket Manager:', error);
    }
  }
}
