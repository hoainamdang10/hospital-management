'use client';

import { Calendar, Clock, User, Stethoscope, FileText, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Department } from '@/lib/api/departments.service';
import { Staff } from '@/lib/api/staff.service';
import { TimeSlot } from '@/lib/api/availability.service';

interface ConfirmationStepProps {
  department: Department;
  doctor: Staff;
  date: Date;
  time: TimeSlot;
  reason: string;
  appointmentType: 'CONSULTATION' | 'FOLLOW_UP';
  onReasonChange: (value: string) => void;
  onTypeChange: (value: 'CONSULTATION' | 'FOLLOW_UP') => void;
}

export function ConfirmationStep({
  department,
  doctor,
  date,
  time,
  reason,
  appointmentType,
  onReasonChange,
  onTypeChange,
}: ConfirmationStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Thông tin bổ sung</h2>
        <p className="text-gray-600 mt-1">Vui lòng cung cấp thêm thông tin để bác sĩ chuẩn bị tốt hơn</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Left Column: Form */}
        <div className="space-y-8">
          {/* Note: Patient info displayed from appointment_read_model after booking */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">i</div>
            </div>
            <p className="text-sm text-gray-700">
              Thông tin bệnh nhân sẽ được lấy từ hồ sơ của bạn.
              Nếu cần cập nhật, vui lòng vào <span className="text-blue-600 font-medium cursor-pointer hover:underline">Hồ sơ cá nhân</span> trước khi đặt lịch.
            </p>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Loại khám <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => onTypeChange('CONSULTATION')}
                className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${appointmentType === 'CONSULTATION'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-bold ${appointmentType === 'CONSULTATION' ? 'text-blue-700' : 'text-gray-900'}`}>Khám mới</p>
                  {appointmentType === 'CONSULTATION' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-gray-500">Dành cho bệnh nhân lần đầu đến khám hoặc khám bệnh mới</p>
              </button>

              <button
                onClick={() => onTypeChange('FOLLOW_UP')}
                className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${appointmentType === 'FOLLOW_UP'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-bold ${appointmentType === 'FOLLOW_UP' ? 'text-blue-700' : 'text-gray-900'}`}>Tái khám</p>
                  {appointmentType === 'FOLLOW_UP' && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-gray-500">Dành cho bệnh nhân đã có lịch hẹn tái khám từ bác sĩ</p>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Lý do khám <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </label>
            <div className="relative">
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={4}
                className="w-full rounded-xl border-gray-200 bg-gray-50/30 p-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                placeholder="Mô tả ngắn gọn triệu chứng, vấn đề sức khỏe bạn đang gặp phải..."
              />
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <FileText className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-amber-900">
                <p className="font-bold">Lưu ý quan trọng:</p>
                <ul className="space-y-1.5 text-amber-800/80 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="block h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    Vui lòng đến trước 15 phút để làm thủ tục
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="block h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    Mang theo CMND/CCCD và thẻ bảo hiểm y tế (nếu có)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
