'use client'

/**
 * Password Reset Flow Components
 * Complete password reset flow with email request and password reset forms
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  forgotPasswordSchema, 
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput 
} from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Key, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Clock
} from 'lucide-react'
import { CaptchaWidget } from './CaptchaWidget'
import { EnhancedPasswordStrengthIndicator } from './EnhancedPasswordStrengthIndicator'

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void
  className?: string
}

interface ResetPasswordFormProps {
  token?: string
  onSuccess?: () => void
  className?: string
}

// Forgot Password Form Component
export function ForgotPasswordForm({ onSuccess, className }: ForgotPasswordFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number
    resetTime: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const watchedEmail = watch('email')

  const onSubmit = async (data: ForgotPasswordInput) => {
    if (!captchaToken) {
      setSubmitError('Vui lòng hoàn thành xác thực CAPTCHA')
      return
    }

    setIsLoading(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          captcha_token: captchaToken,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '0')
          setRateLimitInfo({
            remaining: 0,
            resetTime: Date.now() + (retryAfter * 1000)
          })
          setSubmitError(`Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau ${retryAfter} giây.`)
        } else {
          setSubmitError(result.error || 'Gửi yêu cầu đặt lại mật khẩu thất bại')
        }
        return
      }

      if (result.success) {
        setIsSuccess(true)
        if (onSuccess) {
          onSuccess(data.email)
        }
      } else {
        setSubmitError(result.error || 'Gửi yêu cầu đặt lại mật khẩu thất bại')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setSubmitError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <CardTitle className="text-green-600">Email đã được gửi</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Vui lòng kiểm tra hộp thư đến (và thư mục spam) để tìm email chứa liên kết đặt lại mật khẩu.
              Liên kết sẽ hết hạn sau 1 giờ.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay về đăng nhập
            </Button>
            
            <Button
              onClick={() => {
                setIsSuccess(false)
                setCaptchaToken('')
              }}
              variant="ghost"
              className="w-full"
            >
              Gửi lại email
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <Key className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <CardTitle>Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="example@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
            {watchedEmail && !errors.email && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Email hợp lệ
              </p>
            )}
          </div>

          <div>
            <Label>Xác thực bảo mật</Label>
            <CaptchaWidget
              onVerify={setCaptchaToken}
              onError={() => setCaptchaToken('')}
              onExpire={() => setCaptchaToken('')}
            />
          </div>

          {rateLimitInfo && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Bạn đã đạt giới hạn yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isValid || !captchaToken}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Gửi hướng dẫn đặt lại
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nhớ mật khẩu?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Reset Password Form Component
export function ResetPasswordForm({ token, onSuccess, className }: ResetPasswordFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetToken = token || searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      token: resetToken || '',
    },
  })

  const watchedPassword = watch('password')

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 400 && result.error?.includes('token')) {
          setSubmitError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.')
        } else {
          setSubmitError(result.error || 'Đặt lại mật khẩu thất bại')
        }
        return
      }

      if (result.success) {
        setIsSuccess(true)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setSubmitError(result.error || 'Đặt lại mật khẩu thất bại')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setSubmitError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!resetToken) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <CardTitle className="text-red-600">Liên kết không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => router.push('/forgot-password')} variant="outline">
              Yêu cầu liên kết mới
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <CardTitle className="text-green-600">Đặt lại mật khẩu thành công</CardTitle>
          <CardDescription>
            Mật khẩu của bạn đã được cập nhật thành công
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Bạn có thể đăng nhập ngay bằng mật khẩu mới.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={() => router.push('/login?message=password_reset_success')}
            className="w-full"
          >
            Đăng nhập ngay
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <Key className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <CardTitle>Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Nhập mật khẩu mới cho tài khoản của bạn
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('token')} />
          
          <div>
            <Label htmlFor="password">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Nhập mật khẩu mới"
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
            {watchedPassword && (
              <EnhancedPasswordStrengthIndicator password={watchedPassword} />
            )}
          </div>

          <div>
            <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirm_password')}
                placeholder="Nhập lại mật khẩu mới"
                className={errors.confirm_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-600 mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Cập nhật mật khẩu
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nhớ mật khẩu?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Combined Password Reset Flow Component
export function PasswordResetFlow({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (token) {
    return <ResetPasswordForm token={token} className={className} />
  }

  return <ForgotPasswordForm className={className} />
}
