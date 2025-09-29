'use client'

import { useState, useEffect, useCallback } from 'react'

interface EmailValidationState {
  isChecking: boolean
  isAvailable: boolean | null
  error: string | null
  message: string | null
}

interface UseEmailValidationReturn extends EmailValidationState {
  checkEmail: (email: string) => void
  clearValidation: () => void
}

/**
 * Custom hook for email availability validation with debouncing
 */
export function useEmailValidation(debounceMs: number = 500): UseEmailValidationReturn {
  const [state, setState] = useState<EmailValidationState>({
    isChecking: false,
    isAvailable: null,
    error: null,
    message: null,
  })

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const clearValidation = useCallback(() => {
    setState({
      isChecking: false,
      isAvailable: null,
      error: null,
      message: null,
    })
    // Clear timer using ref to avoid dependency issues
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer)
      }
      return null
    })
  }, []) // Remove debounceTimer from dependencies to prevent infinite loop

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !isValidEmail(email)) {
      setState({
        isChecking: false,
        isAvailable: null,
        error: null,
        message: null,
      })
      return
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      console.log('🔍 [useEmailValidation] Checking email:', email)
      // Use Auth Service microservice instead of frontend API route
      const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'
      const response = await fetch(`${API_GATEWAY_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      console.log('🔍 [useEmailValidation] Response status:', response.status)
      const result = await response.json()
      console.log('🔍 [useEmailValidation] Response data:', result)

      if (response.ok && result.success) {
        // Auth Service uses 'available' instead of 'isAvailable'
        const isAvailable = result.available
        setState({
          isChecking: false,
          isAvailable,
          error: null,
          message: result.message || (isAvailable
            ? 'Email có thể sử dụng'
            : 'Email đã được sử dụng'),
        })
      } else {
        setState({
          isChecking: false,
          isAvailable: null,
          error: result.message || 'Không thể kiểm tra email',
          message: null,
        })
      }
    } catch (error) {
      console.error('❌ [useEmailValidation] Error:', error)
      setState({
        isChecking: false,
        isAvailable: null,
        error: 'Lỗi kết nối khi kiểm tra email',
        message: null,
      })
    }
  }, [])

  const checkEmail = useCallback((email: string) => {
    // Clear previous timer using state setter function
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer)
      }
      return null
    })

    // Clear validation if email is empty or invalid
    if (!email || !isValidEmail(email)) {
      clearValidation()
      return
    }

    // Set new timer
    const timer = setTimeout(() => {
      checkEmailAvailability(email)
    }, debounceMs)

    setDebounceTimer(timer)
  }, [debounceMs, checkEmailAvailability, clearValidation]) // Removed debounceTimer from deps to prevent loop

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      setDebounceTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer)
        }
        return null
      })
    }
  }, []) // No dependencies needed for cleanup

  return {
    ...state,
    checkEmail,
    clearValidation,
  }
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
