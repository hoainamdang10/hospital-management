'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsService } from '@/lib/api/appointments.service';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  treatment: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface UpcomingAppointmentsProps {
  patientId?: string;
}

// Mock data fallback
function getMockAppointments(): Appointment[] {
  return [
    {
      id: '1',
      patientName: 'Nguyễn Văn A',
      date: '2024-07-28',
      time: '09:00',
      doctor: 'BS. Trần Thị B',
      treatment: 'Khám tổng quát',
      status: 'confirmed',
    },
    {
      id: '2',
      patientName: 'Lê Thị C',
      date: '2024-07-28',
      time: '10:30',
      doctor: 'BS. Phạm Văn D',
      treatment: 'Tư vấn tim mạch',
      status: 'confirmed',
    },
    {
      id: '3',
      patientName: 'Hoàng Văn E',
      date: '2024-07-28',
      time: '11:00',
      doctor: 'BS. Ngô Thị F',
      treatment: 'Khám nhi khoa',
      status: 'pending',
    },
    {
      id: '4',
      patientName: 'Đặng Thị G',
      date: '2024-07-28',
      time: '13:00',
      doctor: 'BS. Vũ Văn H',
      treatment: 'Khám da liễu',
      status: 'cancelled',
    },
    {
      id: '5',
      patientName: 'Bùi Văn I',
      date: '2024-07-28',
      time: '14:30',
      doctor: 'BS. Trần Thị B',
      treatment: 'Tái khám',
      status: 'confirmed',
    },
  ];
}

export function UpcomingAppointments({ patientId }: UpcomingAppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      if (!patientId) {
        setAppointments(getMockAppointments());
        setLoading(false);
        return;
      }

      try {
        const response = await appointmentsService.getPatientAppointments(patientId, {
          pageSize: 25,
        });

        if (response.success && response.appointments) {
          // Transform API data to component format
          const transformedAppointments: Appointment[] = response.appointments
            .filter(
              (apt: any) =>
                apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'PENDING'
            )
            .map((apt: any) => ({
              id: apt.id,
              patientName: apt.patientName || apt.patient?.fullName || 'Bệnh nhân',
              date: apt.appointmentDate || apt.date,
              time: apt.appointmentTime || apt.time,
              doctor: apt.doctorName || apt.doctor?.fullName || 'Bác sĩ',
              treatment: apt.appointmentType || apt.type || 'Khám bệnh',
              status: apt.status?.toLowerCase() || 'pending',
            }));
          setAppointments(transformedAppointments);
        } else {
          setAppointments(getMockAppointments());
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments(getMockAppointments());
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [patientId]);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-4">
              <div className="h-16 flex-1 rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
        </div>
        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">Xem tất cả</button>
      </div>

      {/* Mini Calendar */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Tháng {format(weekStart, 'M, yyyy')}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrevWeek}
              className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-200",
                  isSelected
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
                    : isToday
                      ? 'bg-primary-50 text-primary-600'
                      : 'hover:bg-gray-50 text-gray-600'
                )}
              >
                <span className="mb-1 text-xs font-medium opacity-80">
                  {format(day, 'EEE', { locale: vi }).toUpperCase()}
                </span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments List (Mobile Friendly) */}
      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-gray-200"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{appointment.doctor}</h4>
                  <p className="text-sm text-gray-500">{appointment.treatment}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 sm:hidden">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {appointment.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-900">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {appointment.date}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {appointment.time}
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
                    getStatusColor(appointment.status)
                  )}
                >
                  {getStatusLabel(appointment.status)}
                </span>

                <button className="rounded-full p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Không có lịch hẹn nào trong ngày này.
          </div>
        )}
      </div>
    </div>
  );
}
