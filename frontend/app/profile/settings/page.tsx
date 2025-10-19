'use client';

/**
 * Profile Settings Page
 * User can edit their own profile information
 * 
 * URL: /profile/settings
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as identityService from '@/modules/identity/services/identityService';
import type { User } from '@/modules/identity/types';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      router.push('/login?redirect=/profile/settings');
      return;
    }

    setAccessToken(token);
    loadUserProfile(userId, token);
  }, [router]);

  const loadUserProfile = async (userId: string, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const userData = await identityService.getUser(userId, token);
      setUser(userData);
      setFormData({
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accessToken) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updatedUser = await identityService.updateUser(user.id, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
      }, accessToken);

      setUser(updatedUser);
      setSuccess('Cập nhật thông tin thành công!');

      // Update localStorage
      localStorage.setItem('userName', updatedUser.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      DOCTOR: 'bg-green-100 text-green-800',
      NURSE: 'bg-cyan-100 text-cyan-800',
      RECEPTIONIST: 'bg-yellow-100 text-yellow-800',
      PATIENT: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Quản trị viên cấp cao',
      ADMIN: 'Quản trị viên',
      DOCTOR: 'Bác sĩ',
      NURSE: 'Y tá',
      RECEPTIONIST: 'Lễ tân',
      PATIENT: 'Bệnh nhân',
    };
    return labels[role] || role;
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

  if (error && !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Lỗi</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Link href="/dashboard" className="btn-primary">
              Quay lại Dashboard
            </Link>
          </div>
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
              <h1 className="text-3xl font-bold text-neutral-900">Cài đặt hồ sơ</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Quản lý thông tin cá nhân của bạn
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
                  className="block px-4 py-2 rounded-lg bg-brand text-white"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  href="/profile/security"
                  className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
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
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Account Info */}
              <div className="mb-8 pb-8 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Thông tin tài khoản</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Email:</span>
                    <span className="text-sm text-neutral-900 font-medium">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Vai trò:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                      {getRoleLabel(user?.role || '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Trạng thái:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Email đã xác thực:</span>
                    <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {user?.emailVerified ? 'Có' : 'Chưa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-semibold text-neutral-900">Chỉnh sửa thông tin</h2>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        fullName: user?.fullName || '',
                        phoneNumber: user?.phoneNumber || '',
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                    className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

