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
            <div
              key={doctor.staffId}
              onClick={() => onSelect(doctor)}
              className={`group relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 cursor-pointer ${isSelected
                  ? 'border-blue-600 bg-blue-50/30 shadow-md ring-1 ring-blue-600'
                  : 'border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 bg-white'
                }`}
            >
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold border-4 border-white shadow-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'
                      }`}
                  >
                    {doctor.personalInfo?.fullName?.split(' ').pop()?.charAt(0) || 'BS'}
                  </div>
                  {doctor.isActive && doctor.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500" title="Đang hoạt động" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {doctor.professionalInfo?.title
                          ? `${doctor.professionalInfo.title} `
                          : 'BS. '}
                        {doctor.personalInfo?.fullName || 'Chưa cập nhật'}
                      </h3>

                      <div className="space-y-1">
                        {doctor.professionalInfo?.department && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                              {translateValue(
                                doctor.professionalInfo.department,
                                DEPARTMENT_TRANSLATIONS
                              )}
                            </span>
                          </div>
                        )}
                        {specializationNames.length > 0 && (
                          <p className="text-sm text-gray-500">
                            {specializationNames.join(', ')}
                            {doctor.specializations && doctor.specializations.length > 2 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-700">4.8</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {typeof experience === 'number' && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>{experience} năm KN</span>
                        </div>
                      )}
                      {fee && (
                        <div className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md">
                          {fee} ₫
                        </div>
                      )}
                    </div>

                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                        }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn bác sĩ'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
