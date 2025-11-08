'use client';

import { Calendar, Clock, User, Stethoscope, FileText, AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Xác nhận thông tin</h2>
        <p className="text-gray-600 mt-1">Vui lòng kiểm tra lại thông tin trước khi đặt lịch</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 border-2 border-primary-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Thông tin lịch hẹn
        </h3>

        <div className="space-y-4">
          {/* Department */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Chuyên khoa</p>
              <p className="font-semibold text-gray-900">{department.nameVi}</p>
            </div>
          </div>

          {/* Doctor */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Bác sĩ</p>
              <p className="font-semibold text-gray-900">BS. {doctor.fullName}</p>
              {doctor.specialization && doctor.specialization.length > 0 && (
                <p className="text-sm text-gray-500">{doctor.specialization.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày khám</p>
              <p className="font-semibold text-gray-900">
                {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Giờ khám</p>
              <p className="font-semibold text-gray-900">{time.startTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Loại khám <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onTypeChange('CONSULTATION')}
            className={`p-4 rounded-xl border-2 transition-all ${
              appointmentType === 'CONSULTATION'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-medium">Khám mới</p>
            <p className="text-xs text-gray-500 mt-1">Lần đầu khám bệnh</p>
          </button>
          <button
            onClick={() => onTypeChange('FOLLOW_UP')}
            className={`p-4 rounded-xl border-2 transition-all ${
              appointmentType === 'FOLLOW_UP'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-medium">Tái khám</p>
            <p className="text-xs text-gray-500 mt-1">Khám lại theo hẹn</p>
          </button>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lý do khám <span className="text-gray-400">(Tùy chọn)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-300 p-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
          placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..."
        />
        <p className="text-xs text-gray-500 mt-2">
          Thông tin này sẽ giúp bác sĩ chuẩn bị tốt hơn cho buổi khám
        </p>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-semibold">Lưu ý quan trọng:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>Vui lòng đến trước 15 phút để làm thủ tục</li>
              <li>Mang theo CMND/CCCD và thẻ bảo hiểm y tế (nếu có)</li>
              <li>Mang theo sổ khám bệnh và kết quả xét nghiệm cũ (nếu có)</li>
              <li>Liên hệ hotline nếu cần hủy/đổi lịch hẹn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
