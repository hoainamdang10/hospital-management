'use client';

import { Loader2, Star, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';
import { Staff } from '@/lib/api/staff.service';

const DEPARTMENT_TRANSLATIONS: Record<string, string> = {
  general: 'Khoa Tổng quát',
  cardiology: 'Khoa Tim mạch',
  'internal medicine': 'Nội tổng quát',
};

const SPECIALIZATION_TRANSLATIONS: Record<string, string> = {
  'heart failure': 'Suy tim',
  'preventive cardiology': 'Tim mạch dự phòng',
  electrophysiology: 'Điện sinh lý tim',
  'cardiac electrophysiology': 'Điện sinh lý tim',
};

function translateValue(value?: string, dict?: Record<string, string>) {
  if (!value) return value;
  const key = value.toLowerCase();
  return dict?.[key] || value;
}

interface DoctorSelectorProps {
  doctors: Staff[];
  selectedDoctor: Staff | null;
  onSelect: (doctor: Staff) => void;
  loading?: boolean;
}

export function DoctorSelector({
  doctors,
  selectedDoctor,
  onSelect,
  loading = false,
}: DoctorSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="ml-3 text-gray-600">Đang tải danh sách bác sĩ...</span>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Chưa có bác sĩ trong khoa này</p>
        <p className="mt-2 text-sm text-gray-400">Vui lòng chọn khoa khác</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Chọn bác sĩ</h2>
        <p className="mt-1 text-gray-600">Tìm thấy {doctors.length} bác sĩ khả dụng</p>
      </div>

      <div className="space-y-3">
        {doctors.map((doctor) => {
          const isSelected = selectedDoctor?.staffId === doctor.staffId;
          const specializationNames =
            doctor.specializations
              ?.map((s) => translateValue(s.name, SPECIALIZATION_TRANSLATIONS))
              .filter(Boolean)
              .slice(0, 2) || [];
          const experience =
            typeof doctor.yearsOfExperience === 'number' ? doctor.yearsOfExperience : undefined;
          const fee =
            typeof doctor.consultationFee === 'number'
              ? new Intl.NumberFormat('vi-VN').format(doctor.consultationFee)
              : undefined;

          return (
            <button
              key={doctor.staffId}
              onClick={() => onSelect(doctor)}
              className={`w-full rounded-xl border-2 p-5 text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-primary bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                    isSelected ? 'bg-primary text-white' : 'bg-primary-100 text-primary-600'
                  }`}
                >
                  {doctor.personalInfo?.fullName?.split(' ').pop()?.charAt(0) || 'BS'}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doctor.professionalInfo?.title
                          ? `${doctor.professionalInfo.title} `
                          : 'BS. '}
                        {doctor.personalInfo?.fullName || 'Chưa cập nhật'}
                      </h3>
                      <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                        {doctor.professionalInfo?.department && (
                          <p>
                            {translateValue(
                              doctor.professionalInfo.department,
                              DEPARTMENT_TRANSLATIONS
                            )}
                          </p>
                        )}
                        {specializationNames.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {specializationNames.join(', ')}
                            {doctor.specializations && doctor.specializations.length > 2 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="text-primary-600 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">4.8</span>
                      </div>
                      {doctor.isActive && doctor.status === 'active' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Đang nhận lịch
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {typeof experience === 'number' && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{experience} năm kinh nghiệm</span>
                      </div>
                    )}
                    {fee && <p className="mt-0.5 text-sm text-gray-600">Phí khám: {fee} ₫</p>}
                    {doctor.licenseNumber && (
                      <div className="text-xs">Số hành nghề: {doctor.licenseNumber}</div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="bg-primary mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Đã chọn
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
