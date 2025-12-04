'use client';

import { useState } from 'react';
import { Activity, Calendar, Droplet, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientProfile } from '@/lib/types/profile';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BasicInfoTabProps {
  profile: PatientProfile;
  onUpdate: (data: Partial<PatientProfile>) => Promise<void>;
}

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Thông tin định danh</h3>
            <p className="text-sm text-gray-500">Thông tin cơ bản của bệnh nhân</p>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Họ và tên đệm
            </label>
            {isEditing ? (
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {profile.lastName || '—'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Tên
            </label>
            {isEditing ? (
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {profile.firstName || '—'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Ngày sinh
            </label>
            {isEditing ? (
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-base font-semibold text-gray-900">
                  {profile.dateOfBirth
                    ? format(parseISO(profile.dateOfBirth), 'dd/MM/yyyy', { locale: vi })
                    : '—'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Giới tính
            </label>
            {isEditing ? (
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {genderLabels[profile.gender]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Thông tin sinh học</h3>
            <p className="text-sm text-gray-500">Các chỉ số sức khỏe cơ bản</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Nhóm máu
            </label>
            {isEditing ? (
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Chưa xác định</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-rose-500" />
                <p className="text-base font-semibold text-gray-900">
                  {profile.bloodType || 'Chưa cập nhật'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
