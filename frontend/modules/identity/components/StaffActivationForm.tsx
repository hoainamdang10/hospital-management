'use client';

/**
 * Staff Activation Form Component
 * Handles staff account activation from invitation link
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { acceptStaffInvitation, AcceptStaffInvitationRequest } from '../services/identityService';

export interface StaffActivationFormProps {
  invitationToken: string;
  onSuccess?: (data: { userId: string; email: string; role: string }) => void;
  onError?: (error: string) => void;
}

export function StaffActivationForm({ invitationToken, onSuccess, onError }: StaffActivationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Phone number validation (optional but must be valid if provided)
    if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }

    // Password validation
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    // Password strength check
    if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
    setSuccessMessage('');

    try {
      const request: AcceptStaffInvitationRequest = {
        invitationToken,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
      };

      const result = await acceptStaffInvitation(request);

      if (result.success && result.userId && result.email && result.role) {
        setSuccessMessage(result.message || 'Tài khoản đã được kích hoạt thành công!');
        onSuccess?.({ userId: result.userId, email: result.email, role: result.role });
      } else {
        throw new Error(result.error || 'Kích hoạt tài khoản thất bại');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kích hoạt tài khoản thất bại';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (successMessage) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Kích hoạt thành công!</h3>
        <p className="text-neutral-600 mb-6">{successMessage}</p>
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
        >
          Đăng nhập ngay
        </a>
      </div>
    );
  }

  return (
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
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.fullName ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="Nguyễn Văn A"
          disabled={isLoading}
          autoComplete="name"
        />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
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

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
          Mật khẩu <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.password ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số"
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          Xác nhận mật khẩu <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand ${
            errors.confirmPassword ? 'border-red-500' : 'border-neutral-300'
          }`}
          placeholder="Nhập lại mật khẩu"
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
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
        {isLoading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
      </button>

      {/* Security Note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Sau khi kích hoạt thành công, bạn có thể đăng nhập bằng email và mật khẩu vừa tạo.
        </p>
      </div>
    </form>
  );
}
