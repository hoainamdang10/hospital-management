'use client';

/**
 * Reset Password Page
 * User can reset password with token from email
 * 
 * URL: /auth/reset-password?token=xxx
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as identityService from '@/modules/identity/services/identityService';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (!token) {
      setError('Token không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      await identityService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Đặt lại mật khẩu thành công</h2>
              <p className="text-neutral-600 mb-6">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link href="/login" className="btn-primary block">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Đặt lại mật khẩu</h1>
          <p className="text-neutral-600">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <p className="text-neutral-600 mb-6">
                Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.
              </p>
              <Link href="/auth/forgot-password" className="btn-primary block">
                Yêu cầu đặt lại mật khẩu
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Mật khẩu phải có ít nhất 8 ký tự
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-700">Độ mạnh mật khẩu:</p>
                  <div className="flex space-x-1">
                    <div className={`h-2 flex-1 rounded ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-neutral-200'}`}></div>
                    <div className={`h-2 flex-1 rounded ${newPassword.length >= 12 ? 'bg-green-500' : 'bg-neutral-200'}`}></div>
                    <div className={`h-2 flex-1 rounded ${/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-neutral-200'}`}></div>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {newPassword.length < 8 && 'Yếu - Cần ít nhất 8 ký tự'}
                    {newPassword.length >= 8 && newPassword.length < 12 && 'Trung bình - Nên có ít nhất 12 ký tự'}
                    {newPassword.length >= 12 && !/[A-Z]/.test(newPassword) && 'Khá - Nên có chữ hoa'}
                    {newPassword.length >= 12 && /[A-Z]/.test(newPassword) && !/[0-9]/.test(newPassword) && 'Khá - Nên có số'}
                    {newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && 'Mạnh'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-brand hover:text-brand/80">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Lưu ý bảo mật:</strong> Sau khi đặt lại mật khẩu, tất cả các phiên đăng nhập
            hiện tại sẽ bị đăng xuất. Bạn cần đăng nhập lại bằng mật khẩu mới.
          </p>
        </div>
      </div>
    </div>
  );
}

