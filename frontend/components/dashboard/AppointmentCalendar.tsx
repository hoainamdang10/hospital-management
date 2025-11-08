'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
  location: string;
  status: 'confirmed' | 'pending' | 'completed';
}

// Mock data - Replace with real API data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date(2025, 0, 15), // Jan 15, 2025
    time: '09:00',
    doctorName: 'BS. Nguyễn Văn A',
    specialty: 'Nội khoa',
    location: 'Phòng 101, Tầng 2',
    status: 'confirmed',
  },
  {
    id: '2',
    date: new Date(2025, 0, 20), // Jan 20, 2025
    time: '14:30',
    doctorName: 'BS. Trần Thị B',
    specialty: 'Tim mạch',
    location: 'Phòng 205, Tầng 3',
    status: 'pending',
  },
  {
    id: '3',
    date: new Date(2025, 0, 22), // Jan 22, 2025
    time: '10:00',
    doctorName: 'BS. Lê Văn C',
    specialty: 'Da liễu',
    location: 'Phòng 301, Tầng 4',
    status: 'confirmed',
  },
];

export function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date) => {
    return mockAppointments.filter(
      (apt) =>
        apt.date.getDate() === date.getDate() &&
        apt.date.getMonth() === date.getMonth() &&
        apt.date.getFullYear() === date.getFullYear()
    );
  };

  // Check if date has appointments
  const hasAppointments = (date: Date) => {
    return getAppointmentsForDate(date).length > 0;
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
  };

  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
        <CalendarIcon className="h-5 w-5 text-primary-600" />
      </div>

      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 p-3">
        <button
          onClick={previousMonth}
          className="rounded-lg p-2 transition-colors hover:bg-white/50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-primary-700" />
        </button>

        <h3 className="text-lg font-semibold text-primary-900">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="rounded-lg p-2 transition-colors hover:bg-white/50"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-primary-700" />
        </button>
      </div>

      {/* Day Names */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();
          const hasApt = hasAppointments(date);
          const isSelected =
            selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                group relative aspect-square rounded-lg p-2 text-sm font-medium transition-all
                ${isToday ? 'bg-primary-600 text-white shadow-lg' : ''}
                ${isSelected && !isToday ? 'bg-primary-100 text-primary-900 ring-2 ring-primary-600' : ''}
                ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
                ${hasApt && !isToday && !isSelected ? 'font-bold' : ''}
              `}
            >
              <span className="relative z-10">{day}</span>

              {/* Appointment indicator dots */}
              {hasApt && (
                <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {getAppointmentsForDate(date).slice(0, 3).map((apt, i) => (
                    <div
                      key={i}
                      className={`h-1 w-1 rounded-full ${
                        isToday
                          ? 'bg-white'
                          : apt.status === 'confirmed'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Hover effect */}
              {!isToday && (
                <div className="absolute inset-0 rounded-lg bg-primary-500 opacity-0 transition-opacity group-hover:opacity-10" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Appointments */}
      {selectedDate && selectedAppointments.length > 0 && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="rounded-lg p-1 transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3">
            {selectedAppointments.map((apt) => (
              <div
                key={apt.id}
                className="group rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold text-gray-900">{apt.doctorName}</h5>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {apt.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{apt.specialty}</p>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="mr-2 h-4 w-4 text-primary-600" />
                        {apt.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="mr-2 h-4 w-4 text-primary-600" />
                        {apt.location}
                      </div>
                    </div>
                  </div>

                  <button className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100">
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 p-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Đã xác nhận</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Chờ xác nhận</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-primary-600" />
          <span className="text-gray-600">Hôm nay</span>
        </div>
      </div>
    </div>
  );
}
