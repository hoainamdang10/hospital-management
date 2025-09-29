'use client'

import { useState } from 'react'
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Phone, Smartphone, Github, Chrome, Facebook, Loader2, Eye, EyeOff } from 'lucide-react'

export const MultiMethodLogin = () => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('email')
  
  // Form States
  const [emailForm, setEmailForm] = useState({ email: '', password: '' })
  const [magicLinkForm, setMagicLinkForm] = useState({ email: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '', otp: '', step: 'phone' })
  
  const {
    signInWithEmail,
    signInWithMagicLink,
    signInWithPhone,
    verifyOTP,
    signInWithOAuth,
    loading: authLoading
  } = useEnhancedAuth()

  // Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email || !emailForm.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setLoading(true)
    try {
      const result = await signInWithEmail(emailForm.email, emailForm.password)
      if (!result.success) {
        toast.error(result.error || 'Đăng nhập thất bại')
      }
    } catch (error: any) {
      toast.error('Lỗi đăng nhập: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Magic Link Login
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicLinkForm.email) {
      toast.error('Vui lòng nhập email')
      return
    }

    setLoading(true)
    try {
      const result = await signInWithMagicLink(magicLinkForm.email)
      if (!result.success) {
        toast.error(result.error || 'Gửi magic link thất bại')
      }
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Phone/SMS OTP Login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (phoneForm.step === 'phone') {
      if (!phoneForm.phone) {
        toast.error('Vui lòng nhập số điện thoại')
        return
      }

      setLoading(true)
      try {
        const result = await signInWithPhone(phoneForm.phone)
        if (result.success) {
          setPhoneForm(prev => ({ ...prev, step: 'otp' }))
        } else {
          toast.error(result.error || 'Gửi OTP thất bại')
        }
      } catch (error: any) {
        toast.error('Lỗi: ' + error.message)
      } finally {
        setLoading(false)
      }
    } else {
      if (!phoneForm.otp) {
        toast.error('Vui lòng nhập mã OTP')
        return
      }

      setLoading(true)
      try {
        const result = await verifyOTP(phoneForm.phone, phoneForm.otp)
        if (!result.success) {
          toast.error(result.error || 'Xác thực OTP thất bại')
        }
      } catch (error: any) {
        toast.error('Lỗi: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // OAuth Login
  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'github') => {
    setLoading(true)
    try {
      const result = await signInWithOAuth(provider)
      if (!result.success) {
        toast.error(result.error || `Đăng nhập ${provider} thất bại`)
      }
    } catch (error: any) {
      toast.error(`Lỗi đăng nhập ${provider}: ` + error.message)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || authLoading

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
        <CardDescription>
          Chọn phương thức đăng nhập phù hợp với bạn
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="text-xs">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="magic" className="text-xs">
              <Smartphone className="w-4 h-4 mr-1" />
              Magic
            </TabsTrigger>
            <TabsTrigger value="phone" className="text-xs">
              <Phone className="w-4 h-4 mr-1" />
              SMS
            </TabsTrigger>
          </TabsList>

          {/* Email/Password Tab */}
          <TabsContent value="email" className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Magic Link Tab */}
          <TabsContent value="magic" className="space-y-4">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="your@email.com"
                  value={magicLinkForm.email}
                  onChange={(e) => setMagicLinkForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi Magic Link'
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                Chúng tôi sẽ gửi link đăng nhập đến email của bạn
              </p>
            </form>
          </TabsContent>

          {/* Phone/SMS Tab */}
          <TabsContent value="phone" className="space-y-4">
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              {phoneForm.step === 'phone' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+84901234567"
                      value={phoneForm.phone}
                      onChange={(e) => setPhoneForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang gửi OTP...
                      </>
                    ) : (
                      'Gửi mã OTP'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Mã OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={phoneForm.otp}
                      onChange={(e) => setPhoneForm(prev => ({ ...prev, otp: e.target.value }))}
                      disabled={isLoading}
                      required
                      maxLength={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xác thực...
                      </>
                    ) : (
                      'Xác thực OTP'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setPhoneForm(prev => ({ ...prev, step: 'phone', otp: '' }))}
                    disabled={isLoading}
                  >
                    Quay lại
                  </Button>
                </>
              )}
            </form>
          </TabsContent>
        </Tabs>

        {/* OAuth Section */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Hoặc đăng nhập với
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full"
            >
              <Chrome className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={isLoading}
              className="w-full"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="w-full"
            >
              <Github className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <a href="/auth/register" className="text-primary hover:underline">
              Đăng ký ngay
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            <a href="/auth/forgot-password" className="text-primary hover:underline">
              Quên mật khẩu?
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default MultiMethodLogin
