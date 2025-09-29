/**
 * Appointment WebSocket Handler - Presentation Layer
 * WebSocket handler for real-time appointment updates and notifications
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Real-time Communication, Healthcare Notifications, WebSocket Standards
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AppointmentScheduledEvent } from '../../domain/events/appointment-scheduled.event';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';
import { AppointmentRescheduledEvent } from '../../domain/events/appointment-rescheduled.event';

export interface WebSocketClient {
  socketId: string;
  userId: string;
  userRole: string;
  patientId?: string;
  providerId?: string;
  departments?: string[];
  subscriptions: string[];
  connectedAt: Date;
  lastActivity: Date;
}

export interface AppointmentNotification {
  type: 'appointment_scheduled' | 'appointment_cancelled' | 'appointment_rescheduled' | 'appointment_reminder' | 'appointment_status_changed';
  appointmentId: string;
  patientId?: string;
  providerId?: string;
  department?: string;
  message: string;
  messageVietnamese: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AppointmentWebSocketHandlerConfig {
  namespace: string;
  corsOrigins: string[];
  maxConnections: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

/**
 * Appointment WebSocket Handler
 * Manages real-time communication for appointment updates
 */
export class AppointmentWebSocketHandler {
  private readonly io: SocketIOServer;
  private readonly logger: ILogger;
  private readonly config: AppointmentWebSocketHandlerConfig;
  private readonly clients: Map<string, WebSocketClient> = new Map();
  private readonly patientSubscriptions: Map<string, Set<string>> = new Map();
  private readonly providerSubscriptions: Map<string, Set<string>> = new Map();
  private readonly departmentSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    io: SocketIOServer,
    config: AppointmentWebSocketHandlerConfig,
    logger: ILogger
  ) {
    this.io = io;
    this.config = config;
    this.logger = logger;

    this.setupNamespace();
    this.startHeartbeat();
  }

  /**
   * Setup WebSocket namespace and event handlers
   */
  private setupNamespace(): void {
    const namespace = this.io.of(this.config.namespace);

    namespace.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    this.logger.info('Appointment WebSocket namespace setup completed', {
      namespace: this.config.namespace,
      maxConnections: this.config.maxConnections
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    try {
      const userId = socket.handshake.auth?.userId;
      const userRole = socket.handshake.auth?.userRole || 'guest';
      const patientId = socket.handshake.auth?.patientId;
      const providerId = socket.handshake.auth?.providerId;
      const departments = socket.handshake.auth?.departments || [];

      if (!userId) {
        this.logger.warn('WebSocket connection rejected - missing userId', {
          socketId: socket.id,
          remoteAddress: socket.handshake.address
        });
        socket.disconnect(true);
        return;
      }

      // Check connection limit
      if (this.clients.size >= this.config.maxConnections) {
        this.logger.warn('WebSocket connection rejected - max connections reached', {
          socketId: socket.id,
          userId,
          currentConnections: this.clients.size,
          maxConnections: this.config.maxConnections
        });
        socket.emit('error', {
          message: 'Đã đạt giới hạn kết nối tối đa',
          code: 'MAX_CONNECTIONS_REACHED'
        });
        socket.disconnect(true);
        return;
      }

      // Create client record
      const client: WebSocketClient = {
        socketId: socket.id,
        userId,
        userRole,
        patientId,
        providerId,
        departments,
        subscriptions: [],
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      this.clients.set(socket.id, client);

      // Setup subscriptions based on user role
      this.setupUserSubscriptions(socket, client);

      // Setup event handlers
      this.setupSocketEventHandlers(socket, client);

      this.logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId,
        userRole,
        patientId,
        providerId,
        departments,
        totalConnections: this.clients.size
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Kết nối thành công',
        clientId: socket.id,
        serverTime: new Date().toISOString(),
        subscriptions: client.subscriptions
      });

    } catch (error) {
      this.logger.error('Error handling WebSocket connection', {
        socketId: socket.id,
        error: error.message,
        stack: error.stack
      });

      socket.emit('error', {
        message: 'Lỗi kết nối',
        code: 'CONNECTION_ERROR'
      });
      socket.disconnect(true);
    }
  }

  /**
   * Setup user-specific subscriptions
   */
  private setupUserSubscriptions(socket: Socket, client: WebSocketClient): void {
    // Patient subscriptions
    if (client.patientId) {
      socket.join(`patient:${client.patientId}`);
      client.subscriptions.push(`patient:${client.patientId}`);
      
      if (!this.patientSubscriptions.has(client.patientId)) {
        this.patientSubscriptions.set(client.patientId, new Set());
      }
      this.patientSubscriptions.get(client.patientId)!.add(socket.id);
    }

    // Provider subscriptions
    if (client.providerId) {
      socket.join(`provider:${client.providerId}`);
      client.subscriptions.push(`provider:${client.providerId}`);
      
      if (!this.providerSubscriptions.has(client.providerId)) {
        this.providerSubscriptions.set(client.providerId, new Set());
      }
      this.providerSubscriptions.get(client.providerId)!.add(socket.id);
    }

    // Department subscriptions
    if (client.departments && client.departments.length > 0) {
      client.departments.forEach(department => {
        socket.join(`department:${department}`);
        client.subscriptions.push(`department:${department}`);
        
        if (!this.departmentSubscriptions.has(department)) {
          this.departmentSubscriptions.set(department, new Set());
        }
        this.departmentSubscriptions.get(department)!.add(socket.id);
      });
    }

    // Role-based subscriptions
    socket.join(`role:${client.userRole}`);
    client.subscriptions.push(`role:${client.userRole}`);

    // Global notifications for admins
    if (client.userRole === 'admin') {
      socket.join('admin:global');
      client.subscriptions.push('admin:global');
    }

    this.logger.debug('User subscriptions setup completed', {
      socketId: socket.id,
      userId: client.userId,
      subscriptions: client.subscriptions
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(socket: Socket, client: WebSocketClient): void {
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, client, reason);
    });

    // Handle ping/pong for heartbeat
    socket.on('ping', () => {
      client.lastActivity = new Date();
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle subscription requests
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, client, data);
    });

    // Handle unsubscription requests
    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, client, data);
    });

    // Handle appointment status requests
    socket.on('get_appointment_status', (data) => {
      this.handleAppointmentStatusRequest(socket, client, data);
    });

    // Handle error events
    socket.on('error', (error) => {
      this.logger.error('WebSocket client error', {
        socketId: socket.id,
        userId: client.userId,
        error: error.message
      });
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: Socket, client: WebSocketClient, reason: string): void {
    try {
      // Remove from subscriptions
      if (client.patientId) {
        this.patientSubscriptions.get(client.patientId)?.delete(socket.id);
      }
      if (client.providerId) {
        this.providerSubscriptions.get(client.providerId)?.delete(socket.id);
      }
      if (client.departments) {
        client.departments.forEach(department => {
          this.departmentSubscriptions.get(department)?.delete(socket.id);
        });
      }

      // Remove client record
      this.clients.delete(socket.id);

      this.logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: client.userId,
        reason,
        connectionDuration: Date.now() - client.connectedAt.getTime(),
        totalConnections: this.clients.size
      });

    } catch (error) {
      this.logger.error('Error handling WebSocket disconnection', {
        socketId: socket.id,
        error: error.message
      });
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscription(socket: Socket, client: WebSocketClient, data: any): void {
    try {
      const { type, id } = data;

      if (!type || !id) {
        socket.emit('subscription_error', {
          message: 'Thiếu thông tin đăng ký',
          code: 'INVALID_SUBSCRIPTION_DATA'
        });
        return;
      }

      const subscriptionKey = `${type}:${id}`;

      // Check if already subscribed
      if (client.subscriptions.includes(subscriptionKey)) {
        socket.emit('subscription_result', {
          success: true,
          message: 'Đã đăng ký trước đó',
          subscription: subscriptionKey
        });
        return;
      }

      // Validate subscription permissions
      if (!this.canSubscribe(client, type, id)) {
        socket.emit('subscription_error', {
          message: 'Không có quyền đăng ký',
          code: 'SUBSCRIPTION_PERMISSION_DENIED'
        });
        return;
      }

      // Add subscription
      socket.join(subscriptionKey);
      client.subscriptions.push(subscriptionKey);

      // Update subscription maps
      this.updateSubscriptionMaps(type, id, socket.id);

      socket.emit('subscription_result', {
        success: true,
        message: 'Đăng ký thành công',
        subscription: subscriptionKey
      });

      this.logger.debug('Client subscribed to channel', {
        socketId: socket.id,
        userId: client.userId,
        subscription: subscriptionKey
      });

    } catch (error) {
      this.logger.error('Error handling subscription', {
        socketId: socket.id,
        error: error.message
      });

      socket.emit('subscription_error', {
        message: 'Lỗi đăng ký',
        code: 'SUBSCRIPTION_ERROR'
      });
    }
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscription(socket: Socket, client: WebSocketClient, data: any): void {
    try {
      const { type, id } = data;
      const subscriptionKey = `${type}:${id}`;

      const index = client.subscriptions.indexOf(subscriptionKey);
      if (index === -1) {
        socket.emit('unsubscription_result', {
          success: true,
          message: 'Chưa đăng ký trước đó',
          subscription: subscriptionKey
        });
        return;
      }

      // Remove subscription
      socket.leave(subscriptionKey);
      client.subscriptions.splice(index, 1);

      // Update subscription maps
      this.removeFromSubscriptionMaps(type, id, socket.id);

      socket.emit('unsubscription_result', {
        success: true,
        message: 'Hủy đăng ký thành công',
        subscription: subscriptionKey
      });

      this.logger.debug('Client unsubscribed from channel', {
        socketId: socket.id,
        userId: client.userId,
        subscription: subscriptionKey
      });

    } catch (error) {
      this.logger.error('Error handling unsubscription', {
        socketId: socket.id,
        error: error.message
      });
    }
  }

  /**
   * Handle appointment status requests
   */
  private handleAppointmentStatusRequest(socket: Socket, client: WebSocketClient, data: any): void {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        socket.emit('appointment_status_error', {
          message: 'Thiếu ID cuộc hẹn',
          code: 'MISSING_APPOINTMENT_ID'
        });
        return;
      }

      // TODO: Get actual appointment status from repository
      // For now, return mock status
      const mockStatus = {
        appointmentId,
        status: 'confirmed',
        statusVietnamese: 'Đã xác nhận',
        nextStatus: 'in_progress',
        nextStatusVietnamese: 'Đang thực hiện',
        estimatedStartTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        currentTime: new Date().toISOString()
      };

      socket.emit('appointment_status', mockStatus);

      this.logger.debug('Appointment status requested', {
        socketId: socket.id,
        userId: client.userId,
        appointmentId
      });

    } catch (error) {
      this.logger.error('Error handling appointment status request', {
        socketId: socket.id,
        appointmentId: data?.appointmentId,
        error: error.message
      });

      socket.emit('appointment_status_error', {
        message: 'Lỗi lấy trạng thái cuộc hẹn',
        code: 'APPOINTMENT_STATUS_ERROR'
      });
    }
  }

  /**
   * Broadcast appointment notification
   */
  async broadcastAppointmentNotification(notification: AppointmentNotification): Promise<void> {
    try {
      this.logger.info('Broadcasting appointment notification', {
        type: notification.type,
        appointmentId: notification.appointmentId,
        patientId: notification.patientId,
        providerId: notification.providerId,
        priority: notification.priority
      });

      const rooms: string[] = [];

      // Add patient room
      if (notification.patientId) {
        rooms.push(`patient:${notification.patientId}`);
      }

      // Add provider room
      if (notification.providerId) {
        rooms.push(`provider:${notification.providerId}`);
      }

      // Add department room
      if (notification.department) {
        rooms.push(`department:${notification.department}`);
      }

      // Add admin room for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        rooms.push('admin:global');
      }

      // Broadcast to all relevant rooms
      rooms.forEach(room => {
        this.io.of(this.config.namespace).to(room).emit('appointment_notification', notification);
      });

      this.logger.info('Appointment notification broadcasted successfully', {
        type: notification.type,
        appointmentId: notification.appointmentId,
        roomCount: rooms.length,
        rooms
      });

    } catch (error) {
      this.logger.error('Error broadcasting appointment notification', {
        type: notification.type,
        appointmentId: notification.appointmentId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle domain events
   */
  async handleDomainEvent(event: DomainEvent<any>): Promise<void> {
    try {
      let notification: AppointmentNotification | null = null;

      switch (event.eventType) {
        case 'appointment.scheduled':
          notification = this.createScheduledNotification(event as AppointmentScheduledEvent);
          break;

        case 'appointment.cancelled':
          notification = this.createCancelledNotification(event as AppointmentCancelledEvent);
          break;

        case 'appointment.rescheduled':
          notification = this.createRescheduledNotification(event as AppointmentRescheduledEvent);
          break;

        default:
          this.logger.debug('Unhandled domain event type', {
            eventType: event.eventType,
            eventId: event.eventId
          });
          return;
      }

      if (notification) {
        await this.broadcastAppointmentNotification(notification);
      }

    } catch (error) {
      this.logger.error('Error handling domain event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      });
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStatistics(): any {
    return {
      totalConnections: this.clients.size,
      patientConnections: this.patientSubscriptions.size,
      providerConnections: this.providerSubscriptions.size,
      departmentSubscriptions: this.departmentSubscriptions.size,
      connectionsByRole: this.getConnectionsByRole(),
      averageConnectionDuration: this.getAverageConnectionDuration()
    };
  }

  /**
   * Private helper methods
   */

  private canSubscribe(client: WebSocketClient, type: string, id: string): boolean {
    switch (type) {
      case 'patient':
        return client.userRole === 'admin' || client.patientId === id;
      
      case 'provider':
        return client.userRole === 'admin' || client.providerId === id;
      
      case 'department':
        return client.userRole === 'admin' || client.departments?.includes(id) || false;
      
      default:
        return false;
    }
  }

  private updateSubscriptionMaps(type: string, id: string, socketId: string): void {
    switch (type) {
      case 'patient':
        if (!this.patientSubscriptions.has(id)) {
          this.patientSubscriptions.set(id, new Set());
        }
        this.patientSubscriptions.get(id)!.add(socketId);
        break;
      
      case 'provider':
        if (!this.providerSubscriptions.has(id)) {
          this.providerSubscriptions.set(id, new Set());
        }
        this.providerSubscriptions.get(id)!.add(socketId);
        break;
      
      case 'department':
        if (!this.departmentSubscriptions.has(id)) {
          this.departmentSubscriptions.set(id, new Set());
        }
        this.departmentSubscriptions.get(id)!.add(socketId);
        break;
    }
  }

  private removeFromSubscriptionMaps(type: string, id: string, socketId: string): void {
    switch (type) {
      case 'patient':
        this.patientSubscriptions.get(id)?.delete(socketId);
        break;
      
      case 'provider':
        this.providerSubscriptions.get(id)?.delete(socketId);
        break;
      
      case 'department':
        this.departmentSubscriptions.get(id)?.delete(socketId);
        break;
    }
  }

  private createScheduledNotification(event: AppointmentScheduledEvent): AppointmentNotification {
    return {
      type: 'appointment_scheduled',
      appointmentId: event.data.appointmentId,
      patientId: event.data.patientId,
      providerId: event.data.providerId,
      department: event.data.department,
      message: `Appointment scheduled for ${event.data.startTime}`,
      messageVietnamese: `Cuộc hẹn đã được lên lịch lúc ${event.data.startTimeVietnamese}`,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      priority: event.data.priority === 'emergency' ? 'urgent' : 'normal'
    };
  }

  private createCancelledNotification(event: AppointmentCancelledEvent): AppointmentNotification {
    return {
      type: 'appointment_cancelled',
      appointmentId: event.data.appointmentId,
      patientId: event.data.patientId,
      providerId: event.data.providerId,
      department: event.data.department,
      message: `Appointment cancelled: ${event.data.reason}`,
      messageVietnamese: `Cuộc hẹn đã bị hủy: ${event.data.reasonVietnamese}`,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      priority: 'high'
    };
  }

  private createRescheduledNotification(event: AppointmentRescheduledEvent): AppointmentNotification {
    return {
      type: 'appointment_rescheduled',
      appointmentId: event.data.appointmentId,
      patientId: event.data.patientId,
      providerId: event.data.providerId,
      department: event.data.department,
      message: `Appointment rescheduled from ${event.data.oldStartTime} to ${event.data.newStartTime}`,
      messageVietnamese: `Cuộc hẹn đã được dời từ ${event.data.oldStartTimeVietnamese} sang ${event.data.newStartTimeVietnamese}`,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      priority: 'normal'
    };
  }

  private getConnectionsByRole(): { [role: string]: number } {
    const roleCount: { [role: string]: number } = {};
    
    this.clients.forEach(client => {
      roleCount[client.userRole] = (roleCount[client.userRole] || 0) + 1;
    });

    return roleCount;
  }

  private getAverageConnectionDuration(): number {
    if (this.clients.size === 0) return 0;

    const now = Date.now();
    let totalDuration = 0;

    this.clients.forEach(client => {
      totalDuration += now - client.connectedAt.getTime();
    });

    return Math.round(totalDuration / this.clients.size / 1000); // seconds
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);

    this.logger.debug('WebSocket heartbeat started', {
      interval: this.config.heartbeatInterval
    });
  }

  private performHeartbeat(): void {
    const now = new Date();
    const timeoutThreshold = now.getTime() - this.config.connectionTimeout;

    this.clients.forEach((client, socketId) => {
      if (client.lastActivity.getTime() < timeoutThreshold) {
        this.logger.warn('WebSocket client timed out', {
          socketId,
          userId: client.userId,
          lastActivity: client.lastActivity.toISOString()
        });

        const socket = this.io.of(this.config.namespace).sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.clients.clear();
    this.patientSubscriptions.clear();
    this.providerSubscriptions.clear();
    this.departmentSubscriptions.clear();

    this.logger.info('Appointment WebSocket handler cleanup completed');
  }
}
