'use client';

import { useState } from 'react';
import { User, Calendar, Droplet, Save, Edit2, X, Activity, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientProfile } from '@/lib/types/profile';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BasicInfoTabProps {
  profile: PatientProfile;
  onUpdate: (data: Partial<PatientProfile>) => Promise<void>;
}

const InfoCard = ({ title, icon: Icon, children, className }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300", className)}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </motion.div>
);

const Field = ({ label, value, icon: Icon, isEditing, name, type = "text", options, onChange }: any) => (
  <div className="group">
    <label className="block text-sm font-medium text-gray-500 mb-1.5 ml-1">
      {label}
    </label>
    {isEditing ? (
      type === "select" ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
          >
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
        />
      )
    ) : (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-transparent group-hover:border-gray-100 group-hover:bg-gray-50 transition-all">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span className="text-gray-900 font-medium">{value || '—'}</span>
      </div>
    )}
  </div>
);

export function BasicInfoTab({ profile, onUpdate }: BasicInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    bloodType: profile.bloodType || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Thông tin cơ bản</h3>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và hồ sơ y tế cơ bản</p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="rounded-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard title="Thông tin định danh" icon={Fingerprint}>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Họ và tên đệm"
                name="lastName"
                value={isEditing ? formData.lastName : profile.lastName}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <Field
                label="Tên"
                name="firstName"
                value={isEditing ? formData.firstName : profile.firstName}
                isEditing={isEditing}
                onChange={handleChange}
              />
            </div>
            <Field
              label="Ngày sinh"
              name="dateOfBirth"
              type="date"
              value={isEditing ? formData.dateOfBirth : (profile.dateOfBirth ? format(parseISO(profile.dateOfBirth), 'dd/MM/yyyy', { locale: vi }) : '')}
              icon={Calendar}
              isEditing={isEditing}
              onChange={handleChange}
            />
            <Field
              label="Giới tính"
              name="gender"
              type="select"
              value={isEditing ? formData.gender : genderLabels[profile.gender]}
              options={[
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
                { value: 'other', label: 'Khác' },
              ]}
              icon={User}
              isEditing={isEditing}
              onChange={handleChange}
            />
          </InfoCard>

          <InfoCard title="Thông tin sinh học" icon={Activity}>
            <Field
              label="Nhóm máu"
              name="bloodType"
              type="select"
              value={isEditing ? formData.bloodType : profile.bloodType}
              options={[
                { value: '', label: 'Chưa xác định' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              icon={Droplet}
              isEditing={isEditing}
              onChange={handleChange}
            />
            {/* Placeholder for future fields like Height, Weight, etc. */}
            {!isEditing && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                <p className="text-sm text-blue-600">
                  Các chỉ số sức khỏe khác sẽ được cập nhật từ hồ sơ bệnh án của bạn.
                </p>
              </div>
            )}
          </InfoCard>
        </div>
      </form>
    </div>
  );
}
