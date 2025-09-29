import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLContext } from '../context';
/**
 * Rate limiting middleware for GraphQL
 */
export declare const rateLimitMiddleware: ApolloServerPlugin<GraphQLContext>;
/**
 * Custom rate limit decorator for specific resolvers
 */
export declare function rateLimit(maxRequests: number, windowMs?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Get rate limit status for a key
 */
export declare function getRateLimitStatus(key: string): Promise<{
    count: number;
    limit: number;
    remaining: number;
    resetTime: Date;
} | null>;
/**
 * Reset rate limit for a key (admin function)
 */
export declare function resetRateLimit(key: string): Promise<boolean>;
export default rateLimitMiddleware;
//# sourceMappingURL=rateLimit.middleware.d.ts.map