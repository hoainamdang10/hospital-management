'use client'

/**
 * CAPTCHA Widget Component
 * Supports multiple providers with fallback to mock for development
 */

import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Shield, AlertCircle } from 'lucide-react'

interface CaptchaWidgetProps {
  onVerify: (token: string) => void
  onError: (error?: string) => void
  onExpire: () => void
  theme?: 'light' | 'dark'
  size?: 'normal' | 'compact'
  className?: string
}

declare global {
  interface Window {
    hcaptcha?: any
    turnstile?: any
    onCaptchaSuccess?: (token: string) => void
    onCaptchaError?: (error?: string) => void
    onCaptchaExpired?: () => void
    onCaptchaTimeout?: () => void
  }
}

export function CaptchaWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = '',
}: CaptchaWidgetProps) {
  const [provider, setProvider] = useState<'MOCK' | 'HCAPTCHA' | 'TURNSTILE'>('MOCK')
  const [siteKey, setSiteKey] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [widgetId, setWidgetId] = useState<string | null>(null)
  const [mockToken, setMockToken] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get CAPTCHA configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/auth/captcha/verify')
        const data = await response.json()
        
        if (data.success && data.config) {
          setProvider(data.config.provider)
          setSiteKey(data.config.siteKey)
        }
      } catch (error) {
        console.error('Failed to fetch CAPTCHA config:', error)
        setError('Không thể tải cấu hình CAPTCHA')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [])

  useEffect(() => {
    if (isLoading || !siteKey) return

    // Set up global callbacks
    window.onCaptchaSuccess = (token: string) => {
      onVerify(token)
      setError('')
    }

    window.onCaptchaError = (error?: string) => {
      onError(error)
      setError(error || 'CAPTCHA verification failed')
    }

    window.onCaptchaExpired = () => {
      onExpire()
      setError('CAPTCHA đã hết hạn. Vui lòng thử lại.')
    }

    window.onCaptchaTimeout = () => {
      onError('CAPTCHA timeout')
      setError('CAPTCHA đã hết thời gian. Vui lòng thử lại.')
    }

    if (provider === 'MOCK') {
      // Mock CAPTCHA for development
      return
    }

    // Load and render CAPTCHA widget
    loadCaptchaScript()

    return () => {
      // Cleanup
      if (widgetId && provider === 'HCAPTCHA' && window.hcaptcha) {
        window.hcaptcha.remove(widgetId)
      }
      if (widgetId && provider === 'TURNSTILE' && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [provider, siteKey, isLoading])

  const loadCaptchaScript = () => {
    if (provider === 'HCAPTCHA') {
      loadHCaptcha()
    } else if (provider === 'TURNSTILE') {
      loadTurnstile()
    }
  }

  const loadHCaptcha = () => {
    if (window.hcaptcha) {
      renderHCaptcha()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=onHCaptchaLoad&render=explicit'
    script.async = true
    script.defer = true

    window.onHCaptchaLoad = () => {
      renderHCaptcha()
    }

    document.head.appendChild(script)
  }

  const renderHCaptcha = () => {
    if (!containerRef.current || !window.hcaptcha) return

    try {
      const id = window.hcaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: 'onCaptchaSuccess',
        'error-callback': 'onCaptchaError',
        'expired-callback': 'onCaptchaExpired',
      })
      setWidgetId(id)
    } catch (error) {
      console.error('hCaptcha render error:', error)
      setError('Không thể tải hCaptcha')
    }
  }

  const loadTurnstile = () => {
    if (window.turnstile) {
      renderTurnstile()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'
    script.async = true
    script.defer = true

    window.onTurnstileLoad = () => {
      renderTurnstile()
    }

    document.head.appendChild(script)
  }

  const renderTurnstile = () => {
    if (!containerRef.current || !window.turnstile) return

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: 'onCaptchaSuccess',
        'error-callback': 'onCaptchaError',
        'expired-callback': 'onCaptchaExpired',
        'timeout-callback': 'onCaptchaTimeout',
      })
      setWidgetId(id)
    } catch (error) {
      console.error('Turnstile render error:', error)
      setError('Không thể tải Turnstile')
    }
  }

  const handleMockVerify = () => {
    const token = 'test-token-valid'
    setMockToken(token)
    onVerify(token)
    setError('')
  }

  const handleMockReset = () => {
    setMockToken('')
    onExpire()
  }

  const handleRefresh = () => {
    setError('')
    if (provider === 'MOCK') {
      setMockToken('')
      return
    }

    if (widgetId) {
      if (provider === 'HCAPTCHA' && window.hcaptcha) {
        window.hcaptcha.reset(widgetId)
      } else if (provider === 'TURNSTILE' && window.turnstile) {
        window.turnstile.reset(widgetId)
      }
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 border border-gray-200 rounded-lg ${className}`}>
        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">Đang tải CAPTCHA...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (provider === 'MOCK') {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium">CAPTCHA (Development Mode)</span>
          </div>
          <div className="flex space-x-2">
            {!mockToken ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMockVerify}
              >
                Xác thực
              </Button>
            ) : (
              <>
                <span className="text-sm text-green-600 flex items-center">
                  ✓ Đã xác thực
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMockReset}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Chế độ phát triển - CAPTCHA sẽ được bỏ qua trong production
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div ref={containerRef} />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
