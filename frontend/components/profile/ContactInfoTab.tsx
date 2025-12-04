'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientProfile } from '@/lib/types/profile';
import { toast } from 'sonner';

interface ContactInfoTabProps {
  profile: PatientProfile;
  onUpdate: (data: Partial<PatientProfile>) => Promise<void>;
}

export function ContactInfoTab({ profile, onUpdate }: ContactInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialPreferredMethod = (profile.preferredContactMethod?.toUpperCase() ?? 'PHONE') as
    | 'PHONE'
    | 'EMAIL'
    | 'SMS';
  const [formData, setFormData] = useState({
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    ward: profile.ward || '',
    district: profile.district || '',
    city: profile.city,
    postalCode: profile.postalCode || '',
    preferredContactMethod: initialPreferredMethod,
  });
  const [errors, setErrors] = useState<{
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  }>({});
  const preferredLabels: Record<'PHONE' | 'EMAIL' | 'SMS', string> = {
    PHONE: 'Điện thoại',
    EMAIL: 'Email',
    SMS: 'SMS',
  };
  const currentPreferred =
    (profile.preferredContactMethod?.toUpperCase() as 'PHONE' | 'EMAIL' | 'SMS' | undefined) ??
    formData.preferredContactMethod ??
    'PHONE';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const phoneRegex = /^0[0-9]{9}$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        toast.error('Số điện thoại không đúng định dạng Việt Nam');
        return;
      }
      if (!formData.address) {
        setErrors((prev) => ({ ...prev, address: 'Địa chỉ không được để trống' }));
        return;
      }
      if (!formData.city) {
        setErrors((prev) => ({ ...prev, city: 'Tỉnh/Thành phố không được để trống' }));
        return;
      }
      if (formData.postalCode && !/^\d{5,6}$/.test(formData.postalCode)) {
        setErrors((prev) => ({ ...prev, postalCode: 'Mã bưu điện phải 5-6 số' }));
        return;
      }
      await onUpdate({
        ...formData,
        preferredContactMethod: formData.preferredContactMethod.toLowerCase() as 'phone' | 'email' | 'sms',
      });
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  }

  function onChangeField<K extends keyof typeof formData>(key: K, value: string) {
    const next = { ...formData, [key]: value };
    setFormData(next);
    if (key === 'phone') {
      const ok = /^0[0-9]{9}$/.test(value);
      setErrors((prev) => ({
        ...prev,
        phone: value && !ok ? 'Số điện thoại không đúng định dạng' : undefined,
      }));
    }
    if (key === 'address') {
      setErrors((prev) => ({
        ...prev,
        address: value ? undefined : 'Địa chỉ không được để trống',
      }));
    }
    if (key === 'city') {
      setErrors((prev) => ({
        ...prev,
        city: value ? undefined : 'Tỉnh/Thành phố không được để trống',
      }));
    }
    if (key === 'postalCode') {
      setErrors((prev) => ({
        ...prev,
        postalCode: value && !/^\d{5,6}$/.test(value) ? 'Mã bưu điện phải 5-6 số' : undefined,
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Thông tin liên hệ</h3>
            <p className="text-sm text-gray-500">Dùng để đặt lịch và nhận thông báo</p>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
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
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={saving || Object.values(errors).some(Boolean)}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Số điện thoại
            </label>
            {isEditing ? (
              <div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onChangeField('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-base font-semibold text-gray-900">{profile.phone}</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-base font-semibold text-gray-900">{profile.email}</p>
            </div>
            {isEditing && <p className="text-xs text-gray-400">Email không thể thay đổi</p>}
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Địa chỉ
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => onChangeField('address', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Số nhà, tên đường"
                  required
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <p className="text-base font-semibold text-gray-900">{profile.address}</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Phường/Xã
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-base font-semibold text-gray-900">{profile.ward || '—'}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Quận/Huyện
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-base font-semibold text-gray-900">{profile.district || '—'}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Tỉnh/Thành phố
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => onChangeField('city', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
            ) : (
              <p className="text-base font-semibold text-gray-900">{profile.city}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Mã bưu điện
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => onChangeField('postalCode', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
                )}
              </div>
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {profile.postalCode || '—'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Phương thức liên hệ ưa thích
            </label>
            {isEditing ? (
              <select
                value={formData.preferredContactMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferredContactMethod: e.target.value as 'PHONE' | 'EMAIL' | 'SMS',
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="PHONE">Điện thoại</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            ) : (
              <p className="text-base font-semibold text-gray-900">
                {preferredLabels[currentPreferred]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
