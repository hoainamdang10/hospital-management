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
import Link from 'next/link';
import { appointmentsService } from '@/lib/api/appointments.service';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  treatment: string;
  status: 'confirmed' | 'pending' | 'pending_payment' | 'cancelled' | 'completed';
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
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'upcoming' | 'completed'>('upcoming');
  const [userSelectedDate, setUserSelectedDate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      if (!patientId) {
        const mock = getMockAppointments();
        const upcomingMock = mock
          .filter((apt) => ['confirmed', 'pending', 'pending_payment'].includes(apt.status))
          .sort((a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b));
        setUpcomingAppointments(upcomingMock);
        setCompletedAppointments(mock.filter((apt) => apt.status === 'completed'));
        setLoading(false);
        return;
      }

      try {
        // Calculate date range: 7 days ago to 14 days ahead (like doctor dashboard)
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 14);

        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const aggregatedAppointments: any[] = [];
        const PAGE_SIZE = 100;
        const MAX_PAGES = 5;
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= MAX_PAGES) {
          const response = await appointmentsService.getPatientAppointments(patientId, {
            page,
            pageSize: PAGE_SIZE,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          });

          aggregatedAppointments.push(...(response.appointments || []));

          hasMore = response.hasMore && (response.appointments?.length || 0) === PAGE_SIZE;
          if (!hasMore || (response.appointments?.length || 0) < PAGE_SIZE) {
            break;
          }

          page += 1;
        }

        const mappedAppointments: Appointment[] = aggregatedAppointments.map(
          (apt: any, idx: number) => ({
            id: apt.id || apt.appointmentId || `${apt.appointmentId || 'apt'}-${idx}`,
            patientName: apt.patientName || apt.patient?.fullName || 'Bệnh nhân',
            date: apt.appointmentDate || apt.date,
            time: apt.appointmentTime || apt.time,
            doctor: apt.doctorName || apt.doctor?.fullName || 'Bác sĩ',
            treatment: mapAppointmentType(apt.type || apt.appointmentType),
            status: mapStatus(apt.status, apt.paymentStatus),
          })
        );

        const upcomingAppointments = mappedAppointments.filter((apt) => {
          return (
            apt.status === 'confirmed' ||
            apt.status === 'pending' ||
            apt.status === 'pending_payment'
          );
        });

        // Get ALL completed appointments in the date range (not just 5)
        const completedList = mappedAppointments
          .filter((apt) => apt.status === 'completed')
          .sort((a, b) => {
            if (!a.date || !b.date) return 0;
            try {
              return parseISO(b.date).getTime() - parseISO(a.date).getTime();
            } catch {
              return 0;
            }
          });

        const sortedUpcoming = upcomingAppointments
          .slice()
          .sort((a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b));
        setUpcomingAppointments(sortedUpcoming);
        setCompletedAppointments(completedList);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        const mock = getMockAppointments();
        const mockUpcoming = mock
          .filter((apt) => ['confirmed', 'pending', 'pending_payment'].includes(apt.status))
          .sort((a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b));
        setUpcomingAppointments(mockUpcoming);
        setCompletedAppointments(mock.filter((apt) => apt.status === 'completed'));
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [patientId]);

  useEffect(() => {
    if (viewMode !== 'upcoming' || userSelectedDate) {
      return;
    }

    if (upcomingAppointments.length === 0) {
      const today = new Date();
      setSelectedDate(today);
      setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
      return;
    }

    const hasAppointmentOnSelected = upcomingAppointments.some((apt) => {
      if (!apt.date) return false;
      try {
        return isSameDay(parseISO(apt.date), selectedDate);
      } catch {
        return false;
      }
    });

    if (hasAppointmentOnSelected) {
      return;
    }

    const firstWithDate = upcomingAppointments.find((apt) => !!apt.date);
    if (!firstWithDate?.date) {
      return;
    }

    try {
      const parsed = parseISO(firstWithDate.date);
      setSelectedDate(parsed);
      setWeekStart(startOfWeek(parsed, { weekStartsOn: 1 }));
      setUserSelectedDate(false);
    } catch {
      // ignore parse errors
    }
  }, [upcomingAppointments, viewMode, userSelectedDate, selectedDate]);

  useEffect(() => {
    if (viewMode !== 'completed' || completedAppointments.length === 0) {
      return;
    }

    const firstWithDate = completedAppointments.find((apt) => !!apt.date);
    if (!firstWithDate?.date) {
      return;
    }

    try {
      const parsed = parseISO(firstWithDate.date);
      setSelectedDate(parsed);
      setWeekStart(startOfWeek(parsed, { weekStartsOn: 1 }));
      setUserSelectedDate(false);
    } catch {
      // ignore parse errors
    }
  }, [viewMode, completedAppointments]);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const sourceAppointments =
    viewMode === 'completed' ? completedAppointments : upcomingAppointments;

  const appointmentsForSelectedDate = sourceAppointments.filter((appointment) => {
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
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
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
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        {!hideHeader && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lịch hẹn sắp tới</h2>
          </div>
        )}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-4">
              <div className="h-16 flex-1 rounded-xl bg-slate-100" />
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
            <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-2">
              <CalendarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {viewMode === 'completed' ? 'Lịch đã hoàn thành' : 'Lịch hẹn sắp tới'}
            </h2>
          </div>
          <button className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700">
            Xem tất cả
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {viewMode === 'completed'
            ? 'Xem lại những cuộc hẹn đã hoàn thành gần đây'
            : 'Theo dõi lịch đã đặt và chuẩn bị cho chuyến khám tiếp theo'}
        </p>
        <div className="flex rounded-full bg-slate-100/70 p-1 text-sm font-medium text-slate-500">
          <button
            type="button"
            onClick={() => {
              setUserSelectedDate(false);
              setViewMode('upcoming');
            }}
            className={cn(
              'relative rounded-full px-4 py-1.5 transition-all duration-200',
              viewMode === 'upcoming' ? 'bg-white text-emerald-700 shadow' : 'hover:text-slate-700'
            )}
          >
            Sắp tới
          </button>
          <button
            type="button"
            onClick={() => {
              setUserSelectedDate(false);
              setViewMode('completed');
            }}
            className={cn(
              'relative rounded-full px-4 py-1.5 transition-all duration-200',
              viewMode === 'completed' ? 'bg-white text-emerald-700 shadow' : 'hover:text-slate-700'
            )}
          >
            Hoàn thành
          </button>
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">
            Tháng {format(weekStart, 'M, yyyy')}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrevWeek}
              className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
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
                onClick={() => {
                  setUserSelectedDate(true);
                  setSelectedDate(day);
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-200',
                  isSelected
                    ? 'scale-105 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                    : isToday
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50'
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
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{appointment.doctor}</h4>
                  <p className="text-sm text-slate-500">{appointment.treatment}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 sm:hidden">
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
                  <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-slate-900">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    {appointment.date}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3 w-3 text-slate-400" />
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

                <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 p-3">
              <CalendarIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-medium text-slate-900">
              {viewMode === 'completed'
                ? 'Không có lịch hoàn thành trong ngày này'
                : 'Bạn chưa có lịch hẹn nào trong ngày này'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {viewMode === 'completed'
                ? 'Hoàn tất lịch khám để xem lại thông tin chi tiết tại đây'
                : 'Đặt lịch khám ngay để chăm sóc sức khỏe của bạn'}
            </p>
            {viewMode === 'upcoming' && (
              <Link
                href="/patient/appointments/book"
                className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700"
              >
                Đặt lịch khám
              </Link>
            )}
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
    case 'COMPLETED':
      return 'completed';
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

function getAppointmentTimestamp(appointment: Appointment): number {
  if (!appointment.date) {
    return Number.MAX_SAFE_INTEGER;
  }

  try {
    const date = parseISO(appointment.date);
    if (appointment.time) {
      const [hours, minutes] = appointment.time.split(':').map((value) => Number(value));
      if (!Number.isNaN(hours)) {
        date.setHours(hours);
        date.setMinutes(Number.isNaN(minutes) ? 0 : minutes);
        date.setSeconds(0, 0);
      }
    }
    return date.getTime();
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}
