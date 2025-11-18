'use client';

import { useState } from 'react';
import { Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

export default function DoctorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ sơ & Lịch làm việc</h1>
            <p className="mt-2 text-gray-600">Quản lý thông tin cá nhân và lịch làm việc</p>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </>
            ) : (
              'Chỉnh sửa'
            )}
          </Button>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Họ tên" value="BS. Nguyễn Văn A" disabled={!isEditing} />
            <FormField label="Chuyên khoa" value="Tim mạch" disabled={!isEditing} />
            <FormField label="Email" value="doctor@hospital.com" disabled={!isEditing} />
            <FormField label="Số điện thoại" value="0912345678" disabled={!isEditing} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
            <Calendar className="mr-2 h-5 w-5" />
            Lịch làm việc
          </h2>
          <div className="space-y-4">
            <ScheduleRow day="Thứ 2" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 3" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 4" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 5" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 6" morning="8:00 - 12:00" afternoon="13:00 - 17:00" />
            <ScheduleRow day="Thứ 7" morning="8:00 - 12:00" afternoon="Nghỉ" />
            <ScheduleRow day="Chủ nhật" morning="Nghỉ" afternoon="Nghỉ" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FormField({ label, value, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50"
      />
    </div>
  );
}

function ScheduleRow({ day, morning, afternoon }: any) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b pb-3">
      <div className="font-medium text-gray-900">{day}</div>
      <div className="text-gray-600">{morning}</div>
      <div className="text-gray-600">{afternoon}</div>
    </div>
  );
}
