'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, User, Filter, CalendarDays, List, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { appointmentsClient } from '@/lib/api/clients';
import { searchStaff } from '@/lib/api/staff.service';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'scheduled';
  color: 'blue' | 'green' | 'yellow' | 'pink' | 'purple';
}

interface TimeSlot {
  time: string;
  appointments: Appointment[];
}

/**
 * Admin Doctor Schedule Page - Redesigned with Soft UI Evolution
 * Maintains all existing API logic and data fetching
 */
export default function DoctorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Array<{ id: string; name: string }>>([]);

  // API calls - Refetch when doctor changes
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        // Add doctor filter to API params if specific doctor selected
        const params: any = { page: 1, pageSize: 1000 };
        if (selectedDoctor !== 'all') {
          params.providerId = selectedDoctor; // Try providerId
          params.doctorId = selectedDoctor;   // Also try doctorId in case API uses this
        }

        const resp = await appointmentsClient.get('/v1/appointments', { params });
        const list = resp.data?.data?.appointments || [];

        console.log(' Loaded appointments:', list.length, 'for doctor:', selectedDoctor);

        const mapped: Appointment[] = list.map((apt: any) => {
          // Handle both snake_case (from API) and camelCase field names
          const rawDate = apt.appointment_date || apt.appointmentDate || apt.appointmentDateTime || '';
          const rawTime = apt.appointment_time || apt.appointmentTime || '';

          return {
            id: apt.appointment_id || apt.appointmentId || apt.id,
            patientId: apt.patient_id || apt.patientId || 'unknown',
            patientName: apt.patient_full_name || apt.patientName || 'Bệnh nhân',
            doctorId: apt.doctor_id || apt.providerId || apt.doctorId || 'unknown',
            doctorName: apt.doctor_full_name || apt.providerName || apt.doctorName || 'Bác sĩ',
            doctorAvatar: '👨‍⚕️',
            date: rawDate.toString().slice(0, 10),
            startTime: rawTime.toString().slice(0, 5) || rawDate.toString().slice(11, 16) || '09:00',
            endTime: '00:00',
            type: apt.type || apt.appointmentType || 'Consultation',
            status: String(apt.status || 'SCHEDULED').toLowerCase() as any,
            color: 'blue',
          };
        });
        setAppointments(mapped);
      } catch (e) {
        console.error('Load appointments failed', e);
        setAppointments([]);
      }
    };

    const loadDoctors = async () => {
      try {
        const res = await searchStaff({ staffType: 'doctor', status: 'active', isActive: true, limit: 100 });
        const opts = (res?.data?.items || []).map((s: any) => ({ id: s.staffId, name: s.personalInfo?.fullName || 'Bác sĩ' }));
        setDoctorOptions(opts);
      } catch { }
    };

    loadAppointments();
    if (doctorOptions.length === 0) {
      loadDoctors();
    }
  }, [selectedDoctor]); // Re-fetch when doctor changes

  // Filter logic - Keep existing
  const getFilteredAppointments = () => {
    return appointments.filter(apt => {
      const matchesDoctor = selectedDoctor === 'all' || apt.doctorId === selectedDoctor;
      return matchesDoctor;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const getDayAppointments = () => {
    // Use local date parts to avoid timezone issues with toISOString()
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return filteredAppointments.filter(apt => apt.date === dateStr);
  };

  const timeSlots: TimeSlot[] = [
    { time: '6:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '06:00') },
    { time: '7:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '07:00') },
    { time: '8:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '08:00') },
    { time: '9:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '09:00') },
    { time: '10:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '10:00') },
    { time: '11:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '11:00') },
    { time: '12:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '12:00') },
    { time: '1:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '13:00') },
    { time: '2:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '14:00') },
    { time: '3:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '15:00') },
    { time: '4:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '16:00') },
    { time: '5:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '17:00') },
    { time: '6:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '18:00') },
    { time: '7:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '19:00') },
    { time: '8:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '20:00') },
    { time: '9:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '21:00') },
    { time: '10:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '22:00') },
    { time: '11:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '23:00') },
  ];

  // Calendar generation - Keep existing
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const currentMonth = monthNames[selectedDate.getMonth()];
  const currentYear = selectedDate.getFullYear();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getAppointmentCount = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().split('T')[0];
    return filteredAppointments.filter((apt) => apt.date === dateString).length;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1600px] px-6 py-6">
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Lịch Bác sĩ</h1>
            <p className="mt-1 text-sm text-slate-600">Xem và quản lý tất cả lịch hẹn khám bệnh của bác sĩ</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-[1600px] p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Panel - Calendar & Filters */}
            <div className="lg:col-span-3">
              <div className="sticky top-6 space-y-4">
                {/* Calendar Card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {currentMonth} {currentYear}
                      </h3>
                      <div className="flex gap-1">
                        <button onClick={() => navigateMonth('prev')} className="rounded-lg p-1.5 transition-colors hover:bg-white/60">
                          <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </button>
                        <button onClick={() => navigateMonth('next')} className="rounded-lg p-1.5 transition-colors hover:bg-white/60">
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 grid grid-cols-7 gap-1">
                      {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-slate-500">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayInfo, index) => {
                        const isSelected = dayInfo.date.toDateString() === selectedDate.toDateString();
                        const isTodayDate = isToday(dayInfo.date);
                        const aptCount = dayInfo.isCurrentMonth ? getAppointmentCount(dayInfo.day, selectedDate.getMonth(), selectedDate.getFullYear()) : 0;

                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedDate(dayInfo.date)}
                            className={`group relative aspect-square rounded-lg text-sm font-medium transition-all ${isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : isTodayDate
                                ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                : dayInfo.isCurrentMonth
                                  ? 'text-slate-700 hover:bg-slate-100'
                                  : 'text-slate-400'
                              }`}
                          >
                            {dayInfo.day}
                            {aptCount > 0 && !isSelected && (
                              <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filters Card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Filter className="h-4 w-4 text-slate-600" />
                      Bộ lọc
                    </h3>
                  </div>
                  <div className="p-4">
                    <label className="mb-2 block text-xs font-medium text-slate-600">Bác sĩ</label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">Tất cả bác sĩ</option>
                      {doctorOptions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add Appointment Button */}
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl">
                  <Plus className="h-5 w-5" />
                  Thêm lịch hẹn
                </button>
              </div>
            </div>

            {/* Right Panel - Schedule View */}
            <div className="lg:col-span-9">
              <div className="space-y-6">
                {/* Schedule Header */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button onClick={handlePrevDay} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                          <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <button onClick={handleNextDay} className="rounded-lg p-2 transition-colors hover:bg-slate-100">
                          <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <span className="text-lg font-semibold text-slate-900">
                          {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button onClick={handleToday} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow">
                        Hôm nay
                      </button>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      {[
                        { id: 'day', label: 'Ngày', icon: CalendarDays },
                        { id: 'week', label: 'Tuần', icon: Calendar },
                        { id: 'month', label: 'Tháng', icon: Calendar },
                        { id: 'list', label: 'Danh sách', icon: List },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setViewMode(tab.id as any)}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${viewMode === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <tab.icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule Content */}
                <div className="min-h-[600px]">
                  {viewMode === 'day' && <DayView timeSlots={timeSlots} />}
                  {viewMode === 'week' && <WeekView selectedDate={selectedDate} appointments={filteredAppointments} />}
                  {viewMode === 'month' && <MonthView selectedDate={selectedDate} appointments={filteredAppointments} />}
                  {viewMode === 'list' && <ListView appointments={getDayAppointments()} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ==================== VIEW COMPONENTS ====================

function DayView({ timeSlots }: { timeSlots: TimeSlot[] }) {
  const router = useRouter();

  // Get smart status based on time comparison
  const getSmartStatus = (status: string, appointmentDate: string, appointmentTime: string): { label: string; className: string } => {
    const normalizedStatus = status.toUpperCase();
    const now = new Date();

    // Parse appointment datetime properly (avoid timezone issues)
    // appointmentDate format: "2025-12-05"
    // appointmentTime format: "15:00"
    const dateParts = appointmentDate.split('-').map(Number);
    const [hours, minutes] = (appointmentTime || '00:00').split(':').map(Number);

    // Create date in local timezone
    const appointmentDateTime = new Date(
      dateParts[0] || now.getFullYear(),  // year
      (dateParts[1] || 1) - 1,             // month (0-indexed)
      dateParts[2] || 1,                   // day
      hours || 0,                          // hours
      minutes || 0,                        // minutes
      0, 0                                 // seconds, ms
    );

    const isPast = appointmentDateTime.getTime() < now.getTime();
    const isFuture = appointmentDateTime.getTime() > now.getTime();

    // Status map
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'CONFIRMED': { label: 'Chờ đến', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      'COMPLETED': { label: 'Đã xong', className: 'bg-green-50 text-green-700 border-green-200' },
      'SCHEDULED': { label: 'Đã đặt', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'PENDING': { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      'CANCELLED': { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
      'CHECKED_IN': { label: 'Đã đến', className: 'bg-teal-50 text-teal-700 border-teal-200' },
      'IN_PROGRESS': { label: 'Đang khám', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      'NO_SHOW': { label: 'Không đến', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    // Time-based logic corrections
    if (isFuture) {
      // Future appointments cannot be completed, in_progress, or checked_in
      if (['COMPLETED', 'IN_PROGRESS', 'CHECKED_IN', 'NO_SHOW'].includes(normalizedStatus)) {
        return { label: 'Chờ đến', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      }
    }

    if (isPast) {
      // Past appointments that are still scheduled/confirmed/pending should show as missed or expired
      if (['SCHEDULED', 'CONFIRMED', 'PENDING'].includes(normalizedStatus)) {
        return { label: 'Đã qua giờ', className: 'bg-orange-50 text-orange-700 border-orange-200' };
      }
    }

    return statusMap[normalizedStatus] || { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
  };

  const getStatusBadge = (status: string, date: string, time: string) => {
    const config = getSmartStatus(status, date, time);
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  if (timeSlots.every(slot => slot.appointments.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <CalendarDays className="mx-auto h-16 w-16 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-600">Không có lịch hẹn</h3>
        <p className="mt-1 text-sm text-slate-500">Chưa có lịch hẹn nào cho ngày này</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Lịch trong ngày</h3>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
        {timeSlots.map((slot, index) => (
          <div key={index} className="group flex min-h-[100px] transition-colors hover:bg-slate-50">
            <div className="w-24 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 p-4">
              <span className="text-sm font-medium text-slate-500">{slot.time}</span>
            </div>

            <div className="relative flex-1 p-3">
              {slot.appointments.length === 0 ? (
                <div className="flex h-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md">
                    <Plus className="h-4 w-4" />
                    Thêm lịch hẹn
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {slot.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => router.push(`/admin/appointments/${apt.id}`)}
                      className="group/card cursor-pointer overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 shadow-sm transition-all hover:shadow-md hover:border-blue-400"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-semibold text-slate-900">{apt.patientName}</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className="rounded-md p-1 opacity-0 transition-opacity hover:bg-white/60 group-hover/card:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>

                      <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="h-3.5 w-3.5" />
                        {apt.startTime}
                      </div>

                      <div className="mb-2 flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-600">{apt.doctorName}</span>
                      </div>

                      {getStatusBadge(apt.status, apt.date, apt.startTime)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ selectedDate, appointments }: { selectedDate: Date; appointments: Appointment[] }) {
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Lịch trong tuần</h3>
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-slate-600">Chờ đến</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] text-slate-600">Đã đặt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-[10px] text-slate-600">Đã xong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="text-[10px] text-slate-600">Đã hủy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-[10px] text-slate-600">Chờ xác nhận</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x divide-slate-200">
        {weekDays.map((day, index) => {
          const dayAppointments = appointments.filter((apt) => {
            const aptDate = new Date(apt.date).toDateString();
            return aptDate === day.toDateString();
          });
          const isToday = day.toDateString() === new Date().toDateString();

          // Get status style for appointment card
          const getStatusStyle = (status: string) => {
            const s = status.toUpperCase();
            switch (s) {
              case 'CONFIRMED':
                return { border: 'border-emerald-300 bg-emerald-50', dot: 'bg-emerald-500', label: 'Chờ đến' };
              case 'COMPLETED':
                return { border: 'border-green-300 bg-green-50', dot: 'bg-green-500', label: 'Đã xong' };
              case 'SCHEDULED':
                return { border: 'border-blue-300 bg-blue-50', dot: 'bg-blue-500', label: 'Đã đặt' };
              case 'PENDING':
                return { border: 'border-amber-300 bg-amber-50', dot: 'bg-amber-500', label: 'Chờ xác nhận' };
              case 'CANCELLED':
                return { border: 'border-red-300 bg-red-50', dot: 'bg-red-500', label: 'Đã hủy' };
              case 'CHECKED_IN':
                return { border: 'border-teal-300 bg-teal-50', dot: 'bg-teal-500', label: 'Đã đến' };
              case 'IN_PROGRESS':
                return { border: 'border-indigo-300 bg-indigo-50', dot: 'bg-indigo-500', label: 'Đang khám' };
              case 'NO_SHOW':
                return { border: 'border-gray-300 bg-gray-50', dot: 'bg-gray-500', label: 'Không đến' };
              default:
                return { border: 'border-slate-200 bg-white', dot: 'bg-slate-400', label: status };
            }
          };

          return (
            <div key={index} className={`min-h-[600px] ${isToday ? 'bg-blue-50/30' : ''}`}>
              <div className={`border-b border-slate-200 p-3 text-center ${isToday ? 'bg-blue-100' : 'bg-slate-50'}`}>
                <div className="text-xs font-medium text-slate-500">{dayNames[index]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>{day.getDate()}</div>
              </div>

              <div className="space-y-2 p-2">
                {dayAppointments.map((apt) => {
                  const statusStyle = getStatusStyle(apt.status);
                  return (
                    <div key={apt.id} className={`cursor-pointer rounded-lg border p-2 text-xs transition-all hover:shadow ${statusStyle.border}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{apt.startTime}</span>
                        <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} title={statusStyle.label}></span>
                      </div>
                      <div className="mt-1 truncate text-slate-700">{apt.patientName}</div>
                      <div className="mt-0.5 truncate text-slate-500">{apt.doctorName}</div>
                      <div className="mt-1.5 text-[10px] font-medium text-slate-600">{statusStyle.label}</div>
                    </div>
                  );
                })}
                {dayAppointments.length === 0 && <div className="pt-4 text-center text-xs text-slate-400">Không có lịch</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ selectedDate, appointments }: { selectedDate: Date; appointments: Appointment[] }) {
  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const monthDays = generateMonthDays();

  const getAppointmentsForDate = (date: Date) => {
    // Use local date parts to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Tháng {selectedDate.getMonth() + 1}, {selectedDate.getFullYear()}
        </h3>
      </div>

      <div className="p-4">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((dayInfo, index) => {
            const dayAppointments = getAppointmentsForDate(dayInfo.date);
            const aptCount = dayAppointments.length;
            const isTodayDate = isToday(dayInfo.date);

            return (
              <div
                key={index}
                className={`min-h-[100px] rounded-lg border p-2 transition-all ${isTodayDate ? 'border-blue-300 bg-blue-50' : dayInfo.isCurrentMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                  }`}
              >
                <div className={`mb-1 text-sm font-medium ${isTodayDate ? 'text-blue-700' : dayInfo.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                  {dayInfo.day}
                </div>
                {aptCount > 0 && (
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {aptCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ListView({ appointments }: { appointments: Appointment[] }) {
  // Get smart status based on time comparison
  const getSmartStatus = (status: string, appointmentDate: string, appointmentTime: string): { label: string; className: string } => {
    const normalizedStatus = status.toUpperCase();
    const now = new Date();

    // Parse appointment datetime
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    const isPast = appointmentDateTime < now;
    const isFuture = appointmentDateTime > now;

    // Status map
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'CONFIRMED': { label: 'Chờ đến', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      'COMPLETED': { label: 'Đã xong', className: 'bg-green-50 text-green-700 border-green-200' },
      'SCHEDULED': { label: 'Đã đặt', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'PENDING': { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      'CANCELLED': { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
      'CHECKED_IN': { label: 'Đã đến', className: 'bg-teal-50 text-teal-700 border-teal-200' },
      'IN_PROGRESS': { label: 'Đang khám', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      'NO_SHOW': { label: 'Không đến', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    // Time-based logic corrections
    if (isFuture) {
      if (['COMPLETED', 'IN_PROGRESS', 'CHECKED_IN', 'NO_SHOW'].includes(normalizedStatus)) {
        return { label: 'Chờ đến', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      }
    }

    if (isPast) {
      if (['SCHEDULED', 'CONFIRMED', 'PENDING'].includes(normalizedStatus)) {
        return { label: 'Đã qua giờ', className: 'bg-orange-50 text-orange-700 border-orange-200' };
      }
    }

    return statusMap[normalizedStatus] || { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
  };

  const getStatusBadge = (status: string, date: string, time: string) => {
    const config = getSmartStatus(status, date, time);
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <User className="mx-auto h-16 w-16 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-600">Không có lịch hẹn</h3>
        <p className="mt-1 text-sm text-slate-500">Không tìm thấy lịch hẹn nào cho ngày này</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Bệnh nhân</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Bác sĩ</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {appointments.map((apt) => (
              <tr key={apt.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {apt.startTime}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {apt.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <span className="font-medium text-slate-900">{apt.patientName}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{apt.doctorName}</td>
                <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(apt.status, apt.date, apt.startTime)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
