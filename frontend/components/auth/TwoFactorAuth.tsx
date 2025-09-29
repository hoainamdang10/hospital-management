"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  QrCode, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Key,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { TwoFactorService, TwoFactorSettings } from "@/lib/auth/two-factor-service"

interface TwoFactorAuthProps {
  className?: string
}

export default function TwoFactorAuth({ className }: TwoFactorAuthProps) {
  const { showToast } = useToast()
  const { user } = useEnhancedAuth()
  
  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorSettings | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'2fa_app' | 'sms' | 'email'>('2fa_app')
  const [isSetupMode, setIsSetupMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [secretKey, setSecretKey] = useState("")
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // Load 2FA settings on component mount
  useEffect(() => {
    const load2FASettings = async () => {
      if (!user?.id) return

      try {
        const settings = await TwoFactorService.getTwoFactorSettings(user.id)
        setTwoFactorSettings(settings)
      } catch (error) {
        console.error('Error loading 2FA settings:', error)
        showToast("❌ Lỗi", "Không thể tải cài đặt 2FA", "error")
      }
    }

    load2FASettings()
  }, [user?.id, showToast])

  const generate2FASecret = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const setupData = await TwoFactorService.setupTwoFactor(user.id, selectedMethod)

      setSecretKey(setupData.secret)
      setQrCodeUrl(setupData.qr_code_url)
      setBackupCodes(setupData.backup_codes)
      setIsSetupMode(true)

      showToast("✅ Thành công", "Mã QR đã được tạo. Vui lòng quét bằng ứng dụng authenticator.", "success")
    } catch (error) {
      console.error('Error generating 2FA secret:', error)
      showToast("❌ Lỗi", "Không thể tạo mã 2FA", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const verify2FASetup = async () => {
    if (!user?.id || !verificationCode || verificationCode.length !== 6) {
      showToast("❌ Lỗi", "Vui lòng nhập mã xác thực 6 số", "error")
      return
    }

    setIsLoading(true)
    try {
      const isValid = await TwoFactorService.enableTwoFactor(user.id, verificationCode)

      if (isValid) {
        // Reload settings to get updated state
        const updatedSettings = await TwoFactorService.getTwoFactorSettings(user.id)
        setTwoFactorSettings(updatedSettings)
        setIsSetupMode(false)
        setShowBackupCodes(true)

        showToast("✅ Thành công", "2FA đã được kích hoạt thành công!", "success")
      } else {
        showToast("❌ Lỗi", "Mã xác thực không đúng", "error")
      }
    } catch (error) {
      console.error('Error verifying 2FA setup:', error)
      showToast("❌ Lỗi", "Không thể xác thực mã 2FA", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!user?.id) return

    // Prompt for verification code before disabling
    const code = prompt("Nhập mã 2FA để xác nhận tắt 2FA:")
    if (!code) return

    setIsLoading(true)
    try {
      const success = await TwoFactorService.disableTwoFactor(user.id, code)

      if (success) {
        // Reload settings to get updated state
        const updatedSettings = await TwoFactorService.getTwoFactorSettings(user.id)
        setTwoFactorSettings(updatedSettings)
        setIsSetupMode(false)
        setVerificationCode("")
        setQrCodeUrl("")
        setBackupCodes([])
        setShowBackupCodes(false)

        showToast("✅ Thành công", "2FA đã được tắt", "success")
      } else {
        showToast("❌ Lỗi", "Mã xác thực không đúng", "error")
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      showToast("❌ Lỗi", "Không thể tắt 2FA", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast("✅ Đã sao chép", "Đã sao chép vào clipboard", "success")
  }

  const downloadBackupCodes = () => {
    const content = `Hospital Management System - Backup Codes\n\nThese codes can be used to access your account if you lose your 2FA device.\nEach code can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hospital-2fa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast("✅ Thành công", "Mã backup đã được tải xuống", "success")
  }

  // Show backup codes after successful setup
  if (showBackupCodes) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mã backup 2FA
          </CardTitle>
          <CardDescription>
            Lưu trữ các mã này ở nơi an toàn. Mỗi mã chỉ có thể sử dụng một lần.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Quan trọng!</span>
            </div>
            <p className="text-sm text-yellow-700">
              Hãy lưu trữ các mã này ở nơi an toàn. Bạn sẽ cần chúng nếu mất thiết bị 2FA.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
            {backupCodes.map((code, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="font-mono text-sm">{code}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(code)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadBackupCodes} className="flex-1">
              Tải xuống mã backup
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowBackupCodes(false)}
              className="flex-1"
            >
              Hoàn thành
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Xác thực hai yếu tố (2FA)
        </CardTitle>
        <CardDescription>
          Thêm một lớp bảo mật bổ sung cho tài khoản của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2FA Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Kích hoạt 2FA</Label>
            <p className="text-sm text-gray-500">
              Yêu cầu mã xác thực khi đăng nhập từ thiết bị mới
            </p>
          </div>
          <div className="flex items-center gap-2">
            {twoFactorSettings?.is_enabled && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã kích hoạt
              </Badge>
            )}
            <Switch
              checked={twoFactorSettings?.is_enabled || false}
              onCheckedChange={(checked) => {
                if (checked && !twoFactorSettings?.is_enabled) {
                  generate2FASecret()
                } else if (!checked && twoFactorSettings?.is_enabled) {
                  disable2FA()
                }
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Method Selection */}
        {!twoFactorSettings?.is_enabled && !isSetupMode && (
          <div className="space-y-2">
            <Label htmlFor="2fa-method">Phương thức 2FA ưa thích</Label>
            <Select value={selectedMethod} onValueChange={(value: '2fa_app' | 'sms' | 'email') => setSelectedMethod(value)}>
              <SelectTrigger id="2fa-method">
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2fa_app">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Ứng dụng Authenticator
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Setup Mode */}
        {isSetupMode && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Thiết lập 2FA</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Tải ứng dụng authenticator (Google Authenticator, Authy, etc.)</li>
                <li>2. Quét mã QR bên dưới hoặc nhập mã thủ công</li>
                <li>3. Nhập mã 6 số từ ứng dụng để xác thực</li>
              </ol>
            </div>

            {/* QR Code */}
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border inline-block">
                {qrCodeUrl ? (
                  <div className="space-y-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                      alt="QR Code for 2FA setup"
                      className="h-32 w-32 mx-auto"
                    />
                    <p className="text-xs text-gray-500">Quét mã QR này bằng ứng dụng authenticator</p>
                  </div>
                ) : (
                  <div>
                    <QrCode className="h-32 w-32 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500 mt-2">QR Code sẽ hiển thị ở đây</p>
                  </div>
                )}
              </div>
              
              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Hoặc nhập mã thủ công:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={secretKey} 
                    readOnly 
                    className="font-mono text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secretKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">Mã xác thực</Label>
              <Input
                id="verification-code"
                placeholder="Nhập mã 6 số từ ứng dụng"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center font-mono text-lg"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={verify2FASetup}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  "Xác thực và kích hoạt"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsSetupMode(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Enabled State Actions */}
        {twoFactorSettings?.is_enabled && !isSetupMode && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">2FA đã được kích hoạt</span>
              </div>
              <p className="text-sm text-green-700">
                Tài khoản của bạn được bảo vệ bởi xác thực hai yếu tố.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBackupCodes(true)}
                className="flex-1"
              >
                <Key className="mr-2 h-4 w-4" />
                Xem mã backup
              </Button>
              <Button 
                variant="outline" 
                onClick={generate2FASecret}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tạo lại mã
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
