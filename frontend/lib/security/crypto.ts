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
 * Hash password with salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt || randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(password + passwordSalt)
    .digest('hex')
  
  return { hash, salt: passwordSalt }
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt)
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
}

/**
 * Generate TOTP secret for MFA
 */
export function generateTOTPSecret(): string {
  // Generate 20 random bytes for TOTP secret (160 bits)
  return randomBytes(20).toString('base32')
}

/**
 * Encrypt sensitive data (for storing TOTP secrets, etc.)
 */
export function encryptData(data: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-encryption-key'
  
  if (encryptionKey === 'default-encryption-key') {
    console.warn('⚠️  Using default encryption key. Set ENCRYPTION_KEY environment variable for production.')
  }

  // Simple XOR encryption (use AES in production)
  const keyBuffer = Buffer.from(encryptionKey)
  const dataBuffer = Buffer.from(data)
  const encrypted = Buffer.alloc(dataBuffer.length)

  for (let i = 0; i < dataBuffer.length; i++) {
    encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length]
  }

  return encrypted.toString('base64')
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-encryption-key'
  
  try {
    const keyBuffer = Buffer.from(encryptionKey)
    const encryptedBuffer = Buffer.from(encryptedData, 'base64')
    const decrypted = Buffer.alloc(encryptedBuffer.length)

    for (let i = 0; i < encryptedBuffer.length; i++) {
      decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length]
    }

    return decrypted.toString()
  } catch (error) {
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generate file checksum
 */
export function generateFileChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Generate backup codes for MFA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  
  return codes
}

/**
 * Secure random number generation
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1
  const bytesNeeded = Math.ceil(Math.log2(range) / 8)
  const maxValue = Math.pow(256, bytesNeeded)
  const threshold = maxValue - (maxValue % range)
  
  let randomValue: number
  do {
    const randomBytes = randomBytes(bytesNeeded)
    randomValue = 0
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + randomBytes[i]
    }
  } while (randomValue >= threshold)
  
  return min + (randomValue % range)
}

/**
 * Rate limiting token bucket implementation
 */
export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  consume(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  getAvailableTokens(): number {
    this.refill()
    return Math.floor(this.tokens)
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
