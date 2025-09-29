import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestContext } from '@apollo/server';
import { GraphQLContext, UserRole } from '../context';
import logger from '@hospital/shared/dist/utils/logger';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (context: GraphQLContext) => string;
}

/**
 * Rate limit store interface
 */
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, value: { count: number; resetTime: number }): Promise<void>;
  increment(key: string): Promise<{ count: number; resetTime: number }>;
}

/**
 * In-memory rate limit store
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key);
    
    if (existing) {
      existing.count++;
      await this.set(key, existing);
      return existing;
    } else {
      const newEntry = {
        count: 1,
        resetTime: Date.now() + (15 * 60 * 1000) // 15 minutes default
      };
      await this.set(key, newEntry);
      return newEntry;
    }
  }
}

/**
 * Rate limiting configurations for different user types
 */
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Anonymous users (no authentication)
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    keyGenerator: (context) => `anon:${context.ipAddress}`
  },

  // Authenticated patients
  patient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500, // 500 requests per 15 minutes
    keyGenerator: (context) => `patient:${context.user?.id}`
  },

  // Authenticated doctors
  doctor: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    keyGenerator: (context) => `doctor:${context.user?.id}`
  },

  // Admin users
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000, // 2000 requests per 15 minutes
    keyGenerator: (context) => `admin:${context.user?.id}`
  },

  // Subscription rate limits (per connection)
  subscription: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 subscriptions per minute
    keyGenerator: (context) => `sub:${context.user?.id || context.ipAddress}`
  }
};

/**
 * Rate limiting store instance
 */
const rateLimitStore = new MemoryRateLimitStore();

/**
 * Rate limiting middleware for GraphQL
 */
export const rateLimitMiddleware: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        const context = requestContext.contextValue;
        const { request } = requestContext;

        // Skip rate limiting for introspection queries
        if (request.operationName === 'IntrospectionQuery') {
          return;
        }

        // Get operation info
        const operation = requestContext.document?.definitions[0];
        if (!operation || operation.kind !== 'OperationDefinition') {
          return;
        }

        const operationType = operation.operation;
        const operationName = operation.name?.value || 'Anonymous';

        // Determine rate limit config based on user role and operation type
        let config: RateLimitConfig;
        
        if (operationType === 'subscription') {
          config = rateLimitConfigs.subscription;
        } else if (!context.user) {
          config = rateLimitConfigs.anonymous;
        } else {
          switch (context.user.role) {
            case UserRole.ADMIN:
              config = rateLimitConfigs.admin;
              break;
            case UserRole.DOCTOR:
              config = rateLimitConfigs.doctor;
              break;
            case UserRole.PATIENT:
              config = rateLimitConfigs.patient;
              break;
            default:
              config = rateLimitConfigs.patient;
          }
        }

        // Generate rate limit key
        const key = config.keyGenerator!(context);

        try {
          // Check and increment rate limit
          const result = await rateLimitStore.increment(key);

          // Check if rate limit exceeded
          if (result.count > config.maxRequests) {
            const resetTime = new Date(result.resetTime);
            const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

            logger.warn('Rate limit exceeded:', {
              key,
              count: result.count,
              limit: config.maxRequests,
              resetTime: resetTime.toISOString(),
              operationType,
              operationName,
              userId: context.user?.id,
              ipAddress: context.ipAddress
            });

            // Add rate limit info to context for response headers
            context.rateLimitInfo = {
              limit: config.maxRequests,
              remaining: 0,
              resetTime
            };

            throw new Error(
              `Vượt quá giới hạn yêu cầu. Thử lại sau ${retryAfter} giây. ` +
              `Giới hạn: ${config.maxRequests} yêu cầu/${Math.floor(config.windowMs / 60000)} phút.`
            );
          }

          // Add rate limit info to context
          context.rateLimitInfo = {
            limit: config.maxRequests,
            remaining: config.maxRequests - result.count,
            resetTime: new Date(result.resetTime)
          };

          logger.debug('Rate limit check passed:', {
            key,
            count: result.count,
            limit: config.maxRequests,
            remaining: config.maxRequests - result.count,
            operationType,
            operationName
          });

        } catch (error) {
          if (error instanceof Error && error.message.includes('Vượt quá giới hạn')) {
            throw error;
          }
          
          logger.error('Rate limit check error:', error);
          // Don't block request on rate limit store errors
        }
      },

      async willSendResponse(requestContext) {
        const context = requestContext.contextValue;
        const { response } = requestContext;

        // Add rate limit headers to response
        if (context.rateLimitInfo && response?.http) {
          response.http.headers.set('X-RateLimit-Limit', context.rateLimitInfo.limit.toString());
          response.http.headers.set('X-RateLimit-Remaining', context.rateLimitInfo.remaining.toString());
          response.http.headers.set('X-RateLimit-Reset', context.rateLimitInfo.resetTime.toISOString());
          
          if (context.rateLimitInfo.remaining === 0) {
            const retryAfter = Math.ceil((context.rateLimitInfo.resetTime.getTime() - Date.now()) / 1000);
            response.http.headers.set('Retry-After', retryAfter.toString());
          }
        }
      }
    };
  }
};

/**
 * Custom rate limit decorator for specific resolvers
 */
export function rateLimit(maxRequests: number, windowMs: number = 15 * 60 * 1000) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(parent: any, args: any, context: GraphQLContext, info: any) {
      const key = `custom:${info.fieldName}:${context.user?.id || context.ipAddress}`;
      
      try {
        const result = await rateLimitStore.increment(key);
        
        if (result.count > maxRequests) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
          throw new Error(
            `Vượt quá giới hạn cho ${info.fieldName}. Thử lại sau ${retryAfter} giây. ` +
            `Giới hạn: ${maxRequests} yêu cầu/${Math.floor(windowMs / 60000)} phút.`
          );
        }

        return originalMethod.call(this, parent, args, context, info);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Vượt quá giới hạn')) {
          throw error;
        }
        
        logger.error(`Rate limit error for ${info.fieldName}:`, error);
        return originalMethod.call(this, parent, args, context, info);
      }
    };

    return descriptor;
  };
}

/**
 * Get rate limit status for a key
 */
export async function getRateLimitStatus(key: string): Promise<{
  count: number;
  limit: number;
  remaining: number;
  resetTime: Date;
} | null> {
  try {
    const result = await rateLimitStore.get(key);
    if (!result) return null;

    // Determine limit based on key prefix
    let limit = 100; // default
    if (key.startsWith('admin:')) limit = 2000;
    else if (key.startsWith('doctor:')) limit = 1000;
    else if (key.startsWith('patient:')) limit = 500;

    return {
      count: result.count,
      limit,
      remaining: Math.max(0, limit - result.count),
      resetTime: new Date(result.resetTime)
    };
  } catch (error) {
    logger.error('Get rate limit status error:', error);
    return null;
  }
}

/**
 * Reset rate limit for a key (admin function)
 */
export async function resetRateLimit(key: string): Promise<boolean> {
  try {
    await rateLimitStore.set(key, { count: 0, resetTime: Date.now() + (15 * 60 * 1000) });
    return true;
  } catch (error) {
    logger.error('Reset rate limit error:', error);
    return false;
  }
}

export default rateLimitMiddleware;
