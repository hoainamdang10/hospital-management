'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Mail,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginForm {
  email: string;
  password: string;
  remember_me: boolean;
  two_factor_code?: string;
}

interface SecurityCheck {
  ip_address: string;
  location: string;
  device_info: string;
  is_suspicious: boolean;
  requires_verification: boolean;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    remember_me: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa' | 'security_check'>('credentials');
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    // Check if already authenticated
    checkAuthStatus();
    
    // Perform security check
    performSecurityCheck();
    
    // Check for account lockout
    checkAccountLockout();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && ['admin', 'superadmin'].includes(data.user.role)) {
          router.push('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const performSecurityCheck = async () => {
    try {
      const response = await fetch('/api/auth/security-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityCheck(data.security_check);
      }
    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  const checkAccountLockout = async () => {
    const email = localStorage.getItem('last_login_email');
    if (!email) return;

    try {
      const response = await fetch('/api/auth/lockout-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_locked) {
          setIsLocked(true);
          setLockoutTime(data.unlock_time);
        }
        setLoginAttempts(data.failed_attempts);
      }
    } catch (error) {
      console.error('Lockout check failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    try {
      // Store email for lockout tracking
      localStorage.setItem('last_login_email', formData.email);

      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          remember_me: formData.remember_me,
          security_context: {
            ip_address: securityCheck?.ip_address,
            user_agent: navigator.userAgent,
            device_info: securityCheck?.device_info
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setLoginStep('2fa');
        } else if (data.requires_security_verification) {
          setLoginStep('security_check');
        } else {
          // Successful login - redirect to dashboard
          await logSuccessfulLogin(data.user);
          router.push('/admin/dashboard');
        }
      } else {
        // Handle login failure
        setLoginAttempts(prev => prev + 1);
        
        if (data.account_locked) {
          setIsLocked(true);
          setLockoutTime(data.unlock_time);
        }

        // Log failed attempt
        await logFailedLogin(formData.email, data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          two_factor_code: formData.two_factor_code
        })
      });

      const data = await response.json();

      if (response.ok) {
        await logSuccessfulLogin(data.user);
        router.push('/admin/dashboard');
      } else {
        // Handle 2FA failure
        setLoginAttempts(prev => prev + 1);
      }
    } catch (error) {
      console.error('2FA verification error:', error);
    }
  };

  const logSuccessfulLogin = async (user: any) => {
    try {
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login_success',
          resource_type: 'authentication',
          details: {
            user_id: user.id,
            user_email: user.email,
            user_role: user.role,
            login_method: formData.two_factor_code ? '2fa' : 'password',
            security_context: securityCheck
          }
        })
      });
    } catch (error) {
      console.error('Failed to log successful login:', error);
    }
  };

  const logFailedLogin = async (email: string, errorMessage: string) => {
    try {
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login_failed',
          resource_type: 'authentication',
          status: 'failed',
          details: {
            email,
            error: errorMessage,
            attempt_number: loginAttempts + 1,
            security_context: securityCheck
          }
        })
      });
    } catch (error) {
      console.error('Failed to log failed login:', error);
    }
  };

  const getRemainingLockoutTime = () => {
    if (!lockoutTime) return 0;
    const remaining = Math.max(0, lockoutTime - Date.now());
    return Math.ceil(remaining / 1000 / 60); // minutes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hospital Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hệ thống Quản lý Bệnh viện
          </h1>
          <p className="text-gray-600 mt-2">
            Đăng nhập Quản trị viên
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center flex items-center justify-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              {loginStep === 'credentials' && 'Đăng nhập'}
              {loginStep === '2fa' && 'Xác thực 2FA'}
              {loginStep === 'security_check' && 'Kiểm tra Bảo mật'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Security Status */}
            {securityCheck && (
              <Alert className={securityCheck.is_suspicious ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}>
                <AlertTriangle className={`h-4 w-4 ${securityCheck.is_suspicious ? 'text-yellow-600' : 'text-green-600'}`} />
                <AlertDescription className="text-sm">
                  <div>Vị trí: {securityCheck.location}</div>
                  <div>Thiết bị: {securityCheck.device_info}</div>
                  {securityCheck.is_suspicious && (
                    <div className="text-yellow-700 font-medium mt-1">
                      Phát hiện hoạt động đáng nghi
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Account Lockout Warning */}
            {isLocked && (
              <Alert className="border-red-200 bg-red-50">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.
                  Thời gian mở khóa: {getRemainingLockoutTime()} phút.
                </AlertDescription>
              </Alert>
            )}

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Đăng nhập thất bại {loginAttempts}/5 lần. 
                  Tài khoản sẽ bị khóa sau {5 - loginAttempts} lần thử sai nữa.
                </AlertDescription>
              </Alert>
            )}

            {/* Credentials Step */}
            {loginStep === 'credentials' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@hospital.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10"
                      required
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-10 pr-10"
                      required
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      disabled={isLocked}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember_me}
                    onCheckedChange={(checked) => setFormData({...formData, remember_me: !!checked})}
                    disabled={isLocked}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Ghi nhớ đăng nhập
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || isLocked}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </form>
            )}

            {/* 2FA Step */}
            {loginStep === '2fa' && (
              <form onSubmit={handle2FAVerification} className="space-y-4">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Xác thực 2 yếu tố</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Nhập mã xác thực từ ứng dụng Authenticator của bạn
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="two_factor_code">Mã xác thực</Label>
                  <Input
                    id="two_factor_code"
                    type="text"
                    placeholder="000000"
                    value={formData.two_factor_code || ''}
                    onChange={(e) => setFormData({...formData, two_factor_code: e.target.value})}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLoginStep('credentials')}
                  >
                    Quay lại
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực'}
                  </Button>
                </div>
              </form>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-500 mt-6">
              <p>Hệ thống được bảo mật với mã hóa SSL và audit logging</p>
              <p>Mọi hoạt động đăng nhập đều được ghi lại và giám sát</p>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Cần hỗ trợ? Liên hệ IT Support: <strong>support@hospital.com</strong></p>
        </div>
      </div>
    </div>
  );
}
