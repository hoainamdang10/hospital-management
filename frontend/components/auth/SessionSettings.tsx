'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Shield, LogOut, Settings, CheckCircle } from 'lucide-react'
import { sessionManager } from '@/lib/auth/session-manager'
import { useToast } from '@/components/ui/toast-provider'

interface SessionSettingsProps {
  className?: string
}

export function SessionSettings({ className }: SessionSettingsProps) {
  const [autoClearEnabled, setAutoClearEnabled] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const { showToast } = useToast()

  useEffect(() => {
    // Get current session info
    const session = sessionManager.getSession()
    const user = sessionManager.getUser()
    
    if (session && user) {
      setSessionInfo({
        userId: user.id,
        role: user.role,
        email: user.email,
        expiresAt: new Date(session.expiresAt).toLocaleString('vi-VN'),
        createdAt: new Date(session.createdAt).toLocaleString('vi-VN'),
        timeLeft: Math.round((session.expiresAt - Date.now()) / 1000 / 60) // minutes
      })
    }
  }, [])

  const handleAutoClearToggle = (enabled: boolean) => {
    setAutoClearEnabled(enabled)
    sessionManager.setAutoCleanOnTabClose(enabled)
    
    showToast(
      "⚙️ Cài đặt",
      enabled 
        ? "Tự động đăng xuất khi đóng tab đã được bật" 
        : "Tự động đăng xuất khi đóng tab đã được tắt",
      "success"
    )
  }

  const handleForceLogout = () => {
    sessionManager.forceLogout()
    showToast("🚪 Đăng xuất", "Đã đăng xuất thành công", "success")
    // Redirect will be handled by auth context
  }

  const handleClearSession = () => {
    sessionManager.clearSession()
    showToast("🔄 Xóa session", "Session đã được xóa", "success")
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt phiên đăng nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          {sessionInfo && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Thông tin phiên hiện tại</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{sessionInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vai trò:</span>
                  <span className="font-medium capitalize">{sessionInfo.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đăng nhập lúc:</span>
                  <span className="font-medium">{sessionInfo.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hết hạn lúc:</span>
                  <span className="font-medium">{sessionInfo.expiresAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian còn lại:</span>
                  <span className={`font-medium ${sessionInfo.timeLeft < 60 ? 'text-red-600' : 'text-green-600'}`}>
                    {sessionInfo.timeLeft > 0 ? `${sessionInfo.timeLeft} phút` : 'Đã hết hạn'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Auto Clear Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-clear" className="text-sm font-medium">
                  Tự động đăng xuất khi đóng tab
                </Label>
                <p className="text-xs text-gray-500">
                  Khi bật, bạn sẽ bị đăng xuất tự động khi đóng tab hoặc trình duyệt
                </p>
              </div>
              <Switch
                id="auto-clear"
                checked={autoClearEnabled}
                onCheckedChange={handleAutoClearToggle}
              />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700">
                Session persistence enabled - You will stay logged in across page reloads and browser restarts
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSession}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Xóa Session
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleForceLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất ngay
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Sử dụng "Xóa Session" để test hoặc "Đăng xuất ngay" để thoát hoàn toàn
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SessionSettings
