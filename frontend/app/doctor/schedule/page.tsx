'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Settings,
  Loader2,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { useAuth } from '@/hooks/useAuth';
import { getStaffByUserId, updateMySchedule } from '@/lib/api/staff.service';
import { toast } from 'sonner';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  appointmentTime: string;
  appointmentDate: string;
  status: string;
  type: string;
  reason: string;
}

/**
 * Doctor Schedule Page - Premium Version
 * Route: /doctor/schedule
 */
interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, disabled }) => {
  const selectRef = useRef<HTMLSelectElement>(null);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  }, []);

  const handleScrollToValue = () => {
    if (selectRef.current) {
      // eslint-disable-next-line quotes
      const selectedOption = selectRef.current.querySelector(`option[value="${value}"]`);
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(handleScrollToValue, 50);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="relative">
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        {timeOptions.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
};

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dayConfigs = [
    { key: 'monday', label: 'T2' },
    { key: 'tuesday', label: 'T3' },
    { key: 'wednesday', label: 'T4' },
    { key: 'thursday', label: 'T5' },
    { key: 'friday', label: 'T6' },
    { key: 'saturday', label: 'T7' },
    { key: 'sunday', label: 'CN' },
  ] as const;
  const defaultStart = '08:00';
  const defaultEnd = '17:00';
  const [dayState, setDayState] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >(() =>
    dayConfigs.reduce(
      (acc, d) => {
        acc[d.key] = {
          enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.key),
          start: defaultStart,
          end: defaultEnd,
        };
        return acc;
      },
      {} as Record<string, { enabled: boolean; start: string; end: string }>
    )
  );
  const [timeZone, setTimeZone] = useState('Asia/Ho_Chi_Minh');
  const [isFlexible, setIsFlexible] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  // Calculate current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const weekStart = startOfWeek(addWeeks(today, currentWeekOffset), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const weekDates = getCurrentWeekDates();

  // Fetch appointments for the week
  const fetchAppointments = async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      // Get staff profile to get the correct Staff ID (e.g. CARD-DOC-...)
      const staff = await getStaffByUserId(user.userId);
      const doctorId = staff?.staffId;

      if (!doctorId) {
        console.error('Staff ID not found for user');
        return;
      }

      const startDate = format(weekDates[0], 'yyyy-MM-dd');
      const endDate = format(weekDates[6], 'yyyy-MM-dd');

      const res = await appointmentsService.getDoctorAppointments(doctorId, {
        startDate,
        endDate,
      });

      if (res.appointments) {
        const mapped = res.appointments.map((apt: any) => ({
          id: apt.id || apt.appointment_id,
          patientName: apt.patient_full_name || apt.patientName || 'N/A',
          patientId: apt.patient_id || apt.patientId,
          appointmentTime: apt.appointment_time || apt.appointmentTime,
          appointmentDate: apt.appointment_date || apt.appointmentDate,
          status: (apt.status || '').toString().toUpperCase(),
          type: apt.type,
          reason: apt.reason,
        }));
        setAppointments(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải lịch làm việc');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, currentWeekOffset]);

  // Load current schedule for quick edit
  useEffect(() => {
    const loadSchedule = async () => {
      if (!user?.userId) return;
      try {
        const staff = await getStaffByUserId(user.userId);
        const schedule = staff?.workSchedule;
        if (schedule) {
          setDayState((prev) => {
            // start from a clean slate to avoid leaking stale state
            const next = dayConfigs.reduce(
              (acc, d) => {
                acc[d.key] = {
                  enabled: false,
                  start: defaultStart,
                  end: defaultEnd,
                };
                return acc;
              },
              {} as Record<string, { enabled: boolean; start: string; end: string }>
            );
            if (schedule.dailySchedules && schedule.dailySchedules.length > 0) {
              for (const item of schedule.dailySchedules) {
                const key = item.day.toLowerCase();
                if (next[key]) {
                  next[key] = {
                    enabled: true,
                    start: item.start || defaultStart,
                    end: item.end || defaultEnd,
                  };
                }
              }
            } else if (schedule.workingDays && schedule.workingDays.length > 0) {
              for (const key of Object.keys(next)) {
                if (schedule.workingDays.includes(key)) {
                  next[key] = {
                    enabled: true,
                    start: schedule.workingHours?.start || defaultStart,
                    end: schedule.workingHours?.end || defaultEnd,
                  };
                } else {
                  next[key] = { ...next[key], enabled: false };
                }
              }
            }
            return next;
          });
          setTimeZone(schedule.timeZone || 'Asia/Ho_Chi_Minh');
          setIsFlexible(!!schedule.isFlexible);
        }
      } catch (error) {
        console.error('Failed to load schedule', error);
      }
    };
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const toggleDay = (day: string) => {
    setDayState((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const saveSchedule = async () => {
    if (!user?.userId) {
      toast.error('Chưa đăng nhập');
      return;
    }
    const selectedDays = dayConfigs.filter((d) => dayState[d.key]?.enabled);
    if (selectedDays.length === 0) {
      toast.error('Chọn ít nhất 1 ngày làm việc');
      return;
    }
    for (const d of selectedDays) {
      const { start, end } = dayState[d.key];
      if (!start || !end || start >= end) {
        toast.error(`Giờ bắt đầu phải trước giờ kết thúc cho ${d.label}`);
        return;
      }
    }

    setSavingSchedule(true);
    try {
      const dailySchedules = selectedDays.map((d) => ({
        day: d.key,
        start: dayState[d.key].start,
        end: dayState[d.key].end,
      }));
      const first = dailySchedules[0];
      const res = await updateMySchedule({
        workSchedule: {
          workingDays: selectedDays.map((d) => d.key),
          workingHours: { start: first.start, end: first.end },
          dailySchedules,
          timeZone,
          isFlexible,
        },
      });
      if (res?.success === false) {
        throw new Error(res.message || 'Cập nhật thất bại');
      }
      toast.success('Đã lưu lịch làm việc');
      await fetchAppointments();
    } catch (error) {
      console.error('Update schedule failed', error);
      toast.error('Không thể lưu lịch làm việc');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Get appointments for a specific day and time
  const getAppointmentsForSlot = (dayIndex: number, timeSlot: string) => {
    const slotDate = format(weekDates[dayIndex], 'yyyy-MM-dd');
    return appointments.filter(
      (apt) => apt.appointmentDate === slotDate && apt.appointmentTime.startsWith(timeSlot)
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      CONFIRMED: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      CHECKED_IN: 'bg-green-100 border-green-300 text-green-800',
      IN_PROGRESS: 'bg-blue-100 border-blue-300 text-blue-800',
      COMPLETED: 'bg-gray-100 border-gray-300 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 border-gray-300 text-gray-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 blur-3xl"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  left: `${10 + i * 30}%`,
                  top: `${-20 + i * 20}%`,
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-2xl backdrop-blur-xl"
              >
                <CalendarDays className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <h1 className="mb-2 text-4xl font-bold">Lịch làm việc</h1>
                <p className="text-blue-100">Quản lý lịch khám bệnh trong tuần</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/doctor/profile')}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-purple-600 shadow-lg hover:bg-blue-50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt lịch làm việc
            </Button>
          </div>
        </motion.div>

        {/* Premium Quick Schedule Editor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-2xl"
        >
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Thiết lập lịch làm việc</h3>
                  <p className="text-sm font-medium text-gray-500">
                    Cấu hình thời gian làm việc cho từng ngày
                  </p>
                </div>
              </div>
              <Button
                onClick={saveSchedule}
                disabled={savingSchedule}
                className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-indigo-200 disabled:opacity-70"
              >
                {savingSchedule ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dayConfigs.map((d, idx) => {
                const state = dayState[d.key];
                return (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${state.enabled
                      ? 'border-indigo-100 bg-white shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50'
                      : 'border-gray-100 bg-gray-50/50 opacity-70 grayscale hover:opacity-100 hover:grayscale-0'
                      }`}
                  >
                    {/* Active Indicator Strip */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1.5 transition-colors ${state.enabled ? 'bg-gradient-to-b from-indigo-500 to-blue-500' : 'bg-gray-200'
                        }`}
                    />

                    <div className="p-5 pl-7">
                      <div className="mb-4 flex items-center justify-between">
                        <span
                          className={`text-lg font-bold ${state.enabled ? 'text-gray-900' : 'text-gray-500'
                            }`}
                        >
                          {d.label}
                        </span>
                        <button
                          onClick={() => toggleDay(d.key)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${state.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${state.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="group/input relative">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Bắt đầu
                          </label>
                          <TimeSelect
                            value={state.start}
                            onChange={(time) =>
                              setDayState((prev) => ({
                                ...prev,
                                [d.key]: { ...prev[d.key], start: time },
                              }))
                            }
                            disabled={!state.enabled}
                          />
                        </div>
                        <div className="group/input relative">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Kết thúc
                          </label>
                          <TimeSelect
                            value={state.end}
                            onChange={(time) =>
                              setDayState((prev) => ({
                                ...prev,
                                [d.key]: { ...prev[d.key], end: time },
                              }))
                            }
                            disabled={!state.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-gray-50 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-white p-3 shadow-sm">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">Cấu hình chung</p>
                  <p className="text-sm text-gray-500">Thiết lập múi giờ và chế độ linh hoạt</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="relative">
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="appearance-none rounded-xl border-0 bg-white py-3 pl-4 pr-10 font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Asia/Ho_Chi_Minh">🇻🇳 Asia/Ho_Chi_Minh (GMT+7)</option>
                    <option value="Asia/Bangkok">🇹🇭 Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">🇸🇬 Asia/Singapore (GMT+8)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isFlexible}
                      onChange={(e) => setIsFlexible(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400"
                    />
                    <svg
                      className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-700">Lịch linh hoạt</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Week Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="rounded-xl border-2"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Tuần trước
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              {currentWeekOffset === 0
                ? 'Tuần này'
                : `Tuần ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {format(weekDates[0], 'dd/MM/yyyy', { locale: vi })} -{' '}
              {format(weekDates[6], 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="rounded-xl border-2"
          >
            Tuần sau
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="border-r-2 border-gray-200 p-4 text-center">
                  <Clock className="mx-auto h-6 w-6 text-gray-600" />
                  <p className="mt-1 text-sm font-bold text-gray-700">Giờ</p>
                </div>
                {weekDays.map((day, index) => {
                  const isToday =
                    format(weekDates[index], 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div
                      key={day}
                      className={`border-r border-gray-200 p-4 text-center transition-all ${isToday
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                        : ''
                        }`}
                    >
                      <p
                        className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}
                      >
                        {day}
                      </p>
                      <p className={`mt-1 text-xs ${isToday ? 'text-blue-100' : 'text-gray-500'}`}>
                        {format(weekDates[index], 'dd/MM', { locale: vi })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time Slots */}
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-gray-600">Đang tải lịch làm việc...</p>
                  </div>
                </div>
              ) : (
                timeSlots.map((time, timeIndex) => (
                  <motion.div
                    key={time}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: timeIndex * 0.05 }}
                    className="grid grid-cols-8 border-b border-gray-200 transition-colors hover:bg-blue-50/30"
                  >
                    <div className="flex items-center justify-center border-r border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-700">{time}</p>
                    </div>
                    {weekDays.map((_, dayIndex) => {
                      const slotAppointments = getAppointmentsForSlot(dayIndex, time);
                      return (
                        <div key={dayIndex} className="min-h-[80px] border-r border-gray-200 p-2">
                          {slotAppointments.map((apt) => (
                            <motion.div
                              key={apt.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                              className={`mb-2 cursor-pointer rounded-lg border-2 p-2 shadow-md transition-all hover:shadow-lg ${getStatusColor(
                                apt.status
                              )}`}
                            >
                              <div className="flex items-start gap-2">
                                <User className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                  <p className="truncate text-xs font-bold">{apt.patientName}</p>
                                  <p className="truncate text-xs opacity-80">{apt.reason}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg border-2 border-yellow-300 bg-yellow-100" />
            <span className="text-sm font-medium text-gray-700">Đã xác nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg border-2 border-green-300 bg-green-100" />
            <span className="text-sm font-medium text-gray-700">Đã đến</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg border-2 border-blue-300 bg-blue-100" />
            <span className="text-sm font-medium text-gray-700">Đang khám</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg border-2 border-gray-300 bg-gray-100" />
            <span className="text-sm font-medium text-gray-700">Đã hoàn thành</span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
