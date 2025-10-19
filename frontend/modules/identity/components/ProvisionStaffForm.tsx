'use client';

/**
 * Provision Staff Form Component
 * Admin creates staff invitation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { provisionStaff, ProvisionStaffRequest } from '../services/identityService';

export interface ProvisionStaffFormProps {
  accessToken: string;
  onSuccess?: (data: { invitationUrl: string; expiresAt: string }) => void;
  onError?: (error: string) => void;
}

const STAFF_ROLES = [
  { value: 'ADMIN', label: 'Quản trị viên', description: 'Quản lý hệ thống' },
  { value: 'DOCTOR', label: 'Bác sĩ', description: 'Khám và điều trị bệnh nhân' },
  { value: 'NURSE', label: 'Y tá', description: 'Chăm sóc bệnh nhân' },
  { value: 'RECEPTIONIST', label: 'Lễ tân', description: 'Tiếp nhận và hướng dẫn bệnh nhân' },
] as const;

export function ProvisionStaffForm({ accessToken, onSuccess, onError }: ProvisionStaffFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    roleType: 'DOCTOR' as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [invitationResult, setInvitationResult] = useState<{
    invitationUrl: string;
    expiresAt: string;
  } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Full name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Phone number validation (optional but must be valid if provided)
    if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const request: ProvisionStaffRequest = {
        email: formData.email,
        fullName: formData.fullName,
        roleType: formData.roleType,
        phoneNumber: formData.phoneNumber || undefined,
      };

      const result = await provisionStaff(request, accessToken);

      if (result.success && result.invitationUrl && result.expiresAt) {
        setInvitationResult({
          invitationUrl: result.invitationUrl,
          expiresAt: result.expiresAt,
        });
        onSuccess?.({ invitationUrl: result.invitationUrl, expiresAt: result.expiresAt });
        
        // Reset form
        setFormData({
          email: '',
          fullName: '',
          roleType: 'DOCTOR',
          phoneNumber: '',
        });
      } else {
        throw new Error(result.error || 'Tạo lời mời thất bại');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tạo lời mời thất bại';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Đã sao chép link kích hoạt!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (invitationResult) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">Tạo lời mời thành công!</h3>
          <p className="text-neutral-600">Email kích hoạt đã được gửi đến nhân viên.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Link kích hoạt:</h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={invitationResult.invitationUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm"
            />
            <button
              onClick={() => copyToClipboard(invitationResult.invitationUrl)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Sao chép
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Hết hạn:</strong> {formatExpiryDate(invitationResult.expiresAt)}
          </p>
        </div>

        <button
          onClick={() => setInvitationResult(null)}
          className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          Tạo lời mời mới
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.email ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="staff@hospital.vn"
          disabled={isLoading}
          autoComplete="email"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

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
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.fullName ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="Nguyễn Văn A"
          disabled={isLoading}
          autoComplete="name"
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
      </div>

      {/* Role Type */}
      <div>
        <label htmlFor="roleType" className="block text-sm font-medium text-neutral-700 mb-2">
          Vai trò <span className="text-red-500">*</span>
        </label>
        <select
          id="roleType"
          name="roleType"
          value={formData.roleType}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          disabled={isLoading}
        >
          {STAFF_ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label} - {role.description}
            </option>
          ))}
        </select>
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 mb-2">
          Số điện thoại
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.phoneNumber ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="0912345678"
          disabled={isLoading}
          autoComplete="tel"
        />
        {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Đang tạo lời mời...' : 'Tạo lời mời'}
      </button>

      {/* Info Note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Email kích hoạt sẽ được gửi tự động đến địa chỉ email của nhân viên. 
          Link kích hoạt có hiệu lực trong 7 ngày.
        </p>
      </div>
    </form>
  );
}
