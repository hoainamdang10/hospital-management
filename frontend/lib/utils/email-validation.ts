// Email validation utilities for registration
import { supabase } from '@/lib/supabase'

export interface EmailCheckResult {
  isAvailable: boolean
  message: string
  suggestion?: string
}

/**
 * Check if email is available for registration
 */
export async function checkEmailAvailability(email: string): Promise<EmailCheckResult> {
  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        isAvailable: false,
        message: 'Email không hợp lệ. Vui lòng kiểm tra lại định dạng email.'
      }
    }

    // Check if email exists in profiles table
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking email in profiles:', profileError)
      return {
        isAvailable: false,
        message: 'Không thể kiểm tra email. Vui lòng thử lại.'
      }
    }

    if (existingProfile) {
      return {
        isAvailable: false,
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
        suggestion: 'login'
      }
    }

    // Note: Skip auth.users check for now since function doesn't exist
    // The profiles table check above is sufficient for email validation
    // TODO: Create check_email_exists RPC function if needed

    return {
      isAvailable: true,
      message: 'Email có thể sử dụng.'
    }

  } catch (error) {
    console.error('Error in checkEmailAvailability:', error)
    return {
      isAvailable: false,
      message: 'Không thể kiểm tra email. Vui lòng thử lại.'
    }
  }
}

/**
 * Validate email format and common issues
 */
export function validateEmailFormat(email: string): {
  isValid: boolean
  message?: string
  suggestions?: string[]
} {
  if (!email) {
    return {
      isValid: false,
      message: 'Email không được để trống.'
    }
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Email không hợp lệ. Vui lòng kiểm tra lại định dạng.',
      suggestions: ['Ví dụ: user@example.com']
    }
  }

  // Check for common typos in domains
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'protonmail.com', 'zoho.com'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  const suggestions: string[] = []

  // Check for common typos
  const typoMap: { [key: string]: string } = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com'
  }

  if (domain && typoMap[domain]) {
    const correctedEmail = email.replace(domain, typoMap[domain])
    suggestions.push(`Có phải bạn muốn nhập: ${correctedEmail}?`)
  }

  // Check for missing TLD
  if (domain && !domain.includes('.')) {
    suggestions.push('Email thiếu phần mở rộng (ví dụ: .com, .vn)')
  }

  // Check for double @
  if ((email.match(/@/g) || []).length > 1) {
    return {
      isValid: false,
      message: 'Email chỉ được chứa một ký tự @.',
      suggestions: ['Kiểm tra lại email của bạn']
    }
  }

  // Check for spaces
  if (email.includes(' ')) {
    return {
      isValid: false,
      message: 'Email không được chứa khoảng trắng.',
      suggestions: ['Loại bỏ tất cả khoảng trắng trong email']
    }
  }

  // Check length
  if (email.length > 254) {
    return {
      isValid: false,
      message: 'Email quá dài (tối đa 254 ký tự).'
    }
  }

  const localPart = email.split('@')[0]
  if (localPart.length > 64) {
    return {
      isValid: false,
      message: 'Phần trước @ quá dài (tối đa 64 ký tự).'
    }
  }

  return {
    isValid: true,
    ...(suggestions.length > 0 && { suggestions })
  }
}

/**
 * Suggest alternative emails if the current one is taken
 */
export function suggestAlternativeEmails(email: string): string[] {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return []

  const suggestions = [
    `${localPart}1@${domain}`,
    `${localPart}2024@${domain}`,
    `${localPart}.${new Date().getFullYear()}@${domain}`,
    `${localPart}_${Math.floor(Math.random() * 100)}@${domain}`
  ]

  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Real-time email validation for form inputs
 */
export function validateEmailRealtime(email: string): {
  isValid: boolean
  message?: string
  type: 'success' | 'warning' | 'error' | 'info'
} {
  if (!email) {
    return {
      isValid: false,
      type: 'info'
    }
  }

  const formatCheck = validateEmailFormat(email)
  
  if (!formatCheck.isValid) {
    return {
      isValid: false,
      message: formatCheck.message,
      type: 'error'
    }
  }

  if (formatCheck.suggestions && formatCheck.suggestions.length > 0) {
    return {
      isValid: true,
      message: formatCheck.suggestions[0],
      type: 'warning'
    }
  }

  return {
    isValid: true,
    message: 'Email hợp lệ',
    type: 'success'
  }
}

/**
 * Debounced email availability check
 */
export function createDebouncedEmailCheck(delay: number = 500) {
  let timeoutId: NodeJS.Timeout

  return (email: string, callback: (result: EmailCheckResult) => void) => {
    clearTimeout(timeoutId)
    
    timeoutId = setTimeout(async () => {
      const result = await checkEmailAvailability(email)
      callback(result)
    }, delay)
  }
}
