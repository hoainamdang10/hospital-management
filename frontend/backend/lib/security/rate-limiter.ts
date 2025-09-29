/**
 * Rate Limiter for API endpoints
 * Prevents abuse and brute force attacks
 */

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number
}

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 reset attempts per hour
  },
  invitation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 invitations per hour
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 API calls per 15 minutes
  },
}

class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetTime: Date }> = new Map()

  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // DISABLED for development - always allow
    if (process.env.NODE_ENV === 'development') {
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + config.windowMs)
      }
    }
    const now = new Date()
    const key = identifier
    const windowStart = new Date(now.getTime() - config.windowMs)
    
    // Clean up expired entries
    this.cleanup(windowStart)
    
    const record = this.store.get(key)
    const resetTime = new Date(now.getTime() + config.windowMs)
    
    if (!record || record.resetTime < now) {
      // First request or window expired
      this.store.set(key, { count: 1, resetTime })
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
      }
    }
    
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime.getTime() - now.getTime()) / 1000),
      }
    }
    
    // Increment counter
    record.count++
    this.store.set(key, record)
    
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    }
  }
  
  private cleanup(before: Date) {
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < before) {
        this.store.delete(key)
      }
    }
  }
  
  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier)
  }
  
  async getStats(): Promise<{ totalKeys: number; activeKeys: number }> {
    const now = new Date()
    let activeKeys = 0
    
    for (const record of this.store.values()) {
      if (record.resetTime > now) {
        activeKeys++
      }
    }
    
    return {
      totalKeys: this.store.size,
      activeKeys,
    }
  }
}

// Singleton instance
export const rateLimiter = new InMemoryRateLimiter()

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0]?.trim() || 
            realIp || 
            cfConnectingIp || 
            'unknown'
  
  return `ip:${ip}`
}

// Helper function to get user-specific identifier
export function getUserIdentifier(userId: string, action: string): string {
  return `user:${userId}:${action}`
}

// Helper function to get email-specific identifier
export function getEmailIdentifier(email: string, action: string): string {
  return `email:${email}:${action}`
}

export default rateLimiter
