'use client';

/**
 * Security Settings Page
 * User can change password and manage MFA
 * 
 * URL: /profile/security
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as identityService from '@/modules/identity/services/identityService';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaQR, setShowMfaQR] = useState(false);
  const [mfaQRCode, setMfaQRCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const uid = localStorage.getItem('userId');

    if (!token || !uid) {
      router.push('/login?redirect=/profile/security');
      return;
    }

    setAccessToken(token);
    setUserId(uid);
    setLoading(false);
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !accessToken) return;

    setError(null);
    setSuccess(null);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    setSaving(true);

    try {
      await identityService.changePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }, accessToken);

      setSuccess('Đổi mật khẩu thành công!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableMFA = async () => {
    if (!userId || !accessToken) return;

    setError(null);
    setSaving(true);

    try {
      const result = await identityService.enableMFA(userId, accessToken);
      setMfaQRCode(result.qrCode);
      setMfaSecret(result.secret);
      setShowMfaQR(true);
      setMfaEnabled(true);
      setSuccess('MFA đã được kích hoạt. Vui lòng quét mã QR bằng ứng dụng xác thực.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kích hoạt MFA');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!userId || !accessToken) return;

    const password = prompt('Nhập mật khẩu để tắt MFA:');
    if (!password) return;

    setError(null);
    setSaving(true);

    try {
      await identityService.disableMFA(userId, password, accessToken);
      setMfaEnabled(false);
      setShowMfaQR(false);
      setSuccess('MFA đã được tắt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tắt MFA');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-neutral-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Bảo mật</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Quản lý mật khẩu và xác thực hai yếu tố
              </p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Menu</h2>
              <nav className="space-y-2">
                <Link
                  href="/profile/settings"
                  className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/profile/security"
                  className="block px-4 py-2 rounded-lg bg-brand text-white"
                >
                  Bảo mật
                </Link>
                <Link
                  href="/profile/sessions"
                  className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Phiên đăng nhập
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Đổi mật khẩu</h2>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Tối thiểu 8 ký tự</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>

            {/* MFA Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Xác thực hai yếu tố (MFA)</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Tăng cường bảo mật tài khoản bằng cách yêu cầu mã xác thực khi đăng nhập.
              </p>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Trạng thái MFA</p>
                  <p className="text-sm text-neutral-500">
                    {mfaEnabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                  </p>
                </div>
                <button
                  onClick={mfaEnabled ? handleDisableMFA : handleEnableMFA}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    mfaEnabled
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-brand text-white hover:bg-brand/90'
                  }`}
                >
                  {saving ? 'Đang xử lý...' : mfaEnabled ? 'Tắt MFA' : 'Kích hoạt MFA'}
                </button>
              </div>

              {/* MFA QR Code */}
              {showMfaQR && mfaQRCode && (
                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-4">Quét mã QR</h3>
                  <div className="bg-neutral-50 p-6 rounded-lg text-center">
                    <img src={mfaQRCode} alt="MFA QR Code" className="mx-auto mb-4" />
                    <p className="text-xs text-neutral-600 mb-2">Hoặc nhập mã thủ công:</p>
                    <code className="text-sm bg-white px-4 py-2 rounded border border-neutral-300 inline-block">
                      {mfaSecret}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

