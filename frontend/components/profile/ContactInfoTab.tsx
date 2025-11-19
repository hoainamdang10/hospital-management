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
  const [formData, setFormData] = useState({
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
    ward: profile.ward || '',
    district: profile.district || '',
    city: profile.city,
    postalCode: profile.postalCode || '',
    preferredContactMethod: 'PHONE',
  });
  const [errors, setErrors] = useState<{ phone?: string; address?: string; city?: string; postalCode?: string }>({});

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
      setErrors((prev) => ({ ...prev, phone: value && !ok ? 'Số điện thoại không đúng định dạng' : undefined }));
    }
    if (key === 'address') {
      setErrors((prev) => ({ ...prev, address: value ? undefined : 'Địa chỉ không được để trống' }));
    }
    if (key === 'city') {
      setErrors((prev) => ({ ...prev, city: value ? undefined : 'Tỉnh/Thành phố không được để trống' }));
    }
    if (key === 'postalCode') {
      setErrors((prev) => ({ ...prev, postalCode: value && !/^\d{5,6}$/.test(value) ? 'Mã bưu điện phải 5-6 số' : undefined }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Thông tin liên hệ</h3>
          <p className="text-sm text-gray-500 mt-1">Dùng để đặt lịch và nhận thông báo</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">Chỉnh sửa</Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onChangeField('phone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.phone}</p>
              )}
              {isEditing && errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p className="text-gray-900 py-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {profile.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => onChangeField('address', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Số nhà, tên đường"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {profile.address}
                </p>
              )}
              {isEditing && errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.ward || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.district || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => onChangeField('city', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.city}</p>
              )}
              {isEditing && errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã bưu điện</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => onChangeField('postalCode', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.postalCode || '-'}</p>
              )}
              {isEditing && errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức liên hệ ưa thích</label>
              {isEditing ? (
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="PHONE">Điện thoại</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              ) : (
                <p className="text-gray-900 py-2">Điện thoại</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || Object.values(errors).some(Boolean)}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
      </form>
    </div>
  );
}
