'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

/**
 * Email Verification Page Content
 * Route: /verify-email
 */
function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const emailParam = searchParams?.get('email');
  const { verifyEmail, resendVerification } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [email, setEmail] = useState(emailParam || '');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        // Verify email with token from URL
        try {
          setStatus('loading');
          await verifyEmail(token);
          setStatus('success');
        } catch (error) {
          setStatus('error');
        }
      } else if (emailParam) {
        // Just registered, show pending verification message
        setStatus('pending');
      } else {
        // No token or email, show resend form
        setStatus('error');
      }
    };

    verify();
  }, [token, emailParam, verifyEmail]);

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    try {
      await resendVerification(email);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
    >
      <div className="p-8 sm:p-10">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50"
            >
              <Loader2 className="h-8 w-8 text-blue-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900">Đang xác thực email...</h2>
            <p className="mt-2 text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* Pending State - Just Registered */}
        {status === 'pending' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 shadow-inner"
            >
              <Mail className="h-10 w-10 text-blue-600" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Kiểm tra email của bạn</h2>
            <p className="text-gray-600">Chúng tôi đã gửi email xác thực đến</p>
            <p className="mt-1 mb-6 font-bold text-gray-900 bg-blue-50 py-2 px-4 rounded-lg inline-block">{email}</p>

            <div className="mb-8 rounded-xl bg-blue-50/50 border border-blue-100 p-5 text-left">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📧 Hướng dẫn:
              </p>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-blue-800">
                <li>Mở email và nhấn vào link xác thực</li>
                <li>Link có hiệu lực trong 24 giờ</li>
                <li>Kiểm tra cả thư mục spam nếu không thấy email</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResend}
                disabled={resending}
                variant="outline"
                className="w-full rounded-xl py-6 border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi lại email xác thực'
                )}
              </Button>

              <p className="text-sm text-gray-600">
                Đã xác thực email?{' '}
                <Link
                  href={ROUTES.LOGIN}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-inner"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900">Xác thực email thành công!</h2>
            <p className="mb-8 text-gray-600 leading-relaxed">
              Tài khoản của bạn đã được kích hoạt.<br />Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Link href={ROUTES.LOGIN}>
              <Button className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-6 text-base font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}

        {/* Error State / Resend Form */}
        {status === 'error' && (
          <div className="text-center">
            {token ? (
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 shadow-inner"
                >
                  <XCircle className="h-10 w-10 text-red-600" />
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Xác thực thất bại</h2>
                <p className="text-gray-600">Link xác thực không hợp lệ hoặc đã hết hạn.</p>
              </div>
            ) : (
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 shadow-inner"
                >
                  <Mail className="h-10 w-10 text-blue-600" />
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Xác thực email</h2>
                <p className="text-gray-600">Nhập email của bạn để nhận lại link xác thực</p>
              </div>
            )}

            {/* Resend Form */}
            <div className="space-y-6 text-left">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-wider ml-1">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pl-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <Button
                onClick={handleResend}
                disabled={!email || resending}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi lại email xác thực'
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  href={ROUTES.LOGIN}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href={ROUTES.HOME} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
            <p className="mt-4 text-sm text-gray-600">Đang tải thông tin xác thực...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
