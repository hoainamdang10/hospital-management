/**
 * Rate Limiter Implementation
 * In-memory rate limiting for Free Tier compatibility
 */

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked?: boolean
  blockUntil?: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime && (!record.blockUntil || now > record.blockUntil)) {
        this.store.delete(key)
      }
    }
  }

  private getKey(identifier: string, action: string): string {
    return `${action}:${identifier}`
  }

  check(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const key = this.getKey(identifier, action)
    const now = Date.now()
    const record = this.store.get(key)

    // Check if currently blocked
    if (record?.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.blockUntil - now) / 1000),
      }
    }

    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      }
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      // Apply blocking if configured
      if (config.blockDurationMs) {
        record.blocked = true
        record.blockUntil = now + config.blockDurationMs
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: config.blockDurationMs 
          ? Math.ceil(config.blockDurationMs / 1000)
          : Math.ceil((record.resetTime - now) / 1000),
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

  hit(identifier: string, action: string, success: boolean = true) {
    // This method can be used to record hits without checking limits
    // Useful for tracking after the fact
    const key = this.getKey(identifier, action)
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + 60000, // Default 1 minute window
      })
    } else {
      record.count++
      this.store.set(key, record)
    }
  }

  reset(identifier: string, action: string) {
    const key = this.getKey(identifier, action)
    this.store.delete(key)
  }

  getStats(): {
    totalKeys: number
    activeBlocks: number
    memoryUsage: number
  } {
    const now = Date.now()
    let activeBlocks = 0

    for (const record of this.store.values()) {
      if (record.blocked && record.blockUntil && now < record.blockUntil) {
        activeBlocks++
      }
    }

    return {
      totalKeys: this.store.size,
      activeBlocks,
      memoryUsage: JSON.stringify([...this.store.entries()]).length,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block after limit
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours block
  },
  forgotPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  resetPassword: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // CAPTCHA verification
  captcha: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Admin operations
  createInvitation: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  acceptInvitation: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  
  // File uploads
  fileUpload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // API calls
  apiGeneral: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  apiSensitive: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Profile updates
  profileUpdate: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
}

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // For authenticated requests, you might want to use user ID instead
  const userId = request.headers.get('x-user-id')
  
  return userId || ip
}

// Middleware helper for Next.js API routes
export function withRateLimit(
  action: keyof typeof rateLimitConfigs,
  customConfig?: Partial<RateLimitConfig>
) {
  return function rateLimitMiddleware(
    handler: (request: Request, ...args: any[]) => Promise<Response>
  ) {
    return async function (request: Request, ...args: any[]): Promise<Response> {
      const identifier = getClientIdentifier(request)
      const config = { ...rateLimitConfigs[action], ...customConfig }
      
      const result = rateLimiter.check(identifier, action, config)
      
      if (!result.allowed) {
        const response = new Response(
          JSON.stringify({
            success: false,
            error: 'Too many requests',
            retryAfter: result.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              ...(result.retryAfter && {
                'Retry-After': result.retryAfter.toString(),
              }),
            },
          }
        )
        return response
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request, ...args)
      
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
      
      return response
    }
  }
}

// React hook for client-side rate limit awareness
export function useRateLimit(action: string) {
  const checkRateLimit = async (): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> => {
    try {
      const response = await fetch(`/api/rate-limit/check?action=${action}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return {
        allowed: true,
        remaining: 100,
        resetTime: Date.now() + 60000,
      }
    }
  }

  return { checkRateLimit }
}

export default rateLimiter
