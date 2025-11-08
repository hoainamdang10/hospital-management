'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';

/**
 * Doctor Schedule Page
 * Route: /doctor/schedule
 */
export default function DoctorSchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(0);

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
  ];

  // Mock appointments data
  const appointments = {
    0: { 0: 'Nguyễn Văn A', 2: 'Trần Thị B' }, // Monday
    1: { 1: 'Lê Văn C', 3: 'Phạm Thị D' }, // Tuesday
    2: { 0: 'Hoàng Văn E', 4: 'Ngô Thị F' }, // Wednesday
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch làm việc</h1>
            <p className="mt-2 text-gray-600">Quản lý lịch khám bệnh trong tuần</p>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Cài đặt lịch làm việc
          </Button>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Tuần trước
          </Button>
          <span className="font-semibold text-gray-900">
            Tuần {currentWeek === 0 ? 'này' : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
            {' '}(15/01 - 21/01/2025)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            Tuần sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b bg-gray-50">
              <div className="border-r p-4 text-center font-semibold text-gray-700">
                Giờ
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`border-r p-4 text-center font-semibold ${
                    index === 0 ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  {day}
                  <div className="mt-1 text-xs font-normal text-gray-500">
                    {15 + index}/01
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="grid grid-cols-8 border-b hover:bg-gray-50">
                <div className="border-r p-4 text-center text-sm font-medium text-gray-600">
                  {time}
                </div>
                {weekDays.map((_, dayIndex) => {
                  const appointment = appointments[dayIndex]?.[timeIndex];
                  return (
                    <div
                      key={dayIndex}
                      className="border-r p-2"
                    >
                      {appointment && (
                        <div className="rounded bg-primary-100 p-2 text-xs">
                          <p className="font-medium text-primary-900">{appointment}</p>
                          <p className="text-primary-700">Khám bệnh</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-primary-100"></div>
            <span className="text-sm text-gray-700">Đã đặt lịch</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-green-100"></div>
            <span className="text-sm text-gray-700">Đã hoàn thành</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-gray-100"></div>
            <span className="text-sm text-gray-700">Trống</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
