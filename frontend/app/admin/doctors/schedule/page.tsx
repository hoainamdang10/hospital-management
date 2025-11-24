'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, User } from 'lucide-react';
import { appointmentsClient } from '@/lib/api/clients';
import { searchStaff } from '@/lib/api/staff.service';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  color: 'blue' | 'green' | 'yellow' | 'pink' | 'purple';
}

interface TimeSlot {
  time: string;
  appointments: Appointment[];
}

/**
 * Admin - Lịch làm việc bác sĩ
 */
export default function DoctorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const resp = await appointmentsClient.get('/v1/appointments', {
          params: { page: 1, pageSize: 1000 },
        });
        const list = resp.data?.data?.appointments || [];
        const mapped: Appointment[] = list.map((apt: any) => ({
          id: apt.appointmentId || apt.id,
          patientId: apt.patientId || 'unknown',
          patientName: apt.patientName || 'Bệnh nhân',
          doctorId: apt.providerId || apt.doctorId || 'unknown',
          doctorName: apt.providerName || apt.doctorName || 'Bác sĩ',
          doctorAvatar: '👨‍⚕️',
          date: (apt.appointmentDate || apt.appointmentDateTime || '').toString().slice(0, 10),
          startTime: (apt.appointmentTime?.toString().slice(0, 5) || (apt.appointmentDateTime || '').toString().slice(11, 16)) || '09:00',
          endTime: '00:00',
          type: apt.appointmentType || 'Consultation',
          status: String(apt.status || 'SCHEDULED').toLowerCase() as any,
          color: 'blue',
        }));
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
    loadDoctors();
  }, []);



  // Filter appointments based on selected date and doctor
  const getFilteredAppointments = () => {
    return appointments.filter(apt => {
      const matchesDoctor = selectedDoctor === 'all' || apt.doctorId === selectedDoctor;
      return matchesDoctor;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  // Get appointments for selected date (Day view)
  const getDayAppointments = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return filteredAppointments.filter(apt => apt.date === dateStr);
  };

  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '09:00') },
    { time: '10:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '10:00') },
    { time: '11:00 AM', appointments: getDayAppointments().filter(a => a.startTime === '11:00') },
    { time: '12:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '12:00') },
    { time: '1:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '13:00') },
    { time: '2:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '14:00') },
    { time: '3:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '15:00') },
    { time: '4:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '16:00') },
    { time: '5:00 PM', appointments: getDayAppointments().filter(a => a.startTime === '17:00') },
  ];

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = monthNames[selectedDate.getMonth()];
  const currentYear = selectedDate.getFullYear();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Schedule</h1>
            <p className="text-gray-600 mt-1">Manage and view doctor schedules and appointments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Calendar</h2>
              <p className="text-sm text-gray-600 mb-4">Select a date to view schedules.</p>

              {/* Mini Calendar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{currentMonth} {currentYear}</span>
                </div>

                {/* Calendar Grid */}
                <div>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayInfo, index) => {
                      const isSelected = dayInfo.date.toDateString() === selectedDate.toDateString();
                      const isTodayDate = isToday(dayInfo.date);

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(dayInfo.date)}
                          className={`
                            aspect-square p-1 text-sm rounded-md transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : isTodayDate
                                ? 'bg-gray-900 text-white font-semibold'
                                : dayInfo.isCurrentMonth
                                  ? 'text-gray-900 hover:bg-gray-100'
                                  : 'text-gray-400 hover:bg-gray-50'
                            }
                          `}
                        >
                          {dayInfo.day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter by Doctor */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả bác sĩ</option>
                  {doctorOptions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Add Appointment Button */}
              <button className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add Appointment
              </button>
            </div>
          </div>

          {/* Right Content - Schedule View */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* View Mode Tabs */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(['day', 'week', 'month', 'list'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`
                          px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize
                          ${viewMode === mode
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Date Navigation */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule Content - Conditional Rendering */}
              <div className="p-6">
                {viewMode === 'day' && <DayView timeSlots={timeSlots} />}
                {viewMode === 'week' && <WeekView selectedDate={selectedDate} appointments={filteredAppointments} />}
                {viewMode === 'month' && <MonthView selectedDate={selectedDate} appointments={filteredAppointments} />}
                {viewMode === 'list' && <ListView selectedDate={selectedDate} appointments={filteredAppointments} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ==================== VIEW COMPONENTS ====================

// Day View Component
function DayView({ timeSlots }: { timeSlots: TimeSlot[] }) {
  const getColorClasses = (status: string, color: string) => {
    if (status === 'cancelled') {
      return 'bg-gray-100 border-gray-200 text-gray-500 decoration-slate-400';
    }
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold mb-1">Daily Schedule</h2>
          <p className="text-sm text-gray-600">
            All appointments for today
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        {timeSlots.map((slot, index) => (
          <div key={index} className="group flex border-b border-gray-100 last:border-0 min-h-[100px] hover:bg-gray-50 transition-colors relative">
            {/* Time Column */}
            <div className="w-24 flex-shrink-0 border-r border-gray-100 p-4 bg-gray-50/50">
              <span className="text-sm font-medium text-gray-500 sticky top-0">
                {slot.time}
              </span>
            </div>

            {/* Content Column */}
            <div className="flex-1 p-2 relative">
              {/* Hover Add Button (Ghost) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {slot.appointments.length === 0 && (
                  <button className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all transform translate-y-2 group-hover:translate-y-0">
                    <Plus className="h-4 w-4" />
                    Schedule Appointment
                  </button>
                )}
              </div>

              {/* Appointments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-20">
                {slot.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`
                      border rounded-md p-3 transition-all hover:shadow-md cursor-pointer
                      ${getColorClasses(appointment.status, appointment.color)}
                      ${appointment.status === 'cancelled' ? 'opacity-75' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-semibold text-sm truncate ${appointment.status === 'cancelled' ? 'line-through' : ''}`}>
                        {appointment.patientName}
                      </h3>
                      <span className={`
                        text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold
                        ${appointment.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'bg-white/50'}
                      `}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs opacity-90 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                      <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-xs shadow-sm">
                        {appointment.doctorAvatar}
                      </div>
                      <span className="text-xs font-medium truncate">
                        {appointment.doctorName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ selectedDate, appointments }: { selectedDate: Date; appointments: Appointment[] }) {
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  const getAppointmentsForDayAndTime = (day: Date, time: string) => {
    const dateStr = day.toISOString().split('T')[0];
    const hour = time.includes('PM') && !time.startsWith('12')
      ? String(parseInt(time.split(':')[0]) + 12).padStart(2, '0')
      : time.split(':')[0].padStart(2, '0');

    return appointments.filter(apt =>
      apt.date === dateStr && apt.startTime === `${hour}:00`
    );
  };

  const getColorClasses = (status: string, color: string) => {
    if (status === 'cancelled') {
      return 'bg-gray-100 border-gray-200 text-gray-500 decoration-slate-400';
    }
    const colors = {
      blue: 'bg-blue-100 border-blue-200 text-blue-900',
      green: 'bg-green-100 border-green-200 text-green-900',
      yellow: 'bg-yellow-100 border-yellow-200 text-yellow-900',
      pink: 'bg-pink-100 border-pink-200 text-pink-900',
      purple: 'bg-purple-100 border-purple-200 text-purple-900'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 border-gray-200 text-gray-900';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Weekly Schedule</h2>
        <p className="text-sm text-gray-600">
          Week of {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-sm font-medium text-gray-500"></div>
            {weekDays.map((day, index) => (
              <div key={index} className={`text-center p-2 rounded-lg border border-transparent ${isToday(day) ? 'bg-blue-50 border-blue-100' : ''}`}>
                <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xs mt-1 ${isToday(day) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                  {day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-8 gap-2 mb-2 min-h-[80px]">
              <div className="text-xs font-medium text-gray-400 py-2 text-right pr-4 pt-3">
                {time}
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDayAndTime(day, time);
                return (
                  <div
                    key={dayIndex}
                    className={`
                      border rounded-lg p-1 transition-colors relative group
                      ${dayAppointments.length > 0 ? 'bg-white border-gray-200' : 'bg-gray-50/50 border-dashed border-gray-200 hover:bg-blue-50/30 hover:border-blue-200'}
                    `}
                  >
                    {/* Empty Slot Hover Effect */}
                    {dayAppointments.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <Plus className="h-4 w-4 text-blue-400" />
                      </div>
                    )}

                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`
                          text-xs p-2 rounded border mb-1 shadow-sm cursor-pointer hover:shadow-md transition-all
                          ${getColorClasses(apt.status, apt.color)}
                          ${apt.status === 'cancelled' ? 'opacity-60' : ''}
                        `}
                      >
                        <div className={`font-semibold truncate ${apt.status === 'cancelled' ? 'line-through' : ''}`}>
                          {apt.patientName}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] opacity-75">{apt.startTime}</span>
                          {apt.status === 'cancelled' && (
                            <span className="text-[8px] bg-gray-200 px-1 rounded">HỦY</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-black/5">
                          <span className="text-[10px] truncate opacity-90">{apt.doctorName.split(' ').pop()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ selectedDate, appointments }: { selectedDate: Date; appointments: Appointment[] }) {
  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const monthDays = generateMonthDays();

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getColorClasses = (status: string, color: string) => {
    if (status === 'cancelled') {
      return 'bg-gray-100 text-gray-500 line-through opacity-75';
    }
    const colors = {
      blue: 'bg-blue-100 text-blue-900',
      green: 'bg-green-100 text-green-900',
      yellow: 'bg-yellow-100 text-yellow-900',
      pink: 'bg-pink-100 text-pink-900',
      purple: 'bg-purple-100 text-purple-900'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-900';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Monthly Schedule</h2>
        <p className="text-sm text-gray-600">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {monthDays.map((dayInfo, index) => {
            const dayAppointments = getAppointmentsForDate(dayInfo.date);
            const visibleAppointments = dayAppointments.slice(0, 3);
            const remainingCount = dayAppointments.length - 3;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${!dayInfo.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday(dayInfo.date) ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-semibold mb-2 ${!dayInfo.isCurrentMonth ? 'text-gray-400' :
                  isToday(dayInfo.date) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                  {dayInfo.day}
                </div>
                <div className="space-y-1">
                  {visibleAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`text-xs p-1 rounded ${getColorClasses(apt.status, apt.color)}`}
                    >
                      <div className="font-semibold truncate">{apt.patientName}</div>
                      <div className="text-xs opacity-75">{apt.startTime}</div>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{remainingCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// List View Component
function ListView({ selectedDate, appointments }: { selectedDate: Date; appointments: Appointment[] }) {
  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayAppointments = appointments.filter(apt => apt.date === dateStr).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Appointments List</h2>
        <p className="text-sm text-gray-600">
          All appointments for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • All Doctors
        </p>
      </div>

      {dayAppointments.length > 0 ? (
        <div className="space-y-3">
          {dayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{apt.patientName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{apt.startTime} - {apt.endTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{apt.doctorAvatar}</span>
                  <span className="text-sm font-medium text-gray-700">{apt.doctorName}</span>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full capitalize">
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No appointments for this date</p>
        </div>
      )}
    </div>
  );
}
