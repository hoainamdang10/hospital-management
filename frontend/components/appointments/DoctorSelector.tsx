'use client';

import { Loader2, Star, Calendar as CalendarIcon } from 'lucide-react';
import { Staff, calculateExperience } from '@/lib/api/staff.service';

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-600">Đang tải danh sách bác sĩ...</span>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chưa có bác sĩ trong khoa này</p>
        <p className="text-sm text-gray-400 mt-2">Vui lòng chọn khoa khác</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Chọn bác sĩ</h2>
        <p className="text-gray-600 mt-1">
          Tìm thấy {doctors.length} bác sĩ khả dụng
        </p>
      </div>

      <div className="space-y-3">
        {doctors.map((doctor) => {
          const experience = calculateExperience(doctor.createdAt);
          const isSelected = selectedDoctor?.staffId === doctor.staffId;

          return (
            <button
              key={doctor.staffId}
              onClick={() => onSelect(doctor)}
              className={`w-full p-5 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                isSelected
                  ? 'border-primary bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                  isSelected ? 'bg-primary text-white' : 'bg-primary-100 text-primary-600'
                }`}>
                  {doctor.fullName.split(' ').pop()?.charAt(0) || 'BS'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        BS. {doctor.fullName}
                      </h3>
                      {doctor.specialization && doctor.specialization.length > 0 && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {doctor.specialization.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    {/* Rating (mock) */}
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{experience} năm kinh nghiệm</span>
                    </div>
                    {doctor.licenseNumber && (
                      <div className="text-xs">
                        Số hành nghề: {doctor.licenseNumber}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
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
