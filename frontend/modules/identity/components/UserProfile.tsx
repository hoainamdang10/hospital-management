'use client';

/**
 * User Profile Component
 * Displays and edits user information
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import React from 'react';
import type { UserProfileProps } from '../types';

export function UserProfile({ user, onUpdate, editable = false }: UserProfileProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{user.fullName}</h2>
          <p className="text-neutral-600 mt-1">{user.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      </div>

      {/* User Information */}
      <div className="space-y-4">
        {/* Phone Number */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
          <span className="text-sm font-medium text-neutral-700">Số điện thoại</span>
          <span className="text-sm text-neutral-900">{user.phoneNumber}</span>
        </div>

        {/* Email Verification Status */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
          <span className="text-sm font-medium text-neutral-700">Trạng thái email</span>
          <span className={`text-sm ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
            {user.emailVerified ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
          </span>
        </div>

        {/* Account Status */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
          <span className="text-sm font-medium text-neutral-700">Trạng thái tài khoản</span>
          <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {user.isActive ? '✓ Hoạt động' : '✗ Bị khóa'}
          </span>
        </div>

        {/* Created Date */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
          <span className="text-sm font-medium text-neutral-700">Ngày tạo tài khoản</span>
          <span className="text-sm text-neutral-900">{formatDate(user.createdAt)}</span>
        </div>

        {/* Last Login */}
        {user.lastLoginAt && (
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm font-medium text-neutral-700">Đăng nhập lần cuối</span>
            <span className="text-sm text-neutral-900">{formatDate(user.lastLoginAt)}</span>
          </div>
        )}

        {/* User ID */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-medium text-neutral-700">ID người dùng</span>
          <span className="text-xs text-neutral-500 font-mono">{user.id}</span>
        </div>
      </div>

      {/* Edit Button */}
      {editable && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <button
            onClick={() => onUpdate?.(user)}
            className="w-full bg-brand text-white py-3 px-6 rounded-lg font-medium hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors"
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      )}
    </div>
  );
}

