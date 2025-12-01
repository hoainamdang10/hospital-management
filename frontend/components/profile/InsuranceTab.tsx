'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shield, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InsuranceInfo } from '@/lib/types/profile';
import { format, parseISO, isAfter, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

interface InsuranceTabProps {
  insurance?: InsuranceInfo;
  onUpdate: (insurance: InsuranceInfo) => Promise<void>;
}

const coverageOptions = [
  { value: 'BHYT', label: 'BHYT - Bảo hiểm y tế bắt buộc' },
  { value: 'BHTN', label: 'BHTN - Bảo hiểm thất nghiệp' },
  { value: 'private', label: 'Bảo hiểm tư nhân' },
  { value: 'self_pay', label: 'Tự chi trả' },
];

const coverageLabels = coverageOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const defaultInsurance: InsuranceInfo = {
  provider: '',
  policyNumber: '',
  groupNumber: '',
  validFrom: '',
  validTo: '',
  coverageType: 'BHYT',
  bhytNumber: '',
  isPrimary: true,
  isActive: true,
  notes: '',
};

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const parsed = parseISO(dateString);
  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: vi }) : '-';
}

export function InsuranceTab({ insurance, onUpdate }: InsuranceTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InsuranceInfo>(insurance || defaultInsurance);
  const [saving, setSaving] = useState(false);
  const requiresBhytNumber = useMemo(
    () => ['BHYT', 'BHTN'].includes(formData.coverageType),
    [formData.coverageType]
  );

  useEffect(() => {
    setFormData(insurance || defaultInsurance);
  }, [insurance]);

  const isActive =
    insurance?.isActive ??
    (insurance?.validTo ? isAfter(parseISO(insurance.validTo), new Date()) : false);
  const coverageDisplay =
    coverageLabels[insurance?.coverageType || ''] || insurance?.coverageType || '-';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating insurance:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bảo hiểm y tế</h3>
          <p className="text-sm text-gray-500 mt-1">Thông tin bảo hiểm y tế của bạn</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            {insurance ? 'Chỉnh sửa' : 'Thêm bảo hiểm'}
          </Button>
        )}
      </div>

      {insurance && !isEditing && (
        <div
          className={`rounded-xl border-2 p-4 ${
            isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isActive ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className={`font-semibold ${isActive ? 'text-green-900' : 'text-red-900'}`}>
                {isActive ? 'Bảo hiểm đang hoạt động' : 'Bảo hiểm đã hết hạn'}
              </p>
              <p className={`text-sm ${isActive ? 'text-green-700' : 'text-red-700'}`}>
                {isActive
                  ? `Có hiệu lực đến ${formatDate(insurance.validTo)}`
                  : `Đã hết hạn từ ${formatDate(insurance.validTo)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Thông tin bảo hiểm
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nhà cung cấp</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="VD: Bảo hiểm xã hội Việt Nam"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2">{insurance?.provider || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số thẻ bảo hiểm
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.policyNumber}
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="VD: DN1234567890123"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2 font-mono">{insurance?.policyNumber || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã nhóm (tùy chọn)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.groupNumber || ''}
                  onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{insurance?.groupNumber || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại bảo hiểm</label>
              {isEditing ? (
                <select
                  value={formData.coverageType}
                  onChange={(e) =>
                    setFormData({ ...formData, coverageType: e.target.value as InsuranceInfo['coverageType'] })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  {coverageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 py-2">{coverageDisplay}</p>
              )}
            </div>

            {requiresBhytNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã BHYT</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.bhytNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bhytNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{insurance?.bhytNumber || '-'}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(insurance?.validFrom)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              ) : (
                <p className="text-gray-900 py-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(insurance?.validTo)}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
              {isEditing ? (
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Thông tin bổ sung về bảo hiểm"
                />
              ) : (
                <p className="text-gray-900 py-2">{insurance?.notes || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(insurance || defaultInsurance);
                setIsEditing(false);
              }}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
