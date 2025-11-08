'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

/**
 * Forgot Password Page
 * Route: /forgot-password
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Call API to send reset password email
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Kiểm tra email của bạn
            </h2>
            <p className="mb-6 text-gray-600">
              Chúng tôi đã gửi link đặt lại mật khẩu đến email <strong>{email}</strong>
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Nếu bạn không nhận được email trong vài phút, vui lòng kiểm tra thư mục spam.
            </p>
            <Link href={ROUTES.LOGIN}>
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Quên mật khẩu?</h2>
          <p className="mt-2 text-gray-600">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={ROUTES.LOGIN}
              className="text-sm text-primary hover:text-primary/80"
            >
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
