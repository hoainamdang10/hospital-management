'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar as CalendarIcon,
  Clock,
  User,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
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
  status: 'confirmed' | 'pending' | 'pending_payment' | 'cancelled';
}

interface UpcomingAppointmentsProps {
  patientId?: string;
  hideHeader?: boolean;
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

export function UpcomingAppointments({ patientId, hideHeader = false }: UpcomingAppointmentsProps) {
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
        const aggregatedAppointments: any[] = [];
        const PAGE_SIZE = 50;
        const MAX_PAGES = 10;
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= MAX_PAGES) {
          const response = await appointmentsService.getPatientAppointments(patientId, {
            page,
            pageSize: PAGE_SIZE,
          });

          aggregatedAppointments.push(...(response.appointments || []));

          hasMore = response.hasMore && (response.appointments?.length || 0) === PAGE_SIZE;
          if (!hasMore || (response.appointments?.length || 0) < PAGE_SIZE) {
            break;
          }

          page += 1;
        }

        const normalizedAppointments: Appointment[] = aggregatedAppointments
          .filter((apt: any) => {
            const status = (apt.status || '').toUpperCase();
            return (
              status === 'SCHEDULED' ||
              status === 'CONFIRMED' ||
              status === 'PENDING_PAYMENT' ||
              status === 'ARRIVED'
            );
          })
          .map((apt: any, idx: number) => ({
            id: apt.id || apt.appointmentId || `${apt.appointmentId || 'apt'}-${idx}`,
            patientName: apt.patientName || apt.patient?.fullName || 'Bệnh nhân',
            date: apt.appointmentDate || apt.date,
            time: apt.appointmentTime || apt.time,
            doctor: apt.doctorName || apt.doctor?.fullName || 'Bác sĩ',
            treatment: mapAppointmentType(apt.type || apt.appointmentType),
            status: mapStatus(apt.status, apt.paymentStatus),
          }));

        setAppointments(normalizedAppointments);
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

  const appointmentsForSelectedDate = appointments.filter((appointment) => {
    if (!appointment.date) return false;
    try {
      return isSameDay(parseISO(appointment.date), selectedDate);
    } catch {
      return false;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'pending_payment':
        return 'bg-amber-50 text-amber-700 border-amber-100';
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
      case 'pending_payment':
        return 'Chờ thanh toán';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        {!hideHeader && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
          </div>
        )}
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
      {!hideHeader && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
          </div>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors">
            Xem tất cả
          </button>
        </div>
      )}

      {/* Mini Calendar */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Tháng {format(weekStart, 'M, yyyy')}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrevWeek}
              className="rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
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
                  'flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-200',
                  isSelected
                    ? 'bg-primary-600 shadow-primary-600/30 scale-105 text-white shadow-lg'
                    : isToday
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
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
        {appointmentsForSelectedDate.length > 0 ? (
          appointmentsForSelectedDate.map((appointment) => (
            <div
              key={appointment.id}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
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

              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <div className="hidden text-right sm:block">
                  <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-900">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {appointment.date}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {appointment.time}
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                    getStatusColor(appointment.status)
                  )}
                >
                  {getStatusLabel(appointment.status)}
                </span>

                <button className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-blue-50 p-3">
              <CalendarIcon className="h-6 w-6 text-blue-400" />
            </div>
            <p className="font-medium text-gray-900">Bạn chưa có lịch hẹn nào trong ngày này</p>
            <p className="mt-1 text-sm text-gray-500">
              Đặt lịch khám ngay để chăm sóc sức khỏe của bạn
            </p>
            <a
              href="/patient/appointments/book"
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Đặt lịch khám
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function mapStatus(status?: string, paymentStatus?: string): Appointment['status'] {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'CONFIRMED':
    case 'ARRIVED':
      return 'confirmed';
    case 'SCHEDULED':
      return 'pending';
    case 'PENDING_PAYMENT':
      return 'pending_payment';
    case 'CANCELLED':
      return 'cancelled';
    default:
      if ((paymentStatus || '').toUpperCase() === 'PENDING') {
        return 'pending_payment';
      }
      return 'pending';
  }
}

function mapAppointmentType(type?: string): string {
  const normalized = (type || '').toUpperCase();
  const labels: Record<string, string> = {
    CONSULTATION: 'Khám tổng quát',
    FOLLOW_UP: 'Tái khám',
    EMERGENCY: 'Cấp cứu',
    SURGERY: 'Phẫu thuật',
    CHECKUP: 'Khám định kỳ',
    VACCINATION: 'Tiêm ngừa',
    THERAPY: 'Vật lý trị liệu',
  };
  return labels[normalized] || 'Khám bệnh';
}
