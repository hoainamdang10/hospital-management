'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

/**
 * Email Verification Page
 * Route: /verify-email
 */
export default function VerifyEmailPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Đang xác thực email...
            </h2>
            <p className="mt-2 text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* Pending State - Just Registered */}
        {status === 'pending' && (
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="text-center">
              <Mail className="mx-auto h-16 w-16 text-primary" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Kiểm tra email của bạn
              </h2>
              <p className="mt-2 text-gray-600">
                Chúng tôi đã gửi email xác thực đến
              </p>
              <p className="mt-1 font-semibold text-gray-900">{email}</p>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>📧 Hướng dẫn:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 list-disc list-inside">
                <li>Mở email và nhấn vào link xác thực</li>
                <li>Link có hiệu lực trong 24 giờ</li>
                <li>Kiểm tra cả thư mục spam nếu không thấy email</li>
              </ul>
            </div>

            <div className="mt-6 space-y-4">
              <Button
                onClick={handleResend}
                disabled={resending}
                variant="outline"
                className="w-full"
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
                Đã xác thực email?{' '}
                <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary/80">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Xác thực email thành công!
            </h2>
            <p className="mt-2 text-gray-600">
              Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <div className="mt-6">
              <Link href={ROUTES.LOGIN}>
                <Button className="w-full">Đăng nhập</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error State / Resend Form */}
        {status === 'error' && (
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="text-center">
              {token ? (
                <>
                  <XCircle className="mx-auto h-16 w-16 text-red-500" />
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Xác thực thất bại
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Link xác thực không hợp lệ hoặc đã hết hạn.
                  </p>
                </>
              ) : (
                <>
                  <Mail className="mx-auto h-16 w-16 text-primary" />
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Xác thực email
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Nhập email của bạn để nhận lại link xác thực
                  </p>
                </>
              )}
            </div>

            {/* Resend Form */}
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="example@email.com"
                />
              </div>

              <Button
                onClick={handleResend}
                disabled={!email || resending}
                className="w-full"
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
                <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary/80">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        )}

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
