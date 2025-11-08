'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export default function ActivateStaffPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    // TODO: Call API
    setTimeout(() => setIsSuccess(true), 1000);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Link không hợp lệ</h2>
          <p className="mb-6 text-gray-600">Link kích hoạt không hợp lệ hoặc đã hết hạn.</p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="mb-2 mt-4 text-2xl font-bold text-gray-900">Kích hoạt thành công!</h2>
          <p className="mb-6 text-gray-600">Tài khoản của bạn đã được kích hoạt.</p>
          <Link href={ROUTES.LOGIN}>
            <Button className="w-full">Đăng nhập ngay</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Kích hoạt tài khoản</h2>
          <p className="mt-2 text-gray-600">Đặt mật khẩu để kích hoạt tài khoản nhân viên</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">Kích hoạt tài khoản</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
