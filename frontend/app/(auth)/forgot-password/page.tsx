'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { authService } from '@/lib/api/auth.service';

/**
 * Forgot Password Page
 * Route: /forgot-password
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string; error?: string } } })
        .response;
      if (response?.data?.message) return response.data.message;
      if (response?.data?.error) return response.data.error;
    }
    if (err instanceof Error) return err.message;
    return 'Không thể gửi yêu cầu, vui lòng thử lại.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email: normalizedEmail });
      setSuccessMessage(
        response?.message ??
        'Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.'
      );
      setIsSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
      >
        <div className="p-8 sm:p-10 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-inner"
          >
            <Mail className="h-10 w-10 text-green-600" />
          </motion.div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Kiểm tra email của bạn</h2>
          <p className="mb-8 text-gray-600 leading-relaxed">
            {successMessage || (
              <>
                Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong className="text-gray-900">{email}</strong>
              </>
            )}
          </p>
          <p className="mb-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
            Nếu bạn không nhận được email trong vài phút, vui lòng kiểm tra thư mục spam.
          </p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
    >
      <div className="p-8 sm:p-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg"
          >
            <Mail className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Quên mật khẩu?</h2>
          <p className="mt-2 text-gray-600">Nhập email của bạn để nhận link đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pl-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link href={ROUTES.LOGIN} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
