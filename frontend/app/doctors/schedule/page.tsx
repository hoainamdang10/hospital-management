'use client';

import React, { useState } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock
} from 'lucide-react';

interface CalendarAppointment {
  id: string;
  doctorName: string;
  patientName: string;
  time: string;
  type: string;
  date: Date;
  description?: string;
}

// Sample calendar appointments data
const mockCalendarAppointments: CalendarAppointment[] = [
  {
    id: '1',
    doctorName: 'BS. Nguyễn Văn An',
    patientName: 'Trần Thị Bình',
    time: '09:00',
    type: 'Khám tim mạch',
    date: new Date(2024, 6, 1), // July 1, 2024
    description: 'Khám định kỳ tim mạch'
  },
  {
    id: '2',
    doctorName: 'BS. Lê Thị Cẩm',
    patientName: 'Nguyễn Văn Dũng',
    time: '10:00',
    type: 'Khám tổng quát',
    date: new Date(2024, 6, 1),
    description: 'Khám sức khỏe định kỳ'
  },
  {
    id: '3',
    doctorName: 'BS. Phạm Minh Đức',
    patientName: 'Hoàng Thị Lan',
    time: '02:00',
    type: 'Tái khám',
    date: new Date(2024, 6, 2),
    description: 'Tái khám sau điều trị'
  },
  {
    id: '4',
    doctorName: 'BS. Đỗ Văn Hùng',
    patientName: 'Vũ Thị Mai',
    time: '11:00',
    type: 'Khám chuyên khoa',
    date: new Date(2024, 6, 3),
    description: 'Khám chuyên khoa thần kinh'
  }
];

export default function DoctorSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6)); // July 2024
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'All Agenda'>('Month');

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    return mockCalendarAppointments.filter(apt =>
      apt.date.toDateString() === date.toDateString()
    );
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  return React.createElement(RoleBasedLayout, { title: "Lịch làm việc", activePage: "schedule" },
    React.createElement('div', { className: "p-6 bg-gray-50 min-h-screen" },
      // Header with navigation and controls
      React.createElement('div', { className: "bg-white rounded-lg shadow-sm border p-4 mb-6" },
        React.createElement('div', { className: "flex items-center justify-between" },
          // Left side - Month navigation
          React.createElement('div', { className: "flex items-center gap-4" },
            React.createElement('div', { className: "flex items-center gap-2" },
              React.createElement(Button, {
                variant: "ghost",
                size: "sm",
                onClick: () => navigateMonth('prev')
              },
                React.createElement(ChevronLeft, { className: "h-4 w-4" })
              ),
              React.createElement('h1', { className: "text-xl font-semibold text-gray-900" },
                formatMonthYear(currentDate)
              ),
              React.createElement(Button, {
                variant: "ghost",
                size: "sm",
                onClick: () => navigateMonth('next')
              },
                React.createElement(ChevronRight, { className: "h-4 w-4" })
              )
            )
          ),

          // Right side - View controls and Add button
          React.createElement('div', { className: "flex items-center gap-3" },
            // View mode buttons
            React.createElement('div', { className: "flex bg-gray-100 rounded-lg p-1" },
              ['Day', 'Week', 'Month', 'All Agenda'].map(mode =>
                React.createElement(Button, {
                  key: mode,
                  variant: viewMode === mode ? "default" : "ghost",
                  size: "sm",
                  className: "text-xs px-3 py-1",
                  onClick: () => setViewMode(mode as any)
                }, mode)
              )
            ),

            // Add Schedule button
            React.createElement(Button, {
              className: "bg-blue-600 hover:bg-blue-700 text-white",
              size: "sm"
            },
              React.createElement(Plus, { className: "h-4 w-4 mr-1" }),
              "Add Schedule"
            )
          )
        )
      ),

      // Calendar Grid
      React.createElement('div', { className: "bg-white rounded-lg shadow-sm border" },
        // Calendar header with day names
        React.createElement('div', { className: "grid grid-cols-7 border-b" },
          dayNames.map(day =>
            React.createElement('div', {
              key: day,
              className: "p-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0"
            }, day)
          )
        ),

        // Calendar body with dates and appointments
        React.createElement('div', { className: "grid grid-cols-7" },
          days.map((date, index) => {
            const appointments = getAppointmentsForDate(date);
            const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

            return React.createElement('div', {
              key: index,
              className: `min-h-[120px] border-r border-b last:border-r-0 p-2 ${
                !date ? 'bg-gray-50' :
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' :
                'bg-white hover:bg-gray-50'
              }`
            },
              // Date number
              date && React.createElement('div', {
                className: `text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`
              }, date.getDate()),

              // Appointments for this date
              React.createElement('div', { className: "space-y-1" },
                appointments.map(appointment =>
                  React.createElement('div', {
                    key: appointment.id,
                    className: "bg-teal-100 border border-teal-200 rounded p-1 text-xs"
                  },
                    React.createElement('div', { className: "font-medium text-teal-800" },
                      appointment.doctorName
                    ),
                    React.createElement('div', { className: "flex items-center gap-1 text-teal-600" },
                      React.createElement(Clock, { className: "h-3 w-3" }),
                      appointment.time
                    ),
                    React.createElement('div', { className: "text-teal-700 truncate" },
                      appointment.type
                    )
                  )
                )
              )
            );
          })
        )
      )
    )
  );
}
