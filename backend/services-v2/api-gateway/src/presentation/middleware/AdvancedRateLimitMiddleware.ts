/**
 * Advanced Rate Limiting Middleware
 * Redis-based distributed rate limiting with per-user and per-endpoint granularity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { RedisRateLimitClient } from '@infrastructure/cache/RedisRateLimitClient';
import { ILogger } from '@application/services/ILogger';

export interface RateLimitConfig {
  global: {
    windowMs: number;
    max: number;
  };
  perUser: {
    windowMs: number;
    max: number;
  };
  perEndpoint: {
    [endpoint: string]: {
      windowMs: number;
      max: number;
    };
  };
}

export class AdvancedRateLimitMiddleware {
  constructor(
    private redisClient: RedisRateLimitClient,
    private config: RateLimitConfig,
    private logger: ILogger
  ) {}

  globalLimiter(): RateLimitRequestHandler {
    return rateLimit({
      windowMs: this.config.global.windowMs,
      max: this.config.global.max,
      
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible with redis v4
        sendCommand: (...args: string[]) => this.redisClient.getClient().sendCommand(args),
        prefix: 'rl:global:',
      }),
      
      keyGenerator: (req: Request) => {
        return req.ip || 'unknown';
      },
      
      handler: (req: Request, res: Response) => {
        this.logger.warn('Global rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: Math.ceil(this.config.global.windowMs / 1000)
        });
      },
      
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  perUserLimiter(): RateLimitRequestHandler {
    return rateLimit({
      windowMs: this.config.perUser.windowMs,
      max: this.config.perUser.max,
      
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible with redis v4
        sendCommand: (...args: string[]) => this.redisClient.getClient().sendCommand(args),
        prefix: 'rl:user:',
      }),
      
      keyGenerator: (req: Request) => {
        // @ts-expect-error - user is attached by auth middleware
        const userId = req.user?.userId;
        return userId || req.ip || 'unknown';
      },
      
      handler: (req: Request, res: Response) => {
        // @ts-expect-error - user is attached by auth middleware
        const userId = req.user?.userId;
        
        this.logger.warn('Per-user rate limit exceeded', {
          userId,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: 'Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.',
          retryAfter: Math.ceil(this.config.perUser.windowMs / 1000)
        });
      },
      
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  perEndpointLimiter(endpoint: string): RateLimitRequestHandler {
    const endpointConfig = this.config.perEndpoint[endpoint];
    
    if (!endpointConfig) {
      return this.globalLimiter();
    }

    return rateLimit({
      windowMs: endpointConfig.windowMs,
      max: endpointConfig.max,
      
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible with redis v4
        sendCommand: (...args: string[]) => this.redisClient.getClient().sendCommand(args),
        prefix: `rl:endpoint:${endpoint}:`,
      }),
      
      keyGenerator: (req: Request) => {
        // @ts-expect-error - user is attached by auth middleware
        const userId = req.user?.userId;
        return userId || req.ip || 'unknown';
      },
      
      handler: (req: Request, res: Response) => {
        this.logger.warn('Per-endpoint rate limit exceeded', {
          endpoint,
          // @ts-expect-error - user is attached by auth middleware
          userId: req.user?.userId,
          ip: req.ip
        });

        res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: `Quá nhiều yêu cầu đến ${endpoint}. Vui lòng thử lại sau.`,
          retryAfter: Math.ceil(endpointConfig.windowMs / 1000)
        });
      },
      
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  strictLimiter(): RateLimitRequestHandler {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible with redis v4
        sendCommand: (...args: string[]) => this.redisClient.getClient().sendCommand(args),
        prefix: 'rl:strict:',
      }),
      
      keyGenerator: (req: Request) => {
        return req.ip || 'unknown';
      },
      
      handler: (req: Request, res: Response) => {
        this.logger.warn('Strict rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: 'Quá nhiều yêu cầu đến endpoint nhạy cảm. Vui lòng thử lại sau 15 phút.',
          retryAfter: 900
        });
      },
      
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  createCustomLimiter(config: {
    windowMs: number;
    max: number;
    prefix: string;
    message?: string;
  }): RateLimitRequestHandler {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are not fully compatible with redis v4
        sendCommand: (...args: string[]) => this.redisClient.getClient().sendCommand(args),
        prefix: config.prefix,
      }),
      
      keyGenerator: (req: Request) => {
        // @ts-expect-error - user is attached by auth middleware
        const userId = req.user?.userId;
        return userId || req.ip || 'unknown';
      },
      
      handler: (req: Request, res: Response) => {
        this.logger.warn('Custom rate limit exceeded', {
          prefix: config.prefix,
          // @ts-expect-error - user is attached by auth middleware
          userId: req.user?.userId,
          ip: req.ip,
          path: req.path
        });

        res.status(429).json({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: config.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      },
      
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

