'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Save } from 'lucide-react';
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
      await onUpdate(formData);
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thông tin liên hệ</h3>
          <p className="mt-1 text-sm text-gray-500">Dùng để đặt lịch và nhận thông báo</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Chỉnh sửa
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Số điện thoại</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onChangeField('phone', e.target.value)}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  required
                />
              ) : (
                <p className="py-2 text-gray-900">{profile.phone}</p>
              )}
              {isEditing && errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <p className="flex items-center gap-2 py-2 text-gray-900">
                <Mail className="h-4 w-4 text-gray-400" />
                {profile.email}
              </p>
              <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Địa chỉ</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => onChangeField('address', e.target.value)}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="Số nhà, tên đường"
                  required
                />
              ) : (
                <p className="flex items-center gap-2 py-2 text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {profile.address}
                </p>
              )}
              {isEditing && errors.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phường/Xã</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                />
              ) : (
                <p className="py-2 text-gray-900">{profile.ward || '-'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Quận/Huyện</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                />
              ) : (
                <p className="py-2 text-gray-900">{profile.district || '-'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => onChangeField('city', e.target.value)}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  required
                />
              ) : (
                <p className="py-2 text-gray-900">{profile.city}</p>
              )}
              {isEditing && errors.city && (
                <p className="mt-1 text-xs text-red-500">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mã bưu điện</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => onChangeField('postalCode', e.target.value)}
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                />
              ) : (
                <p className="py-2 text-gray-900">{profile.postalCode || '-'}</p>
              )}
              {isEditing && errors.postalCode && (
                <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                >
                  <option value="PHONE">Điện thoại</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              ) : (
                <p className="py-2 text-gray-900">{preferredLabels[currentPreferred]}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving || Object.values(errors).some(Boolean)}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
