/**
 * CAPTCHA Verification System
 * Supports hCaptcha, Cloudflare Turnstile, and Mock for development
 */

export type CaptchaProvider = 'MOCK' | 'HCAPTCHA' | 'TURNSTILE'

interface CaptchaVerificationResult {
  success: boolean
  error?: string
  score?: number // For Turnstile
  challengeTs?: string
  hostname?: string
}

interface CaptchaConfig {
  provider: CaptchaProvider
  secretKey: string
  siteKey: string
  threshold?: number // For Turnstile score-based verification
}

/**
 * Get CAPTCHA configuration from environment
 */
export function getCaptchaConfig(): CaptchaConfig {
  const provider = (process.env.CAPTCHA_PROVIDER || 'MOCK') as CaptchaProvider
  
  return {
    provider,
    secretKey: process.env.CAPTCHA_SECRET_KEY || '',
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || '',
    threshold: parseFloat(process.env.CAPTCHA_THRESHOLD || '0.5')
  }
}

/**
 * Mock CAPTCHA verification for development
 */
async function verifyMockCaptcha(token: string): Promise<CaptchaVerificationResult> {
  // Allow specific test tokens
  const validTestTokens = [
    'test-token-valid',
    'test-token-success',
    'development-bypass'
  ]
  
  if (validTestTokens.includes(token)) {
    return {
      success: true,
      challengeTs: new Date().toISOString(),
      hostname: 'localhost'
    }
  }
  
  // Simulate random success/failure for testing
  const isValid = Math.random() > 0.2 // 80% success rate
  
  return {
    success: isValid,
    error: isValid ? undefined : 'Mock CAPTCHA verification failed',
    challengeTs: new Date().toISOString(),
    hostname: 'localhost'
  }
}

/**
 * Verify hCaptcha token
 */
async function verifyHCaptcha(token: string, secretKey: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: data.success,
      error: data['error-codes']?.join(', '),
      challengeTs: data.challenge_ts,
      hostname: data.hostname
    }
  } catch (error) {
    console.error('hCaptcha verification error:', error)
    return {
      success: false,
      error: 'CAPTCHA verification service unavailable'
    }
  }
}

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstile(token: string, secretKey: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: data.success,
      error: data['error-codes']?.join(', '),
      score: data.score,
      challengeTs: data.challenge_ts,
      hostname: data.hostname
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return {
      success: false,
      error: 'CAPTCHA verification service unavailable'
    }
  }
}

/**
 * Main CAPTCHA verification function
 */
export async function verifyCaptcha(
  token: string, 
  remoteIp?: string,
  config?: Partial<CaptchaConfig>
): Promise<CaptchaVerificationResult> {
  const captchaConfig = { ...getCaptchaConfig(), ...config }
  
  if (!token || token.trim() === '') {
    return {
      success: false,
      error: 'CAPTCHA token is required'
    }
  }

  switch (captchaConfig.provider) {
    case 'MOCK':
      return verifyMockCaptcha(token)
      
    case 'HCAPTCHA':
      if (!captchaConfig.secretKey) {
        console.error('hCaptcha secret key not configured')
        return {
          success: false,
          error: 'CAPTCHA service not properly configured'
        }
      }
      return verifyHCaptcha(token, captchaConfig.secretKey, remoteIp)
      
    case 'TURNSTILE':
      if (!captchaConfig.secretKey) {
        console.error('Turnstile secret key not configured')
        return {
          success: false,
          error: 'CAPTCHA service not properly configured'
        }
      }
      const result = await verifyTurnstile(token, captchaConfig.secretKey, remoteIp)
      
      // Check score threshold for Turnstile
      if (result.success && result.score !== undefined && captchaConfig.threshold) {
        if (result.score < captchaConfig.threshold) {
          return {
            success: false,
            error: `CAPTCHA score ${result.score} below threshold ${captchaConfig.threshold}`,
            score: result.score
          }
        }
      }
      
      return result
      
    default:
      return {
        success: false,
        error: 'Unknown CAPTCHA provider'
      }
  }
}

/**
 * Middleware for CAPTCHA verification in API routes
 */
export function withCaptchaVerification(
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async function (request: Request, ...args: any[]): Promise<Response> {
    try {
      const body = await request.json()
      const captchaToken = body.captcha_token || body.captchaToken
      
      if (!captchaToken) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'CAPTCHA token is required'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Get client IP
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const cfConnectingIp = request.headers.get('cf-connecting-ip')
      const remoteIp = forwarded?.split(',')[0] || realIp || cfConnectingIp

      const verification = await verifyCaptcha(captchaToken, remoteIp)
      
      if (!verification.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'CAPTCHA verification failed',
            details: verification.error
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Add verification result to request context
      const modifiedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify({
          ...body,
          captcha_verified: true,
          captcha_score: verification.score
        })
      })

      return handler(modifiedRequest, ...args)
    } catch (error) {
      console.error('CAPTCHA middleware error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CAPTCHA verification service error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Client-side CAPTCHA configuration
 */
export function getCaptchaClientConfig() {
  const config = getCaptchaConfig()
  
  return {
    provider: config.provider,
    siteKey: config.siteKey,
    theme: process.env.NEXT_PUBLIC_CAPTCHA_THEME || 'light',
    size: process.env.NEXT_PUBLIC_CAPTCHA_SIZE || 'normal'
  }
}

/**
 * Generate CAPTCHA widget props for React components
 */
export function getCaptchaWidgetProps() {
  const config = getCaptchaClientConfig()
  
  const baseProps = {
    sitekey: config.siteKey,
    theme: config.theme,
    size: config.size
  }

  switch (config.provider) {
    case 'HCAPTCHA':
      return {
        ...baseProps,
        'data-callback': 'onCaptchaSuccess',
        'data-error-callback': 'onCaptchaError',
        'data-expired-callback': 'onCaptchaExpired'
      }
      
    case 'TURNSTILE':
      return {
        ...baseProps,
        'data-callback': 'onCaptchaSuccess',
        'data-error-callback': 'onCaptchaError',
        'data-expired-callback': 'onCaptchaExpired',
        'data-timeout-callback': 'onCaptchaTimeout'
      }
      
    case 'MOCK':
      return {
        ...baseProps,
        'data-testid': 'mock-captcha'
      }
      
    default:
      return baseProps
  }
}

/**
 * CAPTCHA error messages
 */
export const CaptchaErrors = {
  'missing-input-secret': 'CAPTCHA secret key is missing',
  'invalid-input-secret': 'CAPTCHA secret key is invalid',
  'missing-input-response': 'CAPTCHA response is missing',
  'invalid-input-response': 'CAPTCHA response is invalid or expired',
  'bad-request': 'CAPTCHA request is malformed',
  'timeout-or-duplicate': 'CAPTCHA response has timed out or been used',
  'internal-error': 'CAPTCHA service internal error'
} as const

export type CaptchaErrorCode = keyof typeof CaptchaErrors
