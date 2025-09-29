/**
 * Cryptographic utilities for secure token generation and verification
 * Production-ready implementation with proper security practices
 */

import { createHmac, randomBytes, createHash, timingSafeEqual } from 'crypto'

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * HMAC-based token generation and verification
 */
export class TokenManager {
  private secretKey: string

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.TOKEN_SECRET_KEY || 'default-secret-key'
    
    if (this.secretKey === 'default-secret-key') {
      console.warn('⚠️  Using default secret key. Set TOKEN_SECRET_KEY environment variable for production.')
    }
  }

  /**
   * Generate HMAC token with payload
   */
  generateToken(payload: Record<string, any>, expiresInMs?: number): string {
    const tokenData = {
      ...payload,
      iat: Date.now(),
      ...(expiresInMs && { exp: Date.now() + expiresInMs })
    }

    const tokenString = JSON.stringify(tokenData)
    const token = Buffer.from(tokenString).toString('base64url')
    const signature = this.generateSignature(token)

    return `${token}.${signature}`
  }

  /**
   * Verify and decode HMAC token
   */
  verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const [tokenPart, signature] = token.split('.')
      
      if (!tokenPart || !signature) {
        return { valid: false, error: 'Invalid token format' }
      }

      // Verify signature
      const expectedSignature = this.generateSignature(tokenPart)
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return { valid: false, error: 'Invalid token signature' }
      }

      // Decode payload
      const tokenString = Buffer.from(tokenPart, 'base64url').toString()
      const payload = JSON.parse(tokenString)

      // Check expiration
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, error: 'Token expired' }
      }

      return { valid: true, payload }
    } catch (error) {
      return { valid: false, error: 'Token parsing error' }
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(data: string): string {
    return createHmac('sha256', this.secretKey)
      .update(data)
      .digest('base64url')
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    
    return timingSafeEqual(bufferA, bufferB)
  }
}

/**
 * Global token manager instance
 */
export const tokenManager = new TokenManager()

/**
 * Generate invitation token with HMAC security
 */
export function generateInvitationToken(email: string, role: string, expiresInDays: number = 7): {
  token: string
  tokenHash: string
  expiresAt: Date
} {
  const rawToken = generateSecureToken(32)
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  
  const payload = {
    email,
    role,
    token: rawToken,
    type: 'invitation'
  }

  const token = tokenManager.generateToken(payload, expiresInDays * 24 * 60 * 60 * 1000)
  const tokenHash = createHash('sha256').update(token).digest('hex')

  return {
    token,
    tokenHash,
    expiresAt
  }
}

/**
 * Verify invitation token
 */
export function verifyInvitationToken(token: string): {
  valid: boolean
  email?: string
  role?: string
  error?: string
} {
  const result = tokenManager.verifyToken(token)
  
  if (!result.valid) {
    return { valid: false, error: result.error }
  }

  const { payload } = result
  
  if (payload.type !== 'invitation') {
    return { valid: false, error: 'Invalid token type' }
  }

  return {
    valid: true,
    email: payload.email,
    role: payload.role
  }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string, email: string): {
  token: string
  tokenHash: string
  expiresAt: Date
} {
  const expiresInMs = 60 * 60 * 1000 // 1 hour
  const expiresAt = new Date(Date.now() + expiresInMs)
  
  const payload = {
    userId,
    email,
    type: 'password_reset'
  }

  const token = tokenManager.generateToken(payload, expiresInMs)
  const tokenHash = createHash('sha256').update(token).digest('hex')

  return {
    token,
    tokenHash,
    expiresAt
  }
}

/**
 * Security headers for API responses
 */
export const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
} as const

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
  Object.entries(SecurityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}
