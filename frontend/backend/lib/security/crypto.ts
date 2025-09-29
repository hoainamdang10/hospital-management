/**
 * Security and Cryptography Utilities
 * Handles encryption, hashing, and security headers
 */

import { NextResponse } from 'next/server'

// Security headers for all responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
}

// Add security headers to response
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // Use crypto.getRandomValues if available (browser/Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return result
}

// Generate HMAC signature
export async function generateHMAC(data: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  // Fallback for environments without crypto.subtle
  return simpleHash(data + secret)
}

// Verify HMAC signature
export async function verifyHMAC(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expectedSignature = await generateHMAC(data, secret)
    return constantTimeCompare(signature, expectedSignature)
  } catch (error) {
    console.error('HMAC verification error:', error)
    return false
  }
}

// Constant time string comparison to prevent timing attacks
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

// Simple hash function (fallback)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) score++
  else feedback.push('Mật khẩu phải có ít nhất 8 ký tự')
  
  if (/[a-z]/.test(password)) score++
  else feedback.push('Mật khẩu phải có ít nhất 1 chữ thường')
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Mật khẩu phải có ít nhất 1 chữ hoa')
  
  if (/\d/.test(password)) score++
  else feedback.push('Mật khẩu phải có ít nhất 1 số')
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else feedback.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
  
  return {
    isValid: score >= 5,
    score,
    feedback,
  }
}

// Generate invitation token
export function generateInvitationToken(): string {
  return generateSecureToken(64)
}

// Hash password (for client-side hashing before sending)
export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback
  return simpleHash(password)
}

// Rate limiting key generation
export function generateRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`
}

// Session token generation
export function generateSessionToken(): string {
  return generateSecureToken(128)
}

// CSRF token generation
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

export default {
  addSecurityHeaders,
  generateSecureToken,
  generateHMAC,
  verifyHMAC,
  constantTimeCompare,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateInvitationToken,
  hashPassword,
  generateRateLimitKey,
  generateSessionToken,
  generateCSRFToken,
}
