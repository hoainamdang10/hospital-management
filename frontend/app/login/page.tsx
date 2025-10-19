'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/modules/identity/components/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Hệ thống Quản lý Bệnh viện V2
          </p>
        </div>

        {/* Success Message */}
        {verified === 'true' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>✅ Email đã được xác thực thành công! Vui lòng đăng nhập.</span>
            </div>
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <LoginForm />
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="font-medium text-brand hover:text-brand/90 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

