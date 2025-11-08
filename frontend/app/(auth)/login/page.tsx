'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  mfaCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page
 * Route: /login
 */
export default function LoginPage() {
  const { login, isLoginLoading } = useAuth();
  const [showMfa, setShowMfa] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng bạn trở lại với Hospital Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="example@hospital.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* MFA Code (conditional) */}
            {showMfa && (
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700">
                  Mã xác thực 2FA
                </label>
                <input
                  {...register('mfaCode')}
                  type="text"
                  id="mfaCode"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="123456"
                />
              </div>
            )}
          </div>

          {/* Remember & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link
              href={ROUTES.LOGIN.replace('/login', '/forgot-password')}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoginLoading}>
            {isLoginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href={ROUTES.REGISTER} className="font-medium text-primary hover:text-primary/80">
              Đăng ký ngay
            </Link>
          </p>
        </form>

        {/* Back to Home */}
        <div className="text-center">
          <Link href={ROUTES.HOME} className="text-sm text-gray-600 hover:text-gray-900">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
