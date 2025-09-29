'use client';

// =====================================================
// DOCTOR REGISTRATION FORM - SỬ DỤNG ENUM ĐỘNG
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  useGenderEnums,
  useDoctorStatusEnums,
  useSpecialtyOptions,
  useDepartmentOptions,
} from '@/lib/contexts/EnumContext';
import { doctorsApi } from '@/lib/supabase';

interface DoctorFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  specialization: string;
  departmentId: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  gender: string;
  status: string;
  bio: string;
  languagesSpoken: string[];
}

export function DoctorRegistrationForm() {
  // Sử dụng enum hooks
  const genderOptions = useGenderEnums();
  const statusOptions = useDoctorStatusEnums();
  const specialtyOptions = useSpecialtyOptions();
  const departmentOptions = useDepartmentOptions();

  // Debug: Log options to console
  useEffect(() => {
    console.log('🔍 DoctorRegistrationForm Debug:', {
      genderOptions,
      genderCount: genderOptions?.length || 0,
      statusOptions,
      statusCount: statusOptions?.length || 0,
      specialtyOptions,
      specialtyCount: specialtyOptions?.length || 0,
      departmentOptions,
      departmentCount: departmentOptions?.length || 0
    });
  }, [genderOptions, statusOptions, specialtyOptions, departmentOptions]);

  // Form state
  const [formData, setFormData] = useState<DoctorFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    specialization: '',
    departmentId: '',
    qualification: '',
    experienceYears: 0,
    consultationFee: 0,
    gender: '',
    status: 'active',
    bio: '',
    languagesSpoken: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!/^0\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại phải có 10 số và bắt đầu bằng 0';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Số giấy phép hành nghề là bắt buộc';
    } else if (!/^VN-[A-Z]{2}-\d{4}$/.test(formData.licenseNumber)) {
      newErrors.licenseNumber = 'Số giấy phép phải có định dạng VN-XX-0000';
    }

    if (!formData.specialization) {
      newErrors.specialization = 'Chuyên khoa là bắt buộc';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Khoa/Phòng ban là bắt buộc';
    }

    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Bằng cấp là bắt buộc';
    }

    if (!formData.gender) {
      newErrors.gender = 'Giới tính là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting doctor registration:', formData);

      // Prepare data for API call - map frontend fields to backend fields
      const doctorData = {
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        license_number: formData.licenseNumber,
        specialty: formData.specialization, // backend uses 'specialty' not 'specialization'
        department_id: formData.departmentId,
        qualification: formData.qualification,
        gender: formData.gender,
        status: formData.status,
        bio: formData.bio,
        experience_years: formData.experienceYears,
        consultation_fee: formData.consultationFee,
        // Add required fields for backend
        schedule: '{}', // Default empty schedule
      };

      console.log('Mapped doctor data:', doctorData);

      // Call Supabase API
      const result = await doctorsApi.addDoctor(doctorData);

      if (result.error) {
        console.error('API Error:', result.error);
        alert(`Lỗi đăng ký: ${result.error.message || result.error}`);
        return;
      }

      // Success
      const genderOption = genderOptions.find(opt => opt.value === formData.gender);
      const statusOption = statusOptions.find(opt => opt.value === formData.status);
      const specialtyOption = specialtyOptions.find(opt => opt.value === formData.specialization);
      const departmentOption = departmentOptions.find(opt => opt.value === formData.departmentId);

      alert(`Đăng ký thành công!\nChuyên khoa: ${specialtyOption?.label || formData.specialization}\nKhoa: ${departmentOption?.label || formData.departmentId}\nGiới tính: ${genderOption?.label || formData.gender}\nTrạng thái: ${statusOption?.label || formData.status}`);

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        licenseNumber: '',
        specialization: '',
        departmentId: '',
        qualification: '',
        experienceYears: 0,
        consultationFee: 0,
        gender: '',
        status: 'active',
        bio: '',
        languagesSpoken: [],
      });
      setErrors({});

    } catch (error) {
      console.error('Registration error:', error);
      alert(`Có lỗi xảy ra khi đăng ký: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof DoctorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Đăng ký Bác sĩ</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Nhập họ và tên"
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="doctor@hospital.vn"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0123456789"
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Số giấy phép hành nghề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="VN-TM-1234"
            />
            {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
          </div>
        </div>

        {/* Professional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Chuyên khoa <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => handleInputChange('specialization', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.specialization ? 'border-red-500' : 'border-gray-300'}`}
              title="Chọn chuyên khoa"
            >
              <option value="">Chọn chuyên khoa</option>
              {specialtyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Khoa/Phòng ban <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => handleInputChange('departmentId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
              title="Chọn khoa/phòng ban"
            >
              <option value="">Chọn khoa/phòng ban</option>
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.departmentId && <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bằng cấp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => handleInputChange('qualification', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.qualification ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Bác sĩ Y khoa, Thạc sĩ Y học..."
            />
            {errors.qualification && <p className="text-red-500 text-sm mt-1">{errors.qualification}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Số năm kinh nghiệm</label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.experienceYears}
              onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              title="Nhập số năm kinh nghiệm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phí khám (VNĐ)</label>
            <input
              type="number"
              min="0"
              value={formData.consultationFee}
              onChange={(e) => handleInputChange('consultationFee', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="500000"
            />
          </div>
        </div>

        {/* Enum Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
              title="Chọn giới tính"
            >
              <option value="">Chọn giới tính</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              title="Chọn trạng thái"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.isDefault && ' (Mặc định)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2">Tiểu sử</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Mô tả ngắn về kinh nghiệm và chuyên môn..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký Bác sĩ'}
          </button>
        </div>
      </form>
    </div>
  );
}
