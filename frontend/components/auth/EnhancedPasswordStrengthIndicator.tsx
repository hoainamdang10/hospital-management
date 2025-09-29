'use client'

/**
 * Enhanced Password Strength Indicator Component
 * Visual feedback for password strength with Vietnamese messages
 */

import { useMemo } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface PasswordStrength {
  score: number
  feedback: string[]
  level: 'weak' | 'fair' | 'good' | 'strong'
  color: string
}

export function EnhancedPasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        feedback: [],
        level: 'weak' as const,
        color: 'bg-gray-200'
      }
    }

    let score = 0
    const feedback: string[] = []

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push('Ít nhất 8 ký tự')

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Ít nhất 1 chữ thường')

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Ít nhất 1 chữ hoa')

    // Number check
    if (/\d/.test(password)) score += 1
    else feedback.push('Ít nhất 1 số')

    // Special character check
    if (/[@$!%*?&]/.test(password)) score += 1
    else feedback.push('Ít nhất 1 ký tự đặc biệt')

    // Bonus for longer passwords
    if (password.length >= 12) score += 1

    // Determine level and color
    let level: 'weak' | 'fair' | 'good' | 'strong'
    let color: string

    if (score <= 2) {
      level = 'weak'
      color = 'bg-red-500'
    } else if (score <= 3) {
      level = 'fair'
      color = 'bg-orange-500'
    } else if (score <= 4) {
      level = 'good'
      color = 'bg-yellow-500'
    } else {
      level = 'strong'
      color = 'bg-green-500'
    }

    return { score, feedback, level, color }
  }, [password])

  const getLevelText = (level: string) => {
    switch (level) {
      case 'weak': return 'Yếu'
      case 'fair': return 'Trung bình'
      case 'good': return 'Tốt'
      case 'strong': return 'Mạnh'
      default: return ''
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'weak': return <X className="h-4 w-4 text-red-500" />
      case 'fair': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'good': return <Check className="h-4 w-4 text-yellow-600" />
      case 'strong': return <Check className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  if (!password) return null

  const progressPercentage = Math.min((strength.score / 5) * 100, 100)

  return (
    <div className={`mt-2 space-y-2 ${className}`}>
      {/* Progress bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center space-x-1">
          {getLevelIcon(strength.level)}
          <span className={`text-sm font-medium ${
            strength.level === 'weak' ? 'text-red-600' :
            strength.level === 'fair' ? 'text-orange-600' :
            strength.level === 'good' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {getLevelText(strength.level)}
          </span>
        </div>
      </div>

      {/* Requirements checklist */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-medium">Yêu cầu mật khẩu:</p>
          <div className="grid grid-cols-1 gap-1">
            {[
              { text: 'Ít nhất 8 ký tự', met: password.length >= 8 },
              { text: 'Ít nhất 1 chữ thường', met: /[a-z]/.test(password) },
              { text: 'Ít nhất 1 chữ hoa', met: /[A-Z]/.test(password) },
              { text: 'Ít nhất 1 số', met: /\d/.test(password) },
              { text: 'Ít nhất 1 ký tự đặc biệt', met: /[@$!%*?&]/.test(password) },
            ].map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                {requirement.met ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${
                  requirement.met ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {requirement.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tips */}
      {strength.level === 'strong' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-2">
          <p className="text-xs text-green-700 flex items-center">
            <Check className="h-3 w-3 mr-1" />
            Mật khẩu mạnh! Tài khoản của bạn được bảo vệ tốt.
          </p>
        </div>
      )}

      {strength.level === 'weak' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-xs text-red-700 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Mật khẩu yếu. Hãy thêm chữ hoa, số và ký tự đặc biệt.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for inline display
 */
export function PasswordStrengthBadge({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { level: 'weak', score: 0 }

    let score = 0
    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[@$!%*?&]/.test(password)) score += 1

    let level: 'weak' | 'fair' | 'good' | 'strong'
    if (score <= 2) level = 'weak'
    else if (score <= 3) level = 'fair'
    else if (score <= 4) level = 'good'
    else level = 'strong'

    return { level, score }
  }, [password])

  if (!password) return null

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'weak': return 'bg-red-100 text-red-800 border-red-200'
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'strong': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case 'weak': return 'Yếu'
      case 'fair': return 'TB'
      case 'good': return 'Tốt'
      case 'strong': return 'Mạnh'
      default: return ''
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(strength.level)} ${className}`}>
      {getLevelText(strength.level)}
    </span>
  )
}
