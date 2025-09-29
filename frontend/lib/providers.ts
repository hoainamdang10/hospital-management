/**
 * CAPTCHA Providers Integration
 * Supports multiple CAPTCHA providers with mock mode for development
 */

export type CaptchaProvider = 'MOCK' | 'HCAPTCHA' | 'TURNSTILE'

export interface CaptchaConfig {
  provider: CaptchaProvider
  siteKey?: string
  secretKey?: string
  theme?: 'light' | 'dark'
  size?: 'normal' | 'compact'
}

export interface CaptchaVerificationResult {
  success: boolean
  error?: string
  score?: number
  challengeTs?: string
  hostname?: string
}

/**
 * Get CAPTCHA configuration from environment
 */
export function getCaptchaConfig(): CaptchaConfig {
  const provider = (process.env.CAPTCHA_PROVIDER || 'MOCK') as CaptchaProvider
  
  return {
    provider,
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    secretKey: process.env.CAPTCHA_SECRET_KEY,
    theme: 'light',
    size: 'normal',
  }
}

/**
 * Mock CAPTCHA provider for development
 */
export class MockCaptchaProvider {
  static async verify(token: string): Promise<CaptchaVerificationResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Accept any non-empty token
    if (!token || token.length === 0) {
      return {
        success: false,
        error: 'Empty token provided',
      }
    }
    
    // Simulate occasional failures for testing
    if (token === 'fail') {
      return {
        success: false,
        error: 'Mock verification failed',
      }
    }
    
    return {
      success: true,
      challengeTs: new Date().toISOString(),
      hostname: 'localhost',
    }
  }
  
  static getClientScript(): string {
    return `
      window.mockCaptcha = {
        render: function(container, options) {
          const element = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
          
          if (!element) return;
          
          element.innerHTML = \`
            <div style="border: 2px dashed #ccc; padding: 20px; text-align: center; background: #f9f9f9;">
              <p style="margin: 0; color: #666;">Mock CAPTCHA (Development Mode)</p>
              <button type="button" onclick="this.parentElement.parentElement.querySelector('input').value='mock-token-' + Date.now(); if(window.mockCaptchaCallback) window.mockCaptchaCallback();" 
                      style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Verify
              </button>
              <input type="hidden" name="captcha-token" />
            </div>
          \`;
          
          if (options.callback) {
            window.mockCaptchaCallback = options.callback;
          }
        },
        
        getResponse: function() {
          const input = document.querySelector('input[name="captcha-token"]');
          return input ? input.value : '';
        },
        
        reset: function() {
          const input = document.querySelector('input[name="captcha-token"]');
          if (input) input.value = '';
        }
      };
    `
  }
}

/**
 * hCaptcha provider
 */
export class HCaptchaProvider {
  static async verify(token: string, secretKey: string): Promise<CaptchaVerificationResult> {
    try {
      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      })
      
      const data = await response.json()
      
      return {
        success: data.success === true,
        error: data['error-codes']?.join(', '),
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error during verification',
      }
    }
  }
  
  static getClientScript(siteKey: string): string {
    return `https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHCaptchaLoad`
  }
  
  static getClientConfig(siteKey: string) {
    return {
      sitekey: siteKey,
      theme: 'light',
      size: 'normal',
    }
  }
}

/**
 * Cloudflare Turnstile provider
 */
export class TurnstileProvider {
  static async verify(token: string, secretKey: string): Promise<CaptchaVerificationResult> {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      })
      
      const data = await response.json()
      
      return {
        success: data.success === true,
        error: data['error-codes']?.join(', '),
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error during verification',
      }
    }
  }
  
  static getClientScript(): string {
    return 'https://challenges.cloudflare.com/turnstile/v0/api.js'
  }
  
  static getClientConfig(siteKey: string) {
    return {
      sitekey: siteKey,
      theme: 'light',
      size: 'normal',
    }
  }
}

/**
 * Universal CAPTCHA verifier
 */
export async function verifyCaptcha(
  token: string,
  provider?: CaptchaProvider
): Promise<CaptchaVerificationResult> {
  const config = getCaptchaConfig()
  const captchaProvider = provider || config.provider
  
  switch (captchaProvider) {
    case 'MOCK':
      return MockCaptchaProvider.verify(token)
      
    case 'HCAPTCHA':
      if (!config.secretKey) {
        throw new Error('hCaptcha secret key not configured')
      }
      return HCaptchaProvider.verify(token, config.secretKey)
      
    case 'TURNSTILE':
      if (!config.secretKey) {
        throw new Error('Turnstile secret key not configured')
      }
      return TurnstileProvider.verify(token, config.secretKey)
      
    default:
      throw new Error(`Unsupported CAPTCHA provider: ${captchaProvider}`)
  }
}

/**
 * Get client-side CAPTCHA configuration
 */
export function getClientCaptchaConfig(): {
  provider: CaptchaProvider
  siteKey?: string
  scriptUrl?: string
  config?: any
} {
  const config = getCaptchaConfig()
  
  switch (config.provider) {
    case 'MOCK':
      return {
        provider: 'MOCK',
        scriptUrl: 'data:text/javascript;base64,' + btoa(MockCaptchaProvider.getClientScript()),
      }
      
    case 'HCAPTCHA':
      return {
        provider: 'HCAPTCHA',
        siteKey: config.siteKey,
        scriptUrl: HCaptchaProvider.getClientScript(config.siteKey!),
        config: HCaptchaProvider.getClientConfig(config.siteKey!),
      }
      
    case 'TURNSTILE':
      return {
        provider: 'TURNSTILE',
        siteKey: config.siteKey,
        scriptUrl: TurnstileProvider.getClientScript(),
        config: TurnstileProvider.getClientConfig(config.siteKey!),
      }
      
    default:
      return {
        provider: 'MOCK',
        scriptUrl: 'data:text/javascript;base64,' + btoa(MockCaptchaProvider.getClientScript()),
      }
  }
}

/**
 * React hook for CAPTCHA integration
 */
export function useCaptcha() {
  const config = getClientCaptchaConfig()
  
  const loadCaptcha = async (): Promise<void> => {
    if (config.provider === 'MOCK') {
      // Load mock CAPTCHA script
      const script = document.createElement('script')
      script.text = MockCaptchaProvider.getClientScript()
      document.head.appendChild(script)
      return
    }
    
    if (config.scriptUrl && !document.querySelector(`script[src="${config.scriptUrl}"]`)) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = config.scriptUrl!
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load CAPTCHA script'))
        document.head.appendChild(script)
      })
    }
  }
  
  const renderCaptcha = (container: string | HTMLElement, callback?: (token: string) => void) => {
    switch (config.provider) {
      case 'MOCK':
        if (window.mockCaptcha) {
          window.mockCaptcha.render(container, { callback })
        }
        break
        
      case 'HCAPTCHA':
        if (window.hcaptcha) {
          return window.hcaptcha.render(container, {
            ...config.config,
            callback,
          })
        }
        break
        
      case 'TURNSTILE':
        if (window.turnstile) {
          return window.turnstile.render(container, {
            ...config.config,
            callback,
          })
        }
        break
    }
  }
  
  const resetCaptcha = (widgetId?: string) => {
    switch (config.provider) {
      case 'MOCK':
        if (window.mockCaptcha) {
          window.mockCaptcha.reset()
        }
        break
        
      case 'HCAPTCHA':
        if (window.hcaptcha && widgetId) {
          window.hcaptcha.reset(widgetId)
        }
        break
        
      case 'TURNSTILE':
        if (window.turnstile && widgetId) {
          window.turnstile.reset(widgetId)
        }
        break
    }
  }
  
  const getCaptchaResponse = (widgetId?: string): string => {
    switch (config.provider) {
      case 'MOCK':
        return window.mockCaptcha?.getResponse() || ''
        
      case 'HCAPTCHA':
        return window.hcaptcha?.getResponse(widgetId) || ''
        
      case 'TURNSTILE':
        return window.turnstile?.getResponse(widgetId) || ''
        
      default:
        return ''
    }
  }
  
  return {
    config,
    loadCaptcha,
    renderCaptcha,
    resetCaptcha,
    getCaptchaResponse,
  }
}

// Global type declarations for CAPTCHA libraries
declare global {
  interface Window {
    mockCaptcha?: {
      render: (container: string | HTMLElement, options: any) => void
      getResponse: () => string
      reset: () => void
    }
    hcaptcha?: {
      render: (container: string | HTMLElement, options: any) => string
      getResponse: (widgetId?: string) => string
      reset: (widgetId: string) => void
    }
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string
      getResponse: (widgetId?: string) => string
      reset: (widgetId: string) => void
    }
    mockCaptchaCallback?: () => void
  }
}
