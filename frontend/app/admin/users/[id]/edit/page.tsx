'use client';

/**
 * Admin User Edit Page
 * Form to edit user information, roles, and permissions
 * 
 * URL: /admin/users/:id/edit
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import * as identityService from '@/modules/identity/services/identityService';
import type { User } from '@/modules/identity/types';

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    isActive: true,
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
      router.push('/login?redirect=/admin/users');
      return;
    }

    // Check if user is admin
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      setError('Bạn không có quyền truy cập trang này.');
      setLoading(false);
      return;
    }

    setAccessToken(token);
  }, [router]);

  useEffect(() => {
    if (accessToken && userId) {
      loadUser();
    }
  }, [accessToken, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await identityService.getUser(userId, accessToken!);
      setUser(userData);
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        isActive: userData.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      await identityService.updateUser(userId, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        isActive: formData.isActive,
      }, accessToken!);

      setSuccess('Cập nhật thông tin người dùng thành công!');
      
      // Reload user data
      await loadUser();

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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

  if (error && !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Lỗi</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Link href="/admin/users" className="btn-primary">
              Quay lại danh sách
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
              <h1 className="text-3xl font-bold text-neutral-900">Chỉnh sửa người dùng</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Cập nhật thông tin cho: {user?.fullName}
              </p>
            </div>
            <Link href="/admin/users" className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors">
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-neutral-500">Email không thể thay đổi</p>
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

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Chọn vai trò</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="DOCTOR">Bác sĩ</option>
                <option value="NURSE">Y tá</option>
                <option value="RECEPTIONIST">Lễ tân</option>
                <option value="PATIENT">Bệnh nhân</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-brand focus:ring-brand border-neutral-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-neutral-700">
                Tài khoản đang hoạt động
              </label>
            </div>

            {/* User Info */}
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">Thông tin tài khoản</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">ID:</span>
                  <span className="ml-2 text-neutral-900 font-mono">{user?.id}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email đã xác thực:</span>
                  <span className={`ml-2 ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.emailVerified ? 'Có' : 'Chưa'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Ngày tạo:</span>
                  <span className="ml-2 text-neutral-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Lần đăng nhập cuối:</span>
                  <span className="ml-2 text-neutral-900">
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-neutral-200">
              <Link
                href="/admin/users"
                className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Hủy
              </Link>
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
  );
}

