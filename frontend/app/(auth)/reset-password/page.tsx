'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { authService } from '@/lib/api/auth.service';

type TokenState = {
  accessToken?: string;
  refreshToken?: string;
  error?: string | null;
  errorDescription?: string | null;
  initialized: boolean;
};

/**
 * Reset Password Page
 * Route: /reset-password?token=xxx
 */
function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const [tokenState, setTokenState] = useState<TokenState>({ initialized: false });

  useEffect(() => {
    let accessToken = searchParams?.get('access_token') ?? searchParams?.get('token') ?? '';
    let refreshToken = searchParams?.get('refresh_token') ?? '';
    let error = searchParams?.get('error') ?? null;
    let errorDescription = searchParams?.get('error_description') ?? null;

    if (typeof window !== 'undefined' && window.location.hash?.startsWith('#')) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      accessToken = hashParams.get('access_token') ?? accessToken;
      refreshToken = hashParams.get('refresh_token') ?? refreshToken;
      error = hashParams.get('error') ?? error;
      errorDescription = hashParams.get('error_description') ?? errorDescription;
    }

    setTokenState({
      accessToken: accessToken || undefined,
      refreshToken: refreshToken || undefined,
      error,
      errorDescription,
      initialized: true,
    });
  }, [searchParams]);

  const hasValidTokens = Boolean(
    tokenState.accessToken && tokenState.refreshToken && !tokenState.error
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string; error?: string } } })
        .response;
      if (response?.data?.message) return response.data.message;
      if (response?.data?.error) return response.data.error;
    }
    if (err instanceof Error) return err.message;
    return 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tokenState.accessToken || !tokenState.refreshToken) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        accessToken: tokenState.accessToken,
        refreshToken: tokenState.refreshToken,
        newPassword: password,
        confirmPassword,
      });
      setServerMessage(
        response?.message ??
          'Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.'
      );
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenState.initialized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-8 text-center sm:p-10">
          <p className="text-gray-600">Đang kiểm tra đường dẫn đặt lại mật khẩu...</p>
        </div>
      </motion.div>
    );
  }

  if (!hasValidTokens) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-8 text-center sm:p-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {tokenState.error === 'access_denied' ? 'Link đã hết hạn' : 'Link không hợp lệ'}
          </h2>
          <p className="mb-8 text-gray-600">
            {tokenState.errorDescription ||
              'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại từ trang Quên mật khẩu.'}
          </p>
          <Link href={ROUTES.FORGOT_PASSWORD}>
            <Button className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30">
              Yêu cầu link mới
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl"
      >
        <div className="p-8 text-center sm:p-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-inner"
          >
            <CheckCircle className="h-10 w-10 text-green-600" />
          </motion.div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Đặt lại mật khẩu thành công!</h2>
          <p className="mb-8 leading-relaxed text-gray-600">
            {serverMessage ||
              'Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.'}
          </p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30">
              Đăng nhập ngay
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
      className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl"
    >
      <div className="p-8 sm:p-10">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg"
          >
            <Lock className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-gray-600">Nhập mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="ml-1 text-xs font-semibold tracking-wider text-gray-700 uppercase"
            >
              Mật khẩu mới
            </label>
            <div className="group relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pr-12 pl-12 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 ml-1 text-xs text-gray-500">Tối thiểu 8 ký tự</p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="ml-1 text-xs font-semibold tracking-wider text-gray-700 uppercase"
            >
              Xác nhận mật khẩu
            </label>
            <div className="group relative">
              <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pr-12 pl-12 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-blue-500/50 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-sm text-gray-600">Đang tải form đặt lại mật khẩu...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
