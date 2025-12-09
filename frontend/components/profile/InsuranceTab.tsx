'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shield, Calendar } from 'lucide-react';
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const coverageLabels: Record<string, string> = {
    BHYT: 'BHYT - Bảo hiểm y tế bắt buộc',
    BHTN: 'BHTN - Bảo hiểm thất nghiệp',
    private: 'Bảo hiểm tư nhân',
    self_pay: 'Tự chi trả',
  };

  const coverageDisplay =
    coverageLabels[insurance?.coverageType || ''] || insurance?.coverageType || '-';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const newErrors: { [key: string]: string } = {};
      if (!formData.provider) {
        newErrors.provider = 'Nhà cung cấp không được để trống';
      }
      if (!formData.policyNumber) {
        newErrors.policyNumber = 'Số thẻ bảo hiểm không được để trống';
      }
      if (requiresBhytNumber && !formData.bhytNumber) {
        newErrors.bhytNumber = 'Mã BHYT không được để trống';
      }
      if (!formData.validFrom) {
        newErrors.validFrom = 'Ngày bắt đầu không được để trống';
      }
      if (!formData.validTo) {
        newErrors.validTo = 'Ngày hết hạn không được để trống';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      await onUpdate(formData);
      setIsEditing(false);
      setErrors({}); // Clear errors on successful save
    } catch (error) {
      console.error('Error updating insurance:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof InsuranceInfo, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' })); // Clear error for the changed field
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bảo hiểm y tế</h3>
            <p className="text-sm text-gray-500">Thông tin bảo hiểm và quyền lợi</p>
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
                onClick={() => {
                  setFormData(insurance || defaultInsurance);
                  setIsEditing(false);
                  setErrors({});
                }}
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

        {!isEditing && insurance && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
              isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className={`font-semibold ${isActive ? 'text-green-700' : 'text-red-700'}`}>
                {isActive ? 'Đang có hiệu lực' : 'Hết hiệu lực / Chưa kích hoạt'}
              </p>
              <p className={`text-sm ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive
                  ? 'Bạn được hưởng đầy đủ quyền lợi bảo hiểm.'
                  : 'Vui lòng kiểm tra lại thời hạn hoặc gia hạn bảo hiểm.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Nhà cung cấp
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => handleChange('provider', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ví dụ: Bảo hiểm xã hội Việt Nam"
                  />
                  {errors.provider && <p className="text-xs text-red-500">{errors.provider}</p>}
                </div>
              ) : (
                <p className="text-base font-semibold text-gray-900">
                  {insurance?.provider || '—'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Số thẻ bảo hiểm
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.policyNumber}
                    onChange={(e) => handleChange('policyNumber', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="DN479..."
                  />
                  {errors.policyNumber && (
                    <p className="text-xs text-red-500">{errors.policyNumber}</p>
                  )}
                </div>
              ) : (
                <p className="font-mono text-base font-semibold text-gray-900">
                  {insurance?.policyNumber || '—'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Mã nhóm (tùy chọn)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.groupNumber || ''}
                  onChange={(e) => handleChange('groupNumber', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-base font-semibold text-gray-900">
                  {insurance?.groupNumber || '—'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Loại bảo hiểm
              </label>
              {isEditing ? (
                <select
                  value={formData.coverageType}
                  onChange={(e) =>
                    handleChange('coverageType', e.target.value as InsuranceInfo['coverageType'])
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {coverageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-base font-semibold text-gray-900">{coverageDisplay}</p>
              )}
            </div>

            {requiresBhytNumber && (
              <div className="space-y-1">
                <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Mã BHYT
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={formData.bhytNumber || ''}
                      onChange={(e) => handleChange('bhytNumber', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    {errors.bhytNumber && (
                      <p className="text-xs text-red-500">{errors.bhytNumber}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-base font-semibold text-gray-900">
                    {insurance?.bhytNumber || '—'}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Ngày bắt đầu
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="date"
                    lang="vi"
                    value={formData.validFrom}
                    onChange={(e) => handleChange('validFrom', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {errors.validFrom && <p className="text-xs text-red-500">{errors.validFrom}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-semibold text-gray-900">
                    {formatDate(insurance?.validFrom)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Ngày hết hạn
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="date"
                    lang="vi"
                    value={formData.validTo}
                    onChange={(e) => handleChange('validTo', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  {errors.validTo && <p className="text-xs text-red-500">{errors.validTo}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-semibold text-gray-900">
                    {formatDate(insurance?.validTo)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Ghi chú (tùy chọn)
              </label>
              {isEditing ? (
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Thông tin bổ sung về bảo hiểm"
                />
              ) : (
                <p className="text-base font-semibold text-gray-900">{insurance?.notes || '—'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(insurance || defaultInsurance);
                  setIsEditing(false);
                  setErrors({});
                }}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving || Object.values(errors).some(Boolean)}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
