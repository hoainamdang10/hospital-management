"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"

import { useToast } from "@/components/ui/toast-provider"
import { useAuth } from "@/lib/auth/auth-wrapper"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { user, refreshUser, getSupabaseClient } = useAuth()
  
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Check verification status on mount and when URL changes
  useEffect(() => {
    const checkVerification = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const type = searchParams.get('type')
      
      // If we have tokens from email verification link
      if (accessToken && refreshToken && type === 'email') {
        try {
          // Set the session with the tokens
          const { data, error } = await getSupabaseClient().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            setError("Xác thực email thất bại: " + error.message)
            setIsVerifying(false)
            return
          }
          
          if (data.user) {
            setIsVerified(true)
            setIsVerifying(false)
            showToast("✅ Thành công", "Email đã được xác thực thành công!", "success")
            
            // Refresh user data
            await refreshUser()
            
            // Redirect to appropriate dashboard after 3 seconds
            setTimeout(() => {
              const userRole = data.user.user_metadata?.role || 'patient'
              router.push(`/${userRole}/dashboard`)
            }, 3000)
            return
          }
        } catch (error) {
          setError("Đã xảy ra lỗi khi xác thực email")
          setIsVerifying(false)
          return
        }
      }
      
      // Check current user verification status
      if (user) {
        if (user.email_verified) {
          setIsVerified(true)
          setIsVerifying(false)
          // Redirect to dashboard if already verified
          setTimeout(() => {
            router.push(`/${user.role}/dashboard`)
          }, 2000)
        } else {
          setIsVerifying(false)
        }
      } else {
        setIsVerifying(false)
      }
    }
    
    checkVerification()
  }, [searchParams, user, router, refreshUser, showToast])

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendVerification = async () => {
    if (!user?.email) {
      showToast("❌ Lỗi", "Không tìm thấy email người dùng", "error")
      return
    }

    setIsResending(true)
    setError("")

    try {
      const { error } = await getSupabaseClient().auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        setError("Không thể gửi lại email xác thực: " + error.message)
        showToast("❌ Lỗi", "Không thể gửi lại email xác thực", "error")
      } else {
        showToast("✅ Thành công", "Email xác thực đã được gửi lại!", "success")
        setResendCooldown(60) // 60 second cooldown
      }
    } catch (error) {
      setError("Đã xảy ra lỗi khi gửi lại email xác thực")
      showToast("❌ Lỗi", "Đã xảy ra lỗi khi gửi lại email xác thực", "error")
    } finally {
      setIsResending(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
        <Card className="w-full max-w-[400px] shadow-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#0066CC]" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác thực email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
        <Card className="w-full max-w-[400px] shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email đã được xác thực!</h2>
              <p className="text-gray-600 mb-6">
                Tài khoản của bạn đã được kích hoạt thành công. Bạn sẽ được chuyển hướng đến dashboard.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Đang chuyển hướng...
                </p>
              </div>
              {user && (
                <Link href={`/${user.role}/dashboard`}>
                  <Button className="w-full bg-[#0066CC] hover:bg-[#0055AA]">
                    Đi đến Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main verification needed state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center text-white mx-auto mb-4">
              <Mail size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác thực email</h2>
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi một email xác thực đến{" "}
              <span className="font-medium text-[#0066CC]">{user?.email}</span>.
              Vui lòng kiểm tra hộp thư và nhấp vào liên kết để xác thực tài khoản.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Không thấy email?</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Kiểm tra thư mục spam hoặc junk</li>
                <li>• Đảm bảo email chính xác</li>
                <li>• Có thể mất vài phút để email đến</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending || resendCooldown > 0}
                className="w-full bg-[#0066CC] hover:bg-[#0055AA]"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gửi lại sau {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gửi lại email xác thực
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Quay lại đăng nhập
                  </Button>
                </Link>
                {user && (
                  <Link href={`/${user.role}/dashboard`} className="flex-1">
                    <Button variant="ghost" className="w-full text-[#0066CC]">
                      Bỏ qua
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
