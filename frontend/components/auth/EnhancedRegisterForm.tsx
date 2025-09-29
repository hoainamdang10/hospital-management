'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-wrapper';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileCreationStatus {
  step: 'auth' | 'profile' | 'complete';
  method?: 'trigger' | 'rpc' | 'manual';
  message?: string;
}

export function EnhancedRegisterForm() {
  const router = useRouter();
  const { loading, signUp } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
    role: 'patient' as 'doctor' | 'patient' | 'nurse' | 'receptionist',
    // Doctor specific fields
    specialty: '',
    license_number: '',
    // Patient specific fields
    date_of_birth: '',
    gender: 'male',
    address: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileCreationStatus>({ step: 'auth' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.role === 'doctor' && (!formData.specialty || !formData.license_number)) {
      setError('Vui lòng điền đầy đủ thông tin chuyên khoa và số giấy phép');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setProfileStatus({ step: 'auth' });

    try {
      // Prepare data based on role
      const { email, password, full_name, phone_number, role, ...rest } = formData;
      let submissionData: any = {
        email,
        password,
        full_name,
        phone_number,
        role,
      };

      if (role === 'doctor') {
        submissionData = {
          ...submissionData,
          specialty: formData.specialty,
          license_number: formData.license_number,
        };
      } else if (role === 'patient') {
        submissionData = {
          ...submissionData,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
        };
      }

      console.log('🚀 Starting enhanced signup process...');
      setProfileStatus({ step: 'auth', message: 'Đang tạo tài khoản xác thực...' });

      await signUp(submissionData);

      setProfileStatus({ step: 'complete', message: 'Đăng ký thành công!' });
      setSuccess('Đăng ký thành công! Hồ sơ người dùng đã được tạo. Vui lòng kiểm tra email để xác thực tài khoản.');

      // Show success for a moment then redirect
      setTimeout(() => {
        router.push('/auth/login?message=' + encodeURIComponent('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.') + '&from_register=true');
      }, 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
      setProfileStatus({ step: 'auth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (profileStatus.step) {
      case 'auth':
        return isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null;
      case 'profile':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (profileStatus.message) return profileStatus.message;
    
    switch (profileStatus.step) {
      case 'auth':
        return isSubmitting ? 'Đang tạo tài khoản...' : '';
      case 'profile':
        return 'Đang tạo hồ sơ người dùng...';
      case 'complete':
        return 'Hoàn tất đăng ký!';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Đăng ký tài khoản
        </CardTitle>
        <CardDescription className="text-center">
          Tạo tài khoản mới để sử dụng hệ thống bệnh viện
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {/* Status indicator */}
          {isSubmitting && (
            <Alert>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <AlertDescription>{getStatusMessage()}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@hospital.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                disabled={isSubmitting || loading}
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ít nhất 6 ký tự"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  disabled={isSubmitting || loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  disabled={isSubmitting || loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="0123456789"
                value={formData.phone_number}
                onChange={handleInputChange}
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange('role', value)}
                disabled={isSubmitting || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Bệnh nhân</SelectItem>
                  <SelectItem value="doctor">Bác sĩ</SelectItem>
                  <SelectItem value="nurse">Y tá</SelectItem>
                  <SelectItem value="receptionist">Lễ tân</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role-specific fields - Same as original */}
          {formData.role === 'doctor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Chuyên khoa *</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  type="text"
                  placeholder="Nội khoa, Ngoại khoa..."
                  value={formData.specialty}
                  onChange={handleInputChange}
                  disabled={isSubmitting || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">Số giấy phép hành nghề *</Label>
                <Input
                  id="license_number"
                  name="license_number"
                  type="text"
                  placeholder="GP123456"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="text-blue-600 hover:text-blue-800 underline"
                disabled={isSubmitting || loading}
              >
                Đăng nhập ngay
              </button>
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
