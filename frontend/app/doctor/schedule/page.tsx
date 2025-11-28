'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Settings,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { useAuth } from '@/hooks/useAuth';
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
export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const doctorId = user?.userId || user?.id;
    if (!doctorId) return;

    setIsLoading(true);
    try {
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
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl"
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

        {/* Week Navigator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-6 shadow-lg"
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
              {currentWeekOffset === 0 ? 'Tuần này' : `Tuần ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
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
                  const isToday = format(weekDates[index], 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div
                      key={day}
                      className={`border-r border-gray-200 p-4 text-center transition-all ${isToday
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                          : ''
                        }`}
                    >
                      <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}>
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
                        <div key={dayIndex} className="border-r border-gray-200 p-2 min-h-[80px]">
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
          className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-6 shadow-lg"
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
