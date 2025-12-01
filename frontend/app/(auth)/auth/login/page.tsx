'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page
 * Route: /login
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoginLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      // Error already handled in AuthContext
      console.error('[LoginPage] Login failed:', error);
    }
  };

  const handleSignUpClick = () => {
    router.push(ROUTES.REGISTER);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
    >
      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg"
          >
            <Loader2 className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chào mừng trở lại!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Đăng nhập để tiếp tục quản lý sức khỏe của bạn
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex rounded-xl bg-gray-100/80 p-1.5 relative">
          <button
            onClick={() => setActiveTab('signin')}
            className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200 ${activeTab === 'signin' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={handleSignUpClick}
            className={`relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-200 ${activeTab === 'signup' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Đăng ký
          </button>
          <motion.div
            className="absolute inset-y-1.5 rounded-lg bg-white shadow-sm"
            initial={false}
            animate={{
              left: activeTab === 'signin' ? '0.375rem' : '50%',
              width: 'calc(50% - 0.375rem)',
              x: activeTab === 'signin' ? 0 : 0 // Reset x to avoid conflict with left/width calculation if needed, but here simple left is enough
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pl-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              />
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            {errors.email && (
              <p className="ml-1 text-xs font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">Mật khẩu</label>
            <div className="relative group">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="ml-1 text-xs font-medium text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                />
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Ghi nhớ đăng nhập</span>
            </label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoginLoading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoginLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <button
              onClick={handleSignUpClick}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href={ROUTES.HOME} className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
