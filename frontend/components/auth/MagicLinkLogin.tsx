"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { useToast } from "@/components/ui/toast-provider"
import { authServiceApi } from "@/lib/api/auth"

interface MagicLinkLoginProps {
  className?: string
  onBack?: () => void
}

export function MagicLinkLogin({ className = '', onBack }: MagicLinkLoginProps) {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return
    }

    if (!validateEmail(email)) {
      setError('Email không hợp lệ')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await authServiceApi.sendMagicLink(email)

      if (!result.success) {
        setError(result.error?.message || 'Gửi magic link thất bại')
        showToast("❌ Lỗi", result.error?.message || 'Gửi magic link thất bại', "error")
      } else {
        setIsSuccess(true)
        showToast("✅ Thành công", "Magic link đã được gửi đến email của bạn!", "success")
      }
    } catch (error) {
      const errorMessage = "Đã xảy ra lỗi khi gửi magic link"
      setError(errorMessage)
      showToast("❌ Lỗi", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)

    try {
      const result = await authServiceApi.sendMagicLink(email)

      if (!result.success) {
        showToast("❌ Lỗi", result.error?.message || 'Gửi magic link thất bại', "error")
      } else {
        showToast("✅ Đã gửi lại", "Magic link mới đã được gửi!", "success")
      }
    } catch (error) {
      showToast("❌ Lỗi", "Không thể gửi lại magic link", "error")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle size={32} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Magic Link đã được gửi!
              </h3>
              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi một liên kết đăng nhập đến email:
              </p>
              <p className="font-medium text-blue-600 mb-4">{email}</p>
              <p className="text-sm text-gray-500 mb-6">
                Vui lòng kiểm tra email và nhấp vào liên kết để đăng nhập. 
                Liên kết sẽ hết hạn sau 1 giờ.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResend}
                disabled={isLoading}
                variant="outline"
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
                    Gửi lại Magic Link
                  </>
                )}
              </Button>

              {onBack && (
                <Button 
                  onClick={onBack}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Lưu ý:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Kiểm tra cả hộp thư spam/junk</li>
                <li>• Liên kết chỉ có thể sử dụng một lần</li>
                <li>• Liên kết sẽ hết hạn sau 1 giờ</li>
                <li>• Đăng nhập trên cùng thiết bị/trình duyệt</li>
              </ul>
            </div>
          </div>
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
              <Mail className="h-5 w-5 text-blue-600" />
              Đăng nhập không mật khẩu
            </CardTitle>
            <CardDescription>
              Nhận liên kết đăng nhập qua email - không cần nhớ mật khẩu
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              className="h-12"
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi Magic Link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Gửi Magic Link
              </>
            )}
          </Button>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Magic Link là gì?</h4>
            <p className="text-sm text-gray-600">
              Magic Link là một liên kết bảo mật được gửi đến email của bạn. 
              Chỉ cần nhấp vào liên kết để đăng nhập mà không cần nhập mật khẩu.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default MagicLinkLogin
