'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { useAuth } from '@/hooks/useAuth';
import { getStaffByUserId, updateMySchedule } from '@/lib/api/staff.service';
import { toast } from 'sonner';
import { format, addWeeks, startOfWeek, addDays } from 'date-fns';
import {
  ScheduleHero,
  WeeklyScheduleCards,
  GlobalConfigBar,
  WeekNavigator,
  CalendarGrid,
  StatusLegend,
  DAY_CONFIGS,
  type DayScheduleState,
} from '@/components/schedule/doctor';

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

const DEFAULT_START = '08:00';
const DEFAULT_END = '17:00';

/**
 * Doctor Schedule Page - Redesigned
 * Route: /doctor/schedule
 * 
 * A modern scheduling tool for doctors featuring:
 * - Weekly schedule configuration with day-by-day settings
 * - Global timezone and flexible schedule options
 * - Weekly calendar grid with appointment visualization
 */
export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Schedule configuration state
  const [dayState, setDayState] = useState<Record<string, DayScheduleState>>(() =>
    DAY_CONFIGS.reduce((acc, d) => {
      acc[d.key] = {
        enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.key),
        start: DEFAULT_START,
        end: DEFAULT_END,
      };
      return acc;
    }, {} as Record<string, DayScheduleState>)
  );
  const [timeZone, setTimeZone] = useState('Asia/Ho_Chi_Minh');
  const [isFlexible, setIsFlexible] = useState(false);

  // Calculate current week dates - memoized to prevent infinite re-renders
  const weekDates = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(addWeeks(today, currentWeekOffset), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentWeekOffset]);

  // Fetch appointments for the week
  const fetchAppointments = useCallback(async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      const staff = await getStaffByUserId(user.userId);
      const doctorId = staff?.staffId;

      if (!doctorId) {
        console.error('Staff ID not found for user');
        setIsLoading(false);
        return;
      }

      // Calculate dates inside the function to avoid dependency issues
      const today = new Date();
      const weekStart = startOfWeek(addWeeks(today, currentWeekOffset), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');

      const res = await appointmentsService.getDoctorAppointments(doctorId, {
        startDate,
        endDate,
        pageSize: 100,
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
  }, [user?.userId, currentWeekOffset]);

  // Load current schedule
  useEffect(() => {
    const loadSchedule = async () => {
      if (!user?.userId) return;
      try {
        const staff = await getStaffByUserId(user.userId);
        const schedule = staff?.workSchedule;
        if (schedule) {
          setDayState(() => {
            const next = DAY_CONFIGS.reduce((acc, d) => {
              acc[d.key] = {
                enabled: false,
                start: DEFAULT_START,
                end: DEFAULT_END,
              };
              return acc;
            }, {} as Record<string, DayScheduleState>);

            if (schedule.dailySchedules?.length > 0) {
              for (const item of schedule.dailySchedules) {
                const key = item.day.toLowerCase();
                if (next[key]) {
                  next[key] = {
                    enabled: true,
                    start: item.start || DEFAULT_START,
                    end: item.end || DEFAULT_END,
                  };
                }
              }
            } else if (schedule.workingDays?.length > 0) {
              for (const key of Object.keys(next)) {
                if (schedule.workingDays.includes(key)) {
                  next[key] = {
                    enabled: true,
                    start: schedule.workingHours?.start || DEFAULT_START,
                    end: schedule.workingHours?.end || DEFAULT_END,
                  };
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
  }, [user?.userId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Day toggle handler
  const handleToggleDay = (day: string) => {
    setDayState((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
    setHasUnsavedChanges(true);
  };

  // Time update handler
  const handleUpdateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setDayState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  // Save schedule handler
  const handleSaveSchedule = async () => {
    if (!user?.userId) {
      toast.error('Chưa đăng nhập');
      return;
    }

    const selectedDays = DAY_CONFIGS.filter((d) => dayState[d.key]?.enabled);
    if (selectedDays.length === 0) {
      toast.error('Chọn ít nhất 1 ngày làm việc');
      return;
    }

    for (const d of selectedDays) {
      const { start, end } = dayState[d.key];
      if (!start || !end || start >= end) {
        toast.error(`Giờ bắt đầu phải trước giờ kết thúc cho ${d.fullLabel}`);
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
      setHasUnsavedChanges(false);
      await fetchAppointments();
    } catch (error) {
      console.error('Update schedule failed', error);
      toast.error('Không thể lưu lịch làm việc');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Week navigation handlers
  const handlePrevWeek = () => setCurrentWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setCurrentWeekOffset((prev) => prev + 1);
  const handleGoToThisWeek = () => setCurrentWeekOffset(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <ScheduleHero />

        {/* Weekly Schedule Configuration */}
        <WeeklyScheduleCards
          dayState={dayState}
          onToggleDay={handleToggleDay}
          onUpdateDayTime={handleUpdateDayTime}
          onSave={handleSaveSchedule}
          isSaving={savingSchedule}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Global Configuration */}
        <GlobalConfigBar
          timeZone={timeZone}
          isFlexible={isFlexible}
          onTimeZoneChange={(tz) => {
            setTimeZone(tz);
            setHasUnsavedChanges(true);
          }}
          onFlexibleChange={(flex) => {
            setIsFlexible(flex);
            setHasUnsavedChanges(true);
          }}
        />

        {/* Week Navigation */}
        <WeekNavigator
          weekDates={weekDates}
          currentWeekOffset={currentWeekOffset}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onGoToThisWeek={handleGoToThisWeek}
        />

        {/* Calendar Grid */}
        <CalendarGrid
          weekDates={weekDates}
          appointments={appointments}
          isLoading={isLoading}
        />

        {/* Status Legend */}
        <StatusLegend />
      </div>
    </DashboardLayout>
  );
}
