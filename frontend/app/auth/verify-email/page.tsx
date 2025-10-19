'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      // Auto-verify if token is present
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('loading');
    try {
      const response = await fetch(`http://localhost:3021/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email đã được xác thực thành công!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Xác thực email thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Lỗi kết nối. Vui lòng thử lại sau.');
    }
  };

  // If no token, show "Check your email" page
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            {/* Email Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Kiểm tra email của bạn
            </h1>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi email xác thực đến:
            </p>
            {email && (
              <p className="text-lg font-semibold text-blue-600 mb-6">
                {email}
              </p>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Bước tiếp theo:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Mở email từ Hospital Management System</li>
                <li>Click vào link xác thực trong email</li>
                <li>Quay lại trang đăng nhập</li>
              </ol>
            </div>

            {/* Resend Email */}
            <ResendEmailButton email={email} />

            {/* Back to Login */}
            <div className="pt-4 border-t">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If token is present, show verification status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đang xác thực email...
              </h1>
              <p className="text-gray-600">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Xác thực thành công!
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Xác thực thất bại
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/verify-email"
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Gửi lại email xác thực
                </Link>
                <Link
                  href="/login"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResendEmailButton({ email }: { email: string | null }) {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    if (!email) {
      setResendMessage('Email không hợp lệ');
      return;
    }

    setResending(true);
    setResendMessage('');

    try {
      const response = await fetch('http://localhost:3021/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendMessage('✅ Email đã được gửi lại. Vui lòng kiểm tra hộp thư.');
      } else {
        setResendMessage('❌ ' + (data.message || 'Gửi email thất bại. Vui lòng thử lại.'));
      }
    } catch (error) {
      setResendMessage('❌ Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleResend}
        disabled={resending || !email}
        className="text-blue-600 hover:text-blue-700 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {resending ? 'Đang gửi...' : 'Không nhận được email? Gửi lại'}
      </button>
      {resendMessage && (
        <p className="text-sm mt-2 text-gray-600">
          {resendMessage}
        </p>
      )}
    </div>
  );
}

