'use client'

/**
 * Staff/Doctor/Admin Invite Acceptance Form
 * Form for accepting invitations with MFA opt-in
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { acceptInviteSchema, type AcceptInviteInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Shield, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Mail,
  Key,
  Smartphone
} from 'lucide-react'
import { EnhancedPasswordStrengthIndicator } from './EnhancedPasswordStrengthIndicator'

interface InviteAcceptanceFormProps {
  onSuccess?: (data: { user_id: string; role: string; next_step: string }) => void
  className?: string
}

interface InvitationInfo {
  email: string
  role: string
  department?: string
  invited_by: string
  expires_at: string
  valid: boolean
}

export function InviteAcceptanceForm({ onSuccess, className }: InviteAcceptanceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingToken, setIsVerifyingToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [authMethod, setAuthMethod] = useState<'password' | 'magic_link'>('password')
  const [mfaQrCode, setMfaQrCode] = useState<string>('')
  const [showMfaSetup, setShowMfaSetup] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    mode: 'onChange',
    defaultValues: {
      token: token || '',
      mfa_opt_in: false,
      accept_tos: false,
      accept_privacy: false,
    },
  })

  const watchedPassword = watch('password')
  const watchedMfaOptIn = watch('mfa_opt_in')

  useEffect(() => {
    if (!token) {
      setSubmitError('Token lời mời không hợp lệ')
      setIsVerifyingToken(false)
      return
    }

    verifyInvitationToken()
  }, [token])

  const verifyInvitationToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setInvitationInfo(result.data)
        setValue('token', token!)
      } else {
        setSubmitError(result.error || 'Lời mời không hợp lệ hoặc đã hết hạn')
      }
    } catch (error) {
      console.error('Token verification error:', error)
      setSubmitError('Không thể xác thực lời mời. Vui lòng thử lại sau.')
    } finally {
      setIsVerifyingToken(false)
    }
  }

  const onSubmit = async (data: AcceptInviteInput) => {
    setIsLoading(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          auth_method: authMethod,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setSubmitError(`Quá nhiều yêu cầu. Vui lòng thử lại sau ${result.retryAfter} giây.`)
        } else {
          setSubmitError(result.error || 'Chấp nhận lời mời thất bại')
        }
        return
      }

      if (result.success) {
        // If MFA was enabled, show QR code setup
        if (data.mfa_opt_in && result.data.mfa_qr_code) {
          setMfaQrCode(result.data.mfa_qr_code)
          setShowMfaSetup(true)
          return
        }

        if (onSuccess) {
          onSuccess(result.data)
        } else {
          // Redirect based on role
          const dashboardUrl = getDashboardUrl(result.data.role)
          router.push(`${dashboardUrl}?message=invite_accepted`)
        }
      } else {
        setSubmitError(result.error || 'Chấp nhận lời mời thất bại')
      }
    } catch (error) {
      console.error('Accept invite error:', error)
      setSubmitError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const getDashboardUrl = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin'
      case 'doctor': return '/doctor'
      case 'staff': return '/staff'
      default: return '/dashboard'
    }
  }

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'doctor': return 'Bác sĩ'
      case 'staff': return 'Nhân viên'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'doctor': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'staff': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isVerifyingToken) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Đang xác thực lời mời...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!invitationInfo || submitError) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <CardTitle className="text-red-600">Lời mời không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => router.push('/login')} variant="outline">
              Quay về đăng nhập
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showMfaSetup) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <Smartphone className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <CardTitle>Thiết lập xác thực 2 bước</CardTitle>
          <CardDescription>
            Quét mã QR bằng ứng dụng xác thực để hoàn tất thiết lập
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {mfaQrCode && (
              <img 
                src={mfaQrCode} 
                alt="MFA QR Code" 
                className="mx-auto border rounded-lg"
              />
            )}
          </div>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Sử dụng ứng dụng như Google Authenticator hoặc Authy để quét mã QR này.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => {
              const dashboardUrl = getDashboardUrl(invitationInfo.role)
              router.push(`${dashboardUrl}?message=mfa_setup_complete`)
            }}
            className="w-full"
          >
            Hoàn tất thiết lập
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <UserCheck className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <CardTitle>Chấp nhận lời mời</CardTitle>
        <CardDescription>
          Hoàn tất thiết lập tài khoản để bắt đầu làm việc
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Invitation Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Vai trò được mời:</span>
            <Badge className={getRoleBadgeColor(invitationInfo.role)}>
              {getRoleDisplayName(invitationInfo.role)}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-blue-700">
            <Mail className="h-4 w-4 mr-2" />
            {invitationInfo.email}
          </div>
          {invitationInfo.department && (
            <div className="text-sm text-blue-700 mt-1">
              Khoa: {invitationInfo.department}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Authentication Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Phương thức xác thực</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="password"
                  name="auth_method"
                  value="password"
                  checked={authMethod === 'password'}
                  onChange={(e) => setAuthMethod(e.target.value as 'password')}
                  className="h-4 w-4 text-blue-600"
                />
                <Label htmlFor="password" className="flex items-center cursor-pointer">
                  <Key className="h-4 w-4 mr-2" />
                  Đặt mật khẩu
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="magic_link"
                  name="auth_method"
                  value="magic_link"
                  checked={authMethod === 'magic_link'}
                  onChange={(e) => setAuthMethod(e.target.value as 'magic_link')}
                  className="h-4 w-4 text-blue-600"
                />
                <Label htmlFor="magic_link" className="flex items-center cursor-pointer">
                  <Mail className="h-4 w-4 mr-2" />
                  Đăng nhập bằng email (không cần mật khẩu)
                </Label>
              </div>
            </div>
          </div>

          {/* Password Fields (only if password method selected) */}
          {authMethod === 'password' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Mật khẩu *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Nhập mật khẩu"
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
                <Label htmlFor="confirm_password">Xác nhận mật khẩu *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirm_password')}
                    placeholder="Nhập lại mật khẩu"
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
            </div>
          )}

          {/* MFA Opt-in */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="mfa_opt_in"
                {...register('mfa_opt_in')}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="mfa_opt_in"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bật xác thực 2 bước (khuyến nghị)
                </Label>
                <p className="text-xs text-gray-500">
                  Tăng cường bảo mật tài khoản bằng ứng dụng xác thực
                </p>
              </div>
            </div>

            {watchedMfaOptIn && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Bạn sẽ cần cài đặt ứng dụng xác thực như Google Authenticator sau khi hoàn tất.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept_tos"
                {...register('accept_tos')}
                className={errors.accept_tos ? 'border-red-500' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="accept_tos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tôi đồng ý với{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Điều khoản sử dụng
                  </a>{' '}
                  *
                </Label>
                {errors.accept_tos && (
                  <p className="text-sm text-red-600">{errors.accept_tos.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept_privacy"
                {...register('accept_privacy')}
                className={errors.accept_privacy ? 'border-red-500' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="accept_privacy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tôi đồng ý với{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Chính sách bảo mật
                  </a>{' '}
                  *
                </Label>
                {errors.accept_privacy && (
                  <p className="text-sm text-red-600">{errors.accept_privacy.message}</p>
                )}
              </div>
            </div>
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
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Chấp nhận lời mời
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Có vấn đề với lời mời?{' '}
            <a href="/contact" className="text-blue-600 hover:underline">
              Liên hệ hỗ trợ
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
