/**
 * Redis Client for Rate Limiting
 * Shared Redis connection for distributed rate limiting
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { ILogger } from '@application/services/ILogger';

export interface RedisRateLimitConfig {
  url: string;
  password?: string;
  db?: number;
}

export class RedisRateLimitClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor(
    private config: RedisRateLimitConfig,
    private logger: ILogger
  ) {
    this.client = createClient({
      url: config.url,
      password: config.password,
      database: config.db || 1,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            this.logger.error('Redis rate limit client: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          this.logger.warn(`Redis rate limit client: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.info('Redis rate limit client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.info('Redis rate limit client ready', {
        url: this.config.url,
        db: this.config.db || 1
      });
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis rate limit client error', {
        error: error.message,
        stack: error.stack
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      this.logger.warn('Redis rate limit client disconnected');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis rate limit client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.logger.info('Redis rate limit client connected successfully');
      } catch (error) {
        this.logger.error('Failed to connect Redis rate limit client', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.quit();
        this.logger.info('Redis rate limit client disconnected gracefully');
      } catch (error) {
        this.logger.error('Error disconnecting Redis rate limit client', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client.isReady;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis rate limit client ping failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    ready: boolean;
    db: number;
    url: string;
  }> {
    return {
      connected: this.isConnected,
      ready: this.isReady(),
      db: this.config.db || 1,
      url: this.config.url
    };
  }
}

