"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Loader2, CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react'
import { useToast } from "@/components/ui/toast-provider"
import { authServiceApi } from "@/lib/api/auth"

interface PhoneAuthFormProps {
  className?: string
  onBack?: () => void
  onSuccess?: () => void
}

export function PhoneAuthForm({ className = '', onBack, onSuccess }: PhoneAuthFormProps) {
  const { showToast } = useToast()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Ensure it starts with 0 and limit to 10 digits
    if (digits.length === 0) return ''
    if (digits[0] !== '0') return '0' + digits.slice(0, 9)
    return digits.slice(0, 10)
  }

  const validatePhoneNumber = (phone: string): boolean => {
    return /^0\d{9}$/.test(phone)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Convert to international format (+84)
      const internationalPhone = '+84' + phoneNumber.slice(1)
      const result = await authServiceApi.sendPhoneOTP(internationalPhone)

      if (!result.success) {
        setError(result.error?.message || 'Gửi OTP thất bại')
        showToast("❌ Lỗi", result.error?.message || 'Gửi OTP thất bại', "error")
      } else {
        setStep('otp')
        setCountdown(60) // 60 seconds countdown
        showToast("✅ Thành công", "Mã OTP đã được gửi đến số điện thoại của bạn!", "success")
      }
    } catch (error) {
      const errorMessage = "Đã xảy ra lỗi khi gửi mã OTP"
      setError(errorMessage)
      showToast("❌ Lỗi", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP')
      return
    }

    if (otpCode.length !== 6) {
      setError('Mã OTP phải có 6 số')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const internationalPhone = '+84' + phoneNumber.slice(1)
      const result = await authServiceApi.verifyPhoneOTP(internationalPhone, otpCode)

      if (!result.success) {
        setError(result.error?.message || 'Xác thực OTP thất bại')
        showToast("❌ Lỗi", result.error?.message || 'Xác thực OTP thất bại', "error")
      } else {
        showToast("✅ Thành công", "Đăng nhập thành công!", "success")
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      const errorMessage = "Đã xảy ra lỗi khi xác thực mã OTP"
      setError(errorMessage)
      showToast("❌ Lỗi", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return

    setIsLoading(true)

    try {
      const internationalPhone = '+84' + phoneNumber.slice(1)
      const result = await authServiceApi.sendPhoneOTP(internationalPhone)

      if (!result.success) {
        showToast("❌ Lỗi", result.error?.message || 'Gửi OTP thất bại', "error")
      } else {
        setCountdown(60)
        showToast("✅ Đã gửi lại", "Mã OTP mới đã được gửi!", "success")
      }
    } catch (error) {
      showToast("❌ Lỗi", "Không thể gửi lại mã OTP", "error")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('phone')}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Xác thực OTP
              </CardTitle>
              <CardDescription>
                Nhập mã 6 số đã được gửi đến {phoneNumber}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Nhập mã 6 số"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtpCode(value)
                  if (error) setError('')
                }}
                className="h-12 text-center text-lg font-mono tracking-widest"
                disabled={isLoading}
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Xác thực OTP
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isLoading}
                className="text-sm"
              >
                {countdown > 0 
                  ? `Gửi lại sau ${countdown}s`
                  : "Gửi lại mã OTP"
                }
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Lưu ý:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Mã OTP có hiệu lực trong 5 phút</li>
                <li>• Kiểm tra tin nhắn SMS</li>
                <li>• Mỗi mã chỉ sử dụng được một lần</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Đăng nhập bằng số điện thoại
            </CardTitle>
            <CardDescription>
              Nhận mã OTP qua SMS để đăng nhập
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSendOTP} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={phoneNumber}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setPhoneNumber(formatted)
                if (error) setError('')
              }}
              className="h-12"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500">
              Định dạng: 10 số, bắt đầu bằng 0 (VD: 0901234567)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-green-600 hover:bg-green-700"
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi OTP...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Gửi mã OTP
              </>
            )}
          </Button>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Đăng nhập bằng SMS OTP</h4>
            <p className="text-sm text-gray-600">
              Chúng tôi sẽ gửi mã xác thực 6 số đến số điện thoại của bạn. 
              Phí tin nhắn có thể được áp dụng.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PhoneAuthForm
