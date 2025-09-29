import { toast } from 'sonner';

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: string;
  debug?: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
  id?: string;
}

export type WebSocketEventHandler = (data: any) => void;
export type WebSocketStatusHandler = (status: WebSocketStatus) => void;

export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  CLOSED = 'closed'
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private statusHandlers = new Set<WebSocketStatusHandler>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private messageQueue: WebSocketMessage[] = [];
  private isDestroyed = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      heartbeatMessage: JSON.stringify({ type: 'ping' }),
      debug: false,
      protocols: undefined,
      ...config
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new Error('WebSocket manager has been destroyed'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setStatus(WebSocketStatus.CONNECTING);
      this.log('Connecting to WebSocket server...');

      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.setStatus(WebSocketStatus.CONNECTED);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          this.log(`WebSocket closed: ${event.code} ${event.reason}`);
          this.stopHeartbeat();
          
          if (!this.isDestroyed && event.code !== 1000) {
            this.setStatus(WebSocketStatus.DISCONNECTED);
            this.scheduleReconnect();
          } else {
            this.setStatus(WebSocketStatus.CLOSED);
          }
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.setStatus(WebSocketStatus.ERROR);
          reject(error);
        };

      } catch (error) {
        this.log('Failed to create WebSocket:', error);
        this.setStatus(WebSocketStatus.ERROR);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting WebSocket...');
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setStatus(WebSocketStatus.DISCONNECTED);
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): boolean {
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    
    if (!message.id) {
      message.id = this.generateMessageId();
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.log('Message sent:', message);
        return true;
      } catch (error) {
        this.log('Failed to send message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.log('WebSocket not connected, queueing message:', message);
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Subscribe to specific message types
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.status === WebSocketStatus.CONNECTED;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      status: this.status,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      eventHandlers: this.eventHandlers.size,
      statusHandlers: this.statusHandlers.size,
      url: this.config.url
    };
  }

  /**
   * Destroy the WebSocket manager
   */
  destroy(): void {
    this.log('Destroying WebSocket manager...');
    this.isDestroyed = true;
    this.disconnect();
    this.eventHandlers.clear();
    this.statusHandlers.clear();
    this.messageQueue = [];
  }

  // Private methods
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Message received:', message);

      // Handle heartbeat response
      if (message.type === 'pong') {
        this.log('Heartbeat response received');
        return;
      }

      // Emit to event handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            this.log('Error in event handler:', error);
          }
        });
      }

      // Emit to wildcard handlers
      const wildcardHandlers = this.eventHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            this.log('Error in wildcard handler:', error);
          }
        });
      }

    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.log(`Status changed to: ${status}`);
      
      this.statusHandlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          this.log('Error in status handler:', error);
        }
      });

      // Show user-friendly notifications
      this.showStatusNotification(status);
    }
  }

  private showStatusNotification(status: WebSocketStatus): void {
    switch (status) {
      case WebSocketStatus.CONNECTED:
        if (this.reconnectAttempts > 0) {
          toast.success('Reconnected to server');
        }
        break;
      case WebSocketStatus.DISCONNECTED:
        toast.warning('Connection lost. Attempting to reconnect...');
        break;
      case WebSocketStatus.ERROR:
        toast.error('Connection error occurred');
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached or manager destroyed');
      toast.error('Unable to reconnect to server. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnect failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(this.config.heartbeatMessage);
          this.log('Heartbeat sent');
        } catch (error) {
          this.log('Failed to send heartbeat:', error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private flushMessageQueue(): void {
    this.log(`Flushing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[WebSocketManager] ${message}`, ...args);
    }
  }
}

// Global WebSocket manager instance
let globalWebSocketManager: WebSocketManager | null = null;

export function getWebSocketManager(config?: WebSocketConfig): WebSocketManager {
  if (!globalWebSocketManager && config) {
    globalWebSocketManager = new WebSocketManager(config);
  }
  
  if (!globalWebSocketManager) {
    throw new Error('WebSocket manager not initialized. Please provide config on first call.');
  }
  
  return globalWebSocketManager;
}

export function destroyWebSocketManager(): void {
  if (globalWebSocketManager) {
    globalWebSocketManager.destroy();
    globalWebSocketManager = null;
  }
}

// React hooks for WebSocket management
import React from 'react';

export function useWebSocket(config?: WebSocketConfig) {
  const [status, setStatus] = React.useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [isConnected, setIsConnected] = React.useState(false);
  const wsManager = React.useRef<WebSocketManager | null>(null);

  React.useEffect(() => {
    if (config) {
      wsManager.current = new WebSocketManager(config);

      const unsubscribeStatus = wsManager.current.onStatusChange((newStatus) => {
        setStatus(newStatus);
        setIsConnected(newStatus === WebSocketStatus.CONNECTED);
      });

      // Auto-connect
      wsManager.current.connect().catch(console.error);

      return () => {
        unsubscribeStatus();
        if (wsManager.current) {
          wsManager.current.destroy();
        }
      };
    }
  }, [config?.url]);

  const send = React.useCallback((message: WebSocketMessage) => {
    return wsManager.current?.send(message) || false;
  }, []);

  const subscribe = React.useCallback((eventType: string, handler: WebSocketEventHandler) => {
    return wsManager.current?.on(eventType, handler) || (() => {});
  }, []);

  const connect = React.useCallback(() => {
    return wsManager.current?.connect() || Promise.reject('No WebSocket manager');
  }, []);

  const disconnect = React.useCallback(() => {
    wsManager.current?.disconnect();
  }, []);

  const getStats = React.useCallback(() => {
    return wsManager.current?.getStats() || null;
  }, []);

  return {
    status,
    isConnected,
    send,
    subscribe,
    connect,
    disconnect,
    getStats
  };
}

export function useWebSocketSubscription<T = any>(
  eventType: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const wsManager = React.useRef<WebSocketManager | null>(null);

  React.useEffect(() => {
    try {
      wsManager.current = getWebSocketManager();
      const unsubscribe = wsManager.current.on(eventType, handler);
      return unsubscribe;
    } catch (error) {
      console.warn('WebSocket manager not available for subscription');
      return () => {};
    }
  }, [eventType, ...deps]);
}
