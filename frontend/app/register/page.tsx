import Link from 'next/link';
import { RegisterForm } from '@/modules/identity/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">
            Đăng ký tài khoản
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Tạo tài khoản mới để sử dụng hệ thống
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <RegisterForm defaultRole="patient" />
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="font-medium text-brand hover:text-brand/90 hover:underline"
            >
              Đăng nhập ngay
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

