'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Mail, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với điều khoản sử dụng',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Register Page
 * Route: /register
 */
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isRegisterLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, acceptTerms, ...rest } = data;
    registerUser(rest);
  };

  const handleSignInClick = () => {
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản mới</h1>
          <p className="mt-2 text-sm text-gray-500">
            Đăng ký để bắt đầu sử dụng dịch vụ
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 relative">
          <button
            onClick={handleSignInClick}
            className={`flex-1 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 relative z-10 ${
              activeTab === 'signin'
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 relative z-10 ${
              activeTab === 'signup'
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Đăng ký
          </button>
          {/* Animated background */}
          <motion.div
            className="absolute top-0 h-full rounded-full bg-blue-600"
            initial={false}
            animate={{
              left: activeTab === 'signin' ? '0%' : '50%',
              width: '50%',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        </div>

        {/* Register Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Full Name */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <input
              {...register('fullName')}
              type="text"
              placeholder="Nhập họ và tên"
              className="w-full rounded-full border border-gray-300 bg-white px-5 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            {errors.fullName && (
              <p className="mt-1 px-5 text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </motion.div>

          {/* Email */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <input
              {...register('email')}
              type="email"
              placeholder="Nhập email của bạn"
              className="w-full rounded-full border border-gray-300 bg-white px-5 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            {errors.email && (
              <p className="mt-1 px-5 text-xs text-red-600">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-full border border-gray-300 bg-white px-5 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {errors.password && (
              <p className="mt-1 px-5 text-xs text-red-600">{errors.password.message}</p>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              className="w-full rounded-full border border-gray-300 bg-white px-5 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {errors.confirmPassword && (
              <p className="mt-1 px-5 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </motion.div>

          {/* Terms Acceptance */}
          <motion.div
            className="flex items-start gap-2 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <input
              {...register('acceptTerms')}
              type="checkbox"
              id="acceptTerms"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600">
              Tôi đồng ý với{' '}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Chính sách bảo mật
              </Link>
            </label>
          </motion.div>
          {errors.acceptTerms && (
            <p className="px-5 text-xs text-red-600">{errors.acceptTerms.message}</p>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isRegisterLoading}
            className="w-full rounded-full bg-blue-600 px-6 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRegisterLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đăng ký...
              </span>
            ) : (
              'Đăng ký'
            )}
          </motion.button>
        </motion.form>

        {/* Back to Home */}
        <div className="text-center">
          <Link href={ROUTES.HOME} className="text-sm text-gray-500 hover:text-gray-700">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
